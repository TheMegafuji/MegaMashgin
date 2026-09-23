# Mashgin Market — Checkout

### A small market with a checkout you can trust.

Browse **76 products in nine categories**, find something with instant search or optional Jev suggestions, place a fictional order and return to your receipts. Built for a person using a tablet alone.

[![A compact view of the market and its quick-add products](docs/images/checkout-overview.png)](https://www.megamashgin.top/)

**[Open the checkout](https://www.megamashgin.top/) · [Play Mashgin Market](https://game.megamashgin.top/) · [Measured API results](docs/evidence/live-game/README.md)**

**React · Fastify · PostgreSQL · two API replicas · anonymous visitor history · optional Jev**

> Independent portfolio concept by Megafuji, inspired by Mashgin. Products and payments are fictional. The app never asks for a card number or CVV.

## Video walkthrough

[**Watch the project demo →**](docs/videos/megamashgin.mp4)

A walkthrough of the checkout and the companion market game. [Download the MP4](docs/videos/megamashgin.mp4?raw=1) (21.4 MB).

## Try the complete product

With **Docker and Docker Compose v2** using Linux containers:

```sh
docker compose up --build -d --wait
```

Open **http://localhost:8090**. The stack builds the web app, migrates/seeds PostgreSQL and starts two API processes behind Caddy. No provider account or API key is needed.

**Browse → add items → review → choose demo payment → confirm → open My orders.** Reloading preserves uncertain purchases, while confirmed history belongs to this browser's anonymous visitor. Use **Forget this device** before handing a shared tablet to someone else.

```sh
docker compose down
```

Stopping preserves orders. Add `--volumes` only when you intend to erase the demonstration database.

**Public frontend:** [www.megamashgin.top](https://www.megamashgin.top/). The API runs on Oracle ARM64; the frontend runs on Vercel. See [Vercel configuration and origin checks](docs/vercel.md) and the [deployment record](docs/deployment-current.md).

## See the experience

| Find something                                                   | Return to your purchases                                             |
| ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| ![Search and product suggestions](docs/images/market-search.png) | ![Anonymous visitor receipt history](docs/images/market-history.png) |

Local search responds immediately. Optional **Jev** suggestions arrive asynchronously and may select only validated catalog IDs. Provider failure leaves normal search and checkout usable. The illustrated search view above is a recorded UI example; [live Jev evidence](docs/evidence/jev-live.json) separately documents actual provider calls.

| Review before committing                                             | A persisted receipt                           |
| -------------------------------------------------------------------- | --------------------------------------------- |
| ![Order review and fictional payment choice](docs/images/review.png) | ![Confirmed receipt](docs/images/receipt.png) |

## What happens behind the button

```mermaid
flowchart LR
  T[Tablet checkout] --> P[HTTPS / reverse proxy]
  G[Market game: optional client] --> P
  P --> A[API replica 1]
  P --> B[API replica 2]
  A --> D[(PostgreSQL)]
  B --> D
  A -. optional discovery .-> J[Jev]
  B -. optional discovery .-> J
```

The modular backend can run in multiple processes. PostgreSQL coordinates sessions, prices, admission and orders; correctness never depends on one process remembering a purchase.

| Situation                                   | Observable behavior                                                                |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| Double tap or concurrent identical requests | One order; retries return its original receipt.                                    |
| Order commits but the response disappears   | The exact saved intention is replayed and recovers the same order.                 |
| Client tampers with totals                  | Prices and integer-cent calculations come from the server.                         |
| Payload changes under the same key          | Explicit conflict instead of a second purchase.                                    |
| Someone submits another visitor's UUID      | UUID alone does not authenticate; history requires the scoped HttpOnly credential. |
| AI is slow or unavailable                   | Local search and purchasing keep working.                                          |

[Architecture](docs/architecture.md) · [API contract](docs/api.openapi.json) · [reviewer walkthrough](docs/market-tour.md).

## Play the game. Inspect the real purchases.

**[Launch Mashgin Market →](https://game.megamashgin.top/)**

[![The published game showing real API receipt traces](docs/evidence/live-game/browser/live-game.png)](https://game.megamashgin.top/)

The companion **MarketTycoon** client uses this same checkout API. Build a market,
welcome shoppers and expand the store. The animated invitation on the checkout
opens the game in another tab, keeping your shopping bag in place.

**A fresh game starts in Offline sandbox.** To exercise the real backend, open
**Settings → Live checkout API**, use `https://api.megamashgin.top`, enable
**Show HTTP status, latency and purchase trace**, then apply. The game credits a
sale only after a real receipt is confirmed. Animation speed is not network speed.

### Measured on the public API — 2026-09-23 UTC

| Experiment                         | Observed result                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| Published game, live mode          | 35 unique receipts; all 35 retrieved again; game ledger matched $76.11          |
| Lost committed response            | Reload recovered the same receipt; game credited it once                        |
| Scheduled API arrivals, 60 seconds | 1,280 of 1,280 purchases confirmed; zero errors or dropped arrivals             |
| HTTP work during that write window | 2,560 POSTs: one session and one order per purchase; about 42.6 requests/second |
| Purchase latency                   | 99 ms p95 for session creation **plus** order confirmation                      |
| Persistence readback               | All 1,280 receipts matched subsequent authenticated GETs                        |

Both API replicas served the measurement. The load driver calls the same public
session/order endpoints as the game, independently of its animation. The game
browser proof and load-driver proof are separate experiments. These short runs do
not establish maximum capacity, a production SLA or host-level high availability.
The current run verifies persistence through the API; direct SQL confirmation is
not claimed without a new database check. [Raw results, method and reproduction](docs/evidence/live-game/README.md).

Game sessions use bearer credentials and an explicit CORS origin allowlist. They
do not access visitor cookies or Jev, and cannot choose arbitrary prices. Game
promotions are calculated by the server. [Operations and bounded quotas](docs/operations.md).

## Develop and verify

Prerequisites: **Node 24**, npm, Docker and Compose.

```sh
npm ci --ignore-scripts
cp .env.example .env
npm run db:up
npm run db:migrate
npm run dev
```

PowerShell equivalent for copying the environment template: `Copy-Item .env.example .env`. Preserve an existing `.env` with your local credentials. Development web: **http://localhost:5190**; API: **http://127.0.0.1:3190**.

```sh
npm run verify
npx playwright install chromium
npm run test:e2e
```

Verification covers formatting, architecture/spec references, API contract drift, types, unit tests, real PostgreSQL transactions and production builds. Browser tests cover user flows, recovery and selected accessibility checks. The test harness refuses to reset a database outside the dedicated local `checkout_test` target.

```sh
npm run demo:check
node scripts/demo-check.mjs --restart
```

These bounded **local** checks send concurrent identical purchases, reject changed payloads and recover receipts after restarting the two API containers. They are correctness tests, not a production-capacity claim. [Recorded evidence and limits](docs/evidence.md).

## Optional AI, with a real boundary

Set `TYPESAFE_API_KEY` in the ignored `.env` and recreate the API containers. The credential stays server-side. Jev can suggest products; it cannot change a price, add an unchecked product ID or commit a purchase.

Defaults bound provider attempts to 100/day across replicas and discovery requests to 60/visitor/hour. Cache, leases, response validation and cooldown prevent unnecessary repeated calls. `npm run test:jev:live` explicitly sends seven fictional queries and is excluded from routine verification.

[Jev design and recorded live results](docs/jev-discovery.md) · [visitor identity](docs/visitor-identity.md).

## How AI helped build it

The useful evidence is the decision trail: [accepted brief](docs/ai/plan.md), [implementation corrections](docs/ai/build-log.md), [tradeoffs](docs/decisions.md) and [executed checks](docs/evidence.md). These are actual work records, not reconstructed chat transcripts or claims of independent human review. Reusable prompts are labeled as templates.

## Repository map

| Directory            | Responsibility                                                          |
| -------------------- | ----------------------------------------------------------------------- |
| `src/client/`        | App composition, catalog/checkout/history features, audio and shared UI |
| `src/server/`        | HTTP adapters, business modules and PostgreSQL infrastructure           |
| `src/shared/`        | Strict transport schemas; no server infrastructure                      |
| `migrations/`        | Versioned schema/catalog with checksum checks                           |
| `tests/`             | Contracts, real PostgreSQL, browser and accessibility tests             |
| `infra/`             | Proxy and deployment configuration                                      |
| `scripts/`           | Current verification, database and asset-generation tools               |
| `public/`            | Runtime artwork, licenses and press materials                           |
| `specs/`, `docs/ai/` | Behavior contracts and actual construction record                       |

The earlier prototype and unused temporary tooling were removed. [Cleanup record](docs/cleanup.md). `.env`, credentials, database dumps, dependencies and local test caches are excluded from publication. Licensed model sources remain because they regenerate the current artwork.

## Art, brand and limits

The product combines original concept branding, Kenney CC0 food renders, original drink illustrations, subtle warm-item vapor and adjustable category-specific cart sounds with an explicit preview. `/press/` contains the downloadable brand kit and source credits. [Brand and provenance](docs/brand-and-experience.md).

This is not a payment processor, inventory system or fulfillment service. Visitor credentials last 30 days; purchase sessions last 24 hours. Browser storage is needed to recover an uncertain intention. Selected automated accessibility checks are evidence for those scenarios, not a blanket certification. See [operations](docs/operations.md) for deployment, retention and backup scope.

## Publication review

[Documentation index](docs/README.md) provides the review path. [Vercel frontend setup](docs/vercel.md) contains the prepared publication configuration; [the Oracle record](docs/deployment-current.md) describes the deployment already executed.
