# Vercel frontend deployment

The Vercel project is static frontend hosting. The build:web script runs Vite into
dist/client, then applies the existing SEO helpers to the generated checkout and
/press/ pages. The metadata step reads only the explicitly supplied publication-origin variables and does not copy credentials. Keep secrets out of Vite-exposed VITE_* variables; .env files are excluded by .vercelignore.

The checked-in vercel.json rewrites only /api/* to the current Oracle API and
forces no-store behavior for those personalized routes. Hashed Vite assets receive
immutable caching. /press/ remains a static file copied from public/press/.

For the Oracle API, set PUBLIC_ORIGIN to the production checkout domain used by
Vercel, such as https://checkout.example.com. Keep GAME_ORIGINS separate: add
the published MarketTycoon origin only when the game is deployed and verified.
Never add a wildcard origin, and never put TypeSafe, database, or provider keys in
Vercel frontend variables.

Production metadata is generated only for an explicit HTTPS PUBLIC_ORIGIN, or
for VERCEL_ENV=production with VERCEL_PROJECT_PRODUCTION_URL. Preview builds
remain noindex and contain no preview canonical or sitemap URL. Preview API
checks require an origin that the Oracle API accepts; do not broaden origin
validation with a wildcard. No Vercel publication has been performed by this
change.
