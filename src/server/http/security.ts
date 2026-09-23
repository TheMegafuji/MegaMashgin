import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ApiError } from './errors.js';
import type { AppOptions } from './options.js';
export async function registerSecurity(app: FastifyInstance, options: AppOptions) {
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
  return gameOrigins;
}
