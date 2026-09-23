import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { idempotencyKeySchema, orderRequestSchema } from '../../shared/contracts.js';
import { suggestionRequestSchema } from '../../shared/discovery.js';
import { readMenu } from '../modules/catalog/catalog.js';
import { suggest } from '../modules/discovery/discovery.js';
import { getOrder, placeOrder } from '../modules/orders/orders.js';
import { bearer, findSession, newSession } from '../modules/sessions/sessions.js';
import {
  VISITOR_COOKIE,
  bootstrapVisitor,
  requireVisitor,
  visitorOrder,
  visitorOrders,
} from '../modules/visitors/visitors.js';
import { ApiError } from './errors.js';
import type { AppOptions } from './options.js';
export function registerRoutes(
  app: FastifyInstance,
  options: AppOptions,
  gameOrigins: Set<string>,
) {
  app.get('/health/live', async () => ({
    status: 'ok',
    release: options.release ?? 'development',
  }));
  app.get('/health/ready', async () => {
    await options.pool.query('SELECT version FROM schema_migrations LIMIT 1');
    return { status: 'ready' };
  });
  app.get('/api/menu', async () => readMenu(options.pool));
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: options.publicOrigin?.startsWith('https://') ?? false,
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  };
  const visitorFor = (request: import('fastify').FastifyRequest) =>
    requireVisitor(options.pool, request.cookies[VISITOR_COOKIE]);
  async function purchaseToken(request: import('fastify').FastifyRequest) {
    const token = bearer(request.headers.authorization);
    const session = await findSession(options.pool, token);
    if (session.visitor_id) {
      const visitor = await visitorFor(request);
      if (visitor.id !== session.visitor_id)
        throw new ApiError(403, 'VISITOR_MISMATCH', 'This purchase belongs to another visitor.');
    }
    return token;
  }
  app.post('/api/visitor', async (request, reply) => {
    z.object({})
      .strict()
      .parse(request.body ?? {});
    const result = await bootstrapVisitor(
      options.pool,
      request.cookies[VISITOR_COOKIE],
      request.ip,
    );
    if (result.token) reply.setCookie(VISITOR_COOKIE, result.token, cookieOptions);
    return result.visitor;
  });
  app.post('/api/visitor/forget', async (request, reply) => {
    z.object({})
      .strict()
      .parse(request.body ?? {});
    const visitor = await visitorFor(request);
    await options.pool.query('UPDATE visitors SET revoked_at=now() WHERE id=$1', [visitor.id]);
    reply.clearCookie(VISITOR_COOKIE, { path: '/' });
    return reply.status(204).send();
  });
  app.get('/api/visitor/orders', async (request) => {
    const visitor = await visitorFor(request);
    const { cursor } = z.object({ cursor: z.uuid().optional() }).strict().parse(request.query);
    return visitorOrders(options.pool, visitor.id, cursor);
  });
  app.get('/api/visitor/orders/:id', async (request) => {
    const visitor = await visitorFor(request);
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    return visitorOrder(options.pool, visitor.id, id);
  });
  app.post('/api/discovery', async (request) => {
    const visitor = await visitorFor(request);
    const { query } = suggestionRequestSchema.parse(request.body);
    return suggest(
      options.pool,
      visitor.id,
      await readMenu(options.pool),
      query,
      options.discovery,
    );
  });

  app.post('/api/sessions', async (request, reply) => {
    z.object({})
      .strict()
      .parse(request.body ?? {});
    const expectedVisitor = request.headers['x-visitor-id'];
    if (expectedVisitor !== undefined) z.uuid().parse(expectedVisitor);
    const visitor =
      request.cookies[VISITOR_COOKIE] || expectedVisitor ? await visitorFor(request) : undefined;
    if (expectedVisitor && visitor?.id !== expectedVisitor)
      throw new ApiError(
        403,
        'VISITOR_MISMATCH',
        'This browser identity could not be verified. Reload to continue.',
      );
    const gameOrigin =
      request.headers.origin !== undefined && gameOrigins.has(request.headers.origin);
    const sessionLimit = gameOrigin ? (options.gameSessionLimit ?? 15000) : options.sessionLimit;
    const session = await newSession(
      options.pool,
      request.ip,
      sessionLimit,
      visitor?.id,
      gameOrigin,
      gameOrigin ? (options.gameSessionGlobalLimit ?? 15000) : 600,
    );
    return reply.status(201).send(session);
  });
  app.post('/api/sessions/close', async (request, reply) => {
    z.object({})
      .strict()
      .parse(request.body ?? {});
    const session = await findSession(options.pool, await purchaseToken(request));
    await options.pool.query('UPDATE customer_sessions SET closed_at = now() WHERE id = $1', [
      session.id,
    ]);
    return reply.status(204).send();
  });
  app.post('/api/orders', async (request, reply) => {
    const body = orderRequestSchema.parse(request.body);
    const key = idempotencyKeySchema.parse(request.headers['idempotency-key']);
    const result = await placeOrder(
      options.pool,
      await purchaseToken(request),
      key,
      body,
      options.gameOrderLimit ?? 1800,
    );
    if (!result.replayed && options.afterCommit) await options.afterCommit(request);
    return reply
      .header('idempotency-replayed', String(result.replayed))
      .status(result.replayed ? 200 : 201)
      .send(result.receipt);
  });
  app.get('/api/orders/:id', async (request) => {
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    return getOrder(options.pool, await purchaseToken(request), id);
  });
}
