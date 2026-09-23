import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { AppOptions } from './options.js';
import { pageMetadata, robots, sitemap } from './seo.js';
export async function registerStatic(app: FastifyInstance, options: AppOptions) {
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
}
