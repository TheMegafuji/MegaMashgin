import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import {
  VISITOR_COOKIE,
  bootstrapVisitor,
  requireVisitor,
  visitorOrders,
  visitorOrder,
} from './visitors.js';
import { suggestionRequestSchema } from '../shared/discovery.js';
import { suggest, type DiscoveryOptions } from './discovery.js';
import fastifyStatic from '@fastify/static';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { pageMetadata, robots, sitemap } from './seo.js';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { Pool } from 'pg';
import { idempotencyKeySchema, orderRequestSchema } from '../shared/contracts.js';
import { ApiError } from './errors.js';
import { readMenu } from './catalog.js';
import { bearer, findSession, newSession } from './sessions.js';
import { getOrder, placeOrder } from './orders.js';
export interface AppOptions {
  pool: Pool;
  instanceId?: string;
  logger?: boolean;
  publicOrigin?: string;
  staticRoot?: string;
  sessionLimit?: number;
  release?: string;
  discovery?: DiscoveryOptions;
  afterCommit?: (request: import('fastify').FastifyRequest) => Promise<void>;
  /** Explicit browser origins for the token-only game transport. */
  gameOrigins?: readonly string[];
  /** Per-IP session admission for explicit game origins; ordinary checkout stays at sessionLimit. */
  gameSessionLimit?: number;
  /** Shared game session admission; ordinary checkout stays at 600 per ten minutes. */
  gameSessionGlobalLimit?: number;
  /** Shared game order admission for explicit game sessions; ordinary checkout stays at 300/minute. */
  gameOrderLimit?: number;
}
export async function buildApp(options: AppOptions) {
  const gameOrigins = new Set(
    (options.gameOrigins ?? [])
      .map((origin) => {
        try {
          const url = new URL(origin);
          if (
            (url.protocol !== 'http:' && url.protocol !== 'https:') ||
            url.username ||
            url.password ||
            (url.pathname !== '/' && url.pathname !== '')
          )
            return null;
          return url.origin;
        } catch {
          return null;
        }
      })
      .filter((origin): origin is string => origin !== null),
  );
  const app = Fastify({
    bodyLimit: 16384,
    requestTimeout: 15000,
    connectionTimeout: 15000,
    genReqId: () => randomUUID(),
    requestIdHeader: false,
    logger: options.logger
      ? {
          level: process.env.LOG_LEVEL ?? 'info',
          redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'],
        }
      : false,
  });
  await app.register(cookie);
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: null,
      },
    },
  });
  app.addHook('onRequest', async (request, reply) => {
    reply
      .header('x-request-id', request.id)
      .header('x-instance-id', options.instanceId ?? 'api-local');
    if (request.url.startsWith('/api')) reply.header('cache-control', 'no-store');
    const origin = request.headers.origin;
    const gameOrigin = origin !== undefined && gameOrigins.has(origin);
    if (gameOrigin) {
      reply
        .header('access-control-allow-origin', origin)
        .header('vary', 'Origin')
        .header('access-control-allow-methods', 'GET,POST,OPTIONS')
        .header('access-control-allow-headers', 'Authorization,Content-Type,Idempotency-Key')
        .header(
          'access-control-expose-headers',
          'X-Request-Id,X-Instance-Id,Idempotency-Replayed,Retry-After',
        )
        .header('access-control-max-age', '600');
      // The game profile can only use anonymous bearer sessions. Visitor-cookie
      // endpoints stay same-origin, even if a caller spoofs a browser origin.
      if (request.url.startsWith('/api/visitor') || request.url.startsWith('/api/discovery'))
        throw new ApiError(
          403,
          'ORIGIN_NOT_ALLOWED',
          'Visitor operations must use the checkout origin.',
        );
      if (request.method === 'OPTIONS') return reply.status(204).send();
      if (request.headers.cookie || request.headers['x-visitor-id'])
        throw new ApiError(
          403,
          'ORIGIN_NOT_ALLOWED',
          'The game transport cannot use visitor credentials.',
        );
    }
    if (
      request.headers['sec-fetch-site'] === 'cross-site' &&
      !['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
      !gameOrigin
    )
      throw new ApiError(403, 'ORIGIN_NOT_ALLOWED', 'Open this checkout directly to continue.');
    if (origin && request.method !== 'GET' && request.method !== 'HEAD' && !gameOrigin) {
      let sameHost = false;
      try {
        sameHost = new URL(origin).host === request.headers.host;
      } catch {
        /* Reject malformed origins. */
      }
      if (!sameHost && origin !== options.publicOrigin)
        throw new ApiError(
          403,
          'ORIGIN_NOT_ALLOWED',
          'This request did not originate from the checkout.',
        );
    }
  });
  app.setErrorHandler((error: Error & { statusCode?: number; code?: string }, request, reply) => {
    if (error instanceof ApiError) {
      if (error.status === 429)
        reply.header('retry-after', request.url.startsWith('/api/orders') ? '60' : '600');
      return reply
        .status(error.status)
        .send({ error: { code: error.code, message: error.message, requestId: request.id } });
    }
    if (error instanceof z.ZodError || error.statusCode === 400)
      return reply.status(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Some order details are not valid. Please review your order.',
          requestId: request.id,
        },
      });
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500)
      return reply.status(error.statusCode).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'This request could not be accepted.',
          requestId: request.id,
        },
      });
    request.log.error({ err: error }, 'request failed');
    return reply.status(503).send({
      error: {
        code: 'TEMPORARILY_UNAVAILABLE',
        message: 'We could not confirm your order. Keep this screen open and try again.',
        requestId: request.id,
      },
    });
  });
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
  const staticRoot = options.staticRoot;
  if (staticRoot && existsSync(staticRoot)) {
    const home = pageMetadata(
      await readFile(resolve(staticRoot, 'index.html'), 'utf8'),
      options.publicOrigin,
    );
    const press = pageMetadata(
      await readFile(resolve(staticRoot, 'press/index.html'), 'utf8'),
      options.publicOrigin,
      '/press/',
    );
    app.get('/', async (_request, reply) =>
      reply.type('text/html').header('cache-control', 'no-cache').send(home),
    );
    app.get('/index.html', async (_request, reply) => reply.redirect('/'));
    app.get('/press', async (_request, reply) => reply.redirect('/press/'));
    app.get('/press/', async (_request, reply) => reply.type('text/html').send(press));
    app.get('/press/index.html', async (_request, reply) => reply.redirect('/press/'));
    app.get('/robots.txt', async (_request, reply) =>
      reply.type('text/plain').send(robots(options.publicOrigin)),
    );
    app.get('/sitemap.xml', async (_request, reply) =>
      reply.type('application/xml').send(sitemap(options.publicOrigin)),
    );
    await app.register(fastifyStatic, { root: resolve(staticRoot), maxAge: 0, index: false });
    app.setNotFoundHandler((_request, reply) =>
      reply
        .status(404)
        .send({ error: { code: 'NOT_FOUND', message: 'This page could not be found.' } }),
    );
  }
  await app.ready();
  return app;
}
