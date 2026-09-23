# Vercel frontend deployment

Production checkout: **https://www.megamashgin.top** (the apex redirects here).
Game: **https://game.megamashgin.top**. API: **https://api.megamashgin.top**.

## Which API setting does this checkout use?

`VITE_CHECKOUT_API_URL` is **not consumed by this checkout**. That variable belongs
to the companion game. Remove it from this Vercel project's variables; the build
prints an explanation if it remains configured.

The browser calls `/api/*` on its own checkout origin with same-origin cookies.
`vercel.json` proxies those paths to `https://api.megamashgin.top/api/*` and disables
caching for personalized routes. Do not point browser fetch directly at the API
host: the checkout's HttpOnly visitor cookie and same-origin policy depend on this
proxy. The game uses a separate, explicitly allowed token-only transport.

This follows Vercel's [external rewrite support](https://vercel.com/docs/routing/rewrites).
A Vite-prefixed variable is only useful when code actually reads it; see
[Vite environment variables](https://vite.dev/guide/env-and-mode).

## Required settings

| Where      | Setting          | Value                                        |
| ---------- | ---------------- | -------------------------------------------- |
| Vercel     | Build command    | `npm run build:web`                          |
| Vercel     | Output directory | `dist/client`                                |
| Vercel     | `PUBLIC_ORIGIN`  | `https://www.megamashgin.top`                |
| Oracle API | `PUBLIC_ORIGIN`  | `https://www.megamashgin.top`                |
| Oracle API | `GAME_ORIGINS`   | Preserve the explicit published game origins |

The API origin check compares the forwarded browser Origin with its configured
`PUBLIC_ORIGIN`. Loading the menu successfully does **not** prove purchases work:
GET `/api/menu` may return 200 while POST `/api/visitor` returns 403. This exact
failure was observed on the public checkout on 2026-09-23 UTC before correction.
Never add the checkout to `GAME_ORIGINS`: that profile intentionally forbids
visitor cookies and history.

After changing the server-only setting in the existing protected release env,
recreate **only the two API services** from the current release. No database
migration or volume deletion is needed. Changing only a Vercel variable cannot
change the Oracle API environment. Never copy database or provider keys to Vercel.

## Publication and validation

The `build:web` script builds static assets, then adds canonical/social metadata,
robots.txt and sitemap.xml. Explicit HTTPS `PUBLIC_ORIGIN` or the production
Vercel URL supplies metadata. Preview deployments remain noindex. Preview API
access also requires a deliberately accepted backend origin; no wildcard is used.

After redeploying the frontend and aligning the API origin, use a fresh browser:

1. Menu loads and guest-profile creation succeeds, without the reconnect banner.
2. Add an item, confirm fictional payment and see a persisted receipt.
3. Reload, then open My orders: the same receipt belongs to that browser.
4. A separate browser context sees no history belonging to the first one.

Local tests cover the proxy's forwarded Origin behavior. They do not deploy a
Vercel project or apply the remote environment setting. Deployment status and any
remaining action are reported in the current delivery evidence.
