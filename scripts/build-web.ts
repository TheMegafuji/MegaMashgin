import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pageMetadata, publicationOrigin, robots, sitemap } from '../src/server/seo.js';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const output = resolve(root, 'dist', 'client');
const vercelEnv = process.env.VERCEL_ENV;
const explicitOrigin = process.env.PUBLIC_ORIGIN;
const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

function configuredOrigin(): string | undefined {
  // Preview deployments stay noindex even when a production URL is present.
  if (vercelEnv === 'preview') return undefined;
  if (explicitOrigin) return publicationOrigin(explicitOrigin) ?? undefined;
  if (vercelEnv === 'production' && productionUrl) {
    return publicationOrigin('https://' + productionUrl) ?? undefined;
  }
  return undefined;
}

const origin = configuredOrigin();
const indexPath = resolve(output, 'index.html');
const pressPath = resolve(output, 'press', 'index.html');
const index = await readFile(indexPath, 'utf8');
const press = await readFile(pressPath, 'utf8');

await writeFile(indexPath, pageMetadata(index, origin));
await writeFile(pressPath, pageMetadata(press, origin, '/press/'));
await writeFile(resolve(output, 'robots.txt'), robots(origin));
await writeFile(resolve(output, 'sitemap.xml'), sitemap(origin));

console.log(
  JSON.stringify({
    output,
    origin: origin ?? null,
    vercelEnv: vercelEnv ?? null,
    previewNoindex: vercelEnv === 'preview' || origin === undefined,
    press: true,
    secretsLoaded: false,
  }),
);
