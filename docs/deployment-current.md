# Current API deployment

Deployment date: 2026-09-22 (UTC)

The deployment recorded on this date runs the Mashgin API on the Oracle Ampere ARM64 host at
`147.15.78.236` behind the existing Nginx TLS virtual host:

- Checkout public URL / `PUBLIC_ORIGIN`: `https://checkout-lab.147-15-78-236.sslip.io` (preserved)
- API public URL: `https://api.megamashgin.top`
- API TLS certificate: valid through 2026-12-21; renewal dry-run passed
- Release: `r20260922t062903z-markettycoon`
- Compose services: `api1`, `api2`, `migrate`, `postgres`, and `proxy`
- Host proxy binding: `127.0.0.1:8080`; Nginx owns public ports 80 and 443
- Current release pointer: `/opt/checkout-lab/current`

The source identity used for this release is Git commit `e5b6c6d14f82380339a342dd5b16773cc2ae093e`
plus the verified working-tree changes recorded by the deployment process
(`6278fb1b10c5ddd5d21fed05d094163ba73c56f6`). The release was therefore built
from a working tree, rather than claimed as a clean commit-only artifact. The
sanitized machine-readable record is
[`docs/evidence/deployment-current.json`](evidence/deployment-current.json).

The checked-in ARM64 overlay is
[`infra/compose.ampere.yaml`](../infra/compose.ampere.yaml). A release can be
recreated from the release directory with a mode-600 env file containing only
the deployment values (including `DB_PASSWORD` and `DB_NAME`):

```sh
docker compose -p checkout-lab \
  --env-file /opt/checkout-lab/shared/release.env \
  -f compose.yaml -f infra/compose.ampere.yaml \
  config --services
docker compose -p checkout-lab \
  --env-file /opt/checkout-lab/shared/release.env \
  -f compose.yaml -f infra/compose.ampere.yaml \
  up -d --build
```

The overlay maps the existing external volume `checkout-lab_database`, points
the current API at `checkout_current`, and binds the internal proxy only to
loopback. It does not contain credentials or change host Nginx configuration.

The image was built on the host from the current source with the repository
Dockerfile. The old `checkout-lab` containers were replaced after a database
backup. The other applications sharing the host and their Nginx routes were
left running and were not included in the Compose operation.

## Verification

The following checks passed after the replacement:

- Public `/health/live`, `/health/ready`, and `/api/menu`: HTTP 200.
- Public menu: 76 products.
- Game-origin session (`Origin: http://localhost:5180`): HTTP 201.
- Synthetic order: HTTP 201 with a server receipt.
- Exact replay of the same idempotency key and body: HTTP 200 and the same receipt.
- Changed body with the same idempotency key: HTTP 409.
- CORS returned the requested explicit game origin and the game response exposed
  the request, instance, replay, and retry headers. The production origins
  `https://game.megamashgin.top` and
  `https://mashgin-market-tycoon.vercel.app` were checked against the API domain;
  an unrelated origin received no CORS grant. The API-domain record also covers
  the `OPTIONS /api/sessions` preflight and the Certbot renewal dry-run.
- Both API containers, PostgreSQL, and the proxy reported healthy in Compose.
- PostgreSQL independently reported one current smoke session and one current
  smoke order. The preserved historical database remains separate.

A subsequent real-browser check against this public API deliberately intercepted the already-committed response, reloaded the game and recovered the same promoted receipt using the same intention. The game credited it once. This needs no fault-injection endpoint on the server. [Remote recovery record](evidence/remote/connected.json).

A bounded scheduled-arrival check offered **80 purchases/minute for 65 seconds** from the developer workstation: **87 of 87 HTTP 201 receipts**, zero errors, duplicate IDs or dropped arrivals, and **250 ms p95 for session creation plus order confirmation**. This is a short observation of this deployed host, not maximum capacity, high availability or an SLA. [Raw remote measurement](evidence/remote/rate-80.json). A separate SQL check matched all 87 listed IDs and their expected totals in the deployed database ([database record](evidence/remote/database-check.json)).

## Database and rollback

The previous test volume contained an incompatible historical prototype schema
(`schema_migrations.version` was an integer and the current tables were absent),
so the new API uses a separate database named `checkout_current` in the same
PostgreSQL volume. The old `checkout` database was not modified.

Before replacement, the deployment created:

- `/opt/checkout-lab/shared/backups/checkout-20260922T062843Z-pre-markettycoon.dump`
- `/opt/checkout-lab/releases/pre-markettycoon-20260922T062843Z`
- `/opt/checkout-lab/shared/.env.rollback-20260922T062843Z`

All three are permission-restricted. The active deployment environment is
`/opt/checkout-lab/shared/release.env` with mode 600; no credential values are
stored in this document.

To roll back, stop the current `checkout-lab` Compose project and recreate it
from the preserved release directory with its preserved environment and the
existing shared-host compose overlay. Do not remove the PostgreSQL volume.

## Game access and limits

The host does not serve the MarketTycoon frontend; the production frontend
uses the Vercel origin `https://mashgin-market-tycoon.vercel.app`, with the
custom game alias `https://game.megamashgin.top` also allowed by the API. Local
development origins remain enabled for the token-only game profile
(`localhost`/`127.0.0.1` on ports 5180, 4180, and 4181). Visitor-cookie routes
remain same-origin checkout routes. The deployment uses the bounded game quotas
from the current source: 15,000 sessions per 10 minutes per IP and globally,
and 1,800 game orders per minute. Ordinary checkout limits remain separate.
See [API-domain evidence](evidence/api-domain-preparation.json).

The optional Jev provider was not configured in this release (`jevConfigured:
false`); no paid provider call was needed for deployment verification.
