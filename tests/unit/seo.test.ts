import { expect, it } from 'vitest';
import { publicationOrigin, pageMetadata, robots, sitemap } from '../../src/server/http/seo.js';
it('[OPS-04] local or invalid publication settings do not advertise a canonical public site', () => {
  const template = '<meta name="robots" content="noindex,follow" /><!-- public-metadata -->';
  for (const value of [
    undefined,
    'http://localhost:8090',
    'https://localhost',
    'https://127.0.0.1',
    'javascript:alert(1)',
    'https://name:secret@example.org',
  ]) {
    expect(publicationOrigin(value)).toBeNull();
    expect(pageMetadata(template, value)).not.toContain('canonical');
    expect(robots(value)).toContain('Disallow: /');
    expect(sitemap(value)).not.toContain('<loc>');
  }
});
it('[OPS-04] public metadata and sitemap use only the configured HTTPS origin', () => {
  const html = pageMetadata(
    '<meta name="robots" content="noindex,follow" /><!-- public-metadata -->',
    'https://market.example.org/untrusted-path?x=1',
    '/press/',
  );
  expect(html).toContain('https://market.example.org/press/');
  expect(html).toContain('https://market.example.org/brand/social-card.png');
  expect(html).toContain('index,follow');
  expect(html).not.toContain('untrusted-path');
  expect(robots('https://market.example.org')).toContain('Disallow: /api/');
  expect(sitemap('https://market.example.org')).toContain(
    '<loc>https://market.example.org/press/</loc>',
  );
});
