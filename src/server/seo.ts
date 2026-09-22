function escape(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
export function publicationOrigin(configured?: string): string | null {
  if (!configured) return null;
  try {
    const url = new URL(configured);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      /^(localhost|127\.|\[::1\])/.test(url.hostname) ||
      url.hostname.endsWith('.local')
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}
export function pageMetadata(html: string, configured: string | undefined, path = '/') {
  const origin = publicationOrigin(configured);
  const canonical = origin
    ? '<link rel="canonical" href="' +
      escape(origin + path) +
      '" /><meta property="og:url" content="' +
      escape(origin + path) +
      '" /><meta property="og:image" content="' +
      escape(origin + '/brand/social-card.png') +
      '" /><meta name="twitter:image" content="' +
      escape(origin + '/brand/social-card.png') +
      '" />'
    : '';
  return html
    .replace('<!-- public-metadata -->', canonical)
    .replace(
      'name="robots" content="noindex,follow"',
      'name="robots" content="' + (origin ? 'index,follow' : 'noindex,follow') + '"',
    );
}
export function robots(configured?: string) {
  const origin = publicationOrigin(configured);
  return origin
    ? 'User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /health/\nSitemap: ' +
        origin +
        '/sitemap.xml\n'
    : 'User-agent: *\nDisallow: /\n';
}
export function sitemap(configured?: string) {
  const origin = publicationOrigin(configured);
  return (
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    (origin
      ? ['/', '/press/']
          .map((path) => '<url><loc>' + escape(origin + path) + '</loc></url>')
          .join('')
      : '') +
    '</urlset>'
  );
}
