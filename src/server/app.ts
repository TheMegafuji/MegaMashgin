import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import type { AppOptions } from './http/options.js';
import { registerRoutes } from './http/routes.js';
import { registerSecurity } from './http/security.js';
import { registerStatic } from './http/static.js';
export type { AppOptions } from './http/options.js';
export async function buildApp(options: AppOptions) {
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
  const gameOrigins = await registerSecurity(app, options);
  registerRoutes(app, options, gameOrigins);
  await registerStatic(app, options);
  await app.ready();
  return app;
}
