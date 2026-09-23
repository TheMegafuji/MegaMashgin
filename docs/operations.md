# Operations

## Local topology

Compose project: `megafuji-checkout`. Browser entry point: **http://localhost:8090**.

| Service        | Exposure                           | Persistence                                  |
| -------------- | ---------------------------------- | -------------------------------------------- |
| Caddy proxy    | Loopback port 8090                 | Configuration from infra/Caddyfile           |
| API 1 / API 2  | Private Compose network, port 3190 | Stateless; purchase state in PostgreSQL      |
| PostgreSQL 17  | No published port                  | Named volume                                 |
| Migration task | Runs to completion before APIs     | Applied versions and checksums in PostgreSQL |

API containers run as a non-root user, with a read-only root filesystem and no added Linux capabilities. Health checks distinguish a living process from database readiness.

A dedicated development composition uses loopback 55542 for `checkout` and 55543 for `checkout_test`. The test database uses a temporary filesystem and is deliberately disposable. Its reset cannot target a database with another name or an arbitrary remote host.

## Start, inspect, stop

```sh
docker compose up --build -d --wait
docker compose ps
docker compose logs --tail=100 api1 api2
node scripts/demo-check.mjs --restart
docker compose down
```

The demo verifier uses a single synthetic customer, twenty concurrent identical requests and a conflicting retry. Tokens are excluded from its artifact. It is local-only and refuses remote targets.

## Admission and retention

Creating sessions spends counters in PostgreSQL: 600 globally per 10 minutes and 30 per source connection IP per 10 minutes. Under the supplied proxy, the connection-IP bucket is conservative and may be shared across visitors; it is not advertised as per-user protection. The public demo retains this conservative bucket. Define and test a trusted-proxy policy before relying on forwarded IP addresses for per-client limits.

Each session can create one order. A shared order counter allows up to 300 new orders per minute. Payload, quantities and amount are bounded. These limits are demonstration policies, not evidence of capacity.

Purchase sessions expire in 24 hours. Visitor credentials last 30 days. The manual `npm run db:prune` command removes up to 500 old unowned sessions, up to 500 expired/revoked visitors and their dependent orders, plus expired cache/counters and telemetry older than 30 days. Revoked visitors have a seven-day grace period. Active visitor history is not deleted merely because its purchase session expired. It uses DATABASE_URL and must only be directed at the intended demo database. No scheduler was installed by this build.

## Migration discipline

Each migration runs once under a PostgreSQL advisory lock and records its SHA-256 checksum. Editing an applied migration causes an error; add another migration instead. Schema changes require backward-compatible rollout planning before any future multi-version deployment.

The initial catalog lives in migration 001; migration 003 adds the expanded market without removing original products. Read prices from the database; an updated catalog changes the menu revision and requires the customer to review again. Existing orders replay from snapshots without repricing.

## Backup and restore

Use a custom-format dump inside the dedicated database container:

```sh
docker compose exec -T postgres pg_dump -U checkout -d checkout -Fc -f /tmp/checkout.dump
docker compose cp postgres:/tmp/checkout.dump ./checkout.dump
```

Keep exports outside Git. Validate restoration in a separate scratch database before relying on a backup. The current remote replacement created a custom-format backup at `/opt/checkout-lab/shared/backups/checkout-20260922T062843Z-pre-markettycoon.dump`; it is retained with the prior release and rollback environment. The current API database is `checkout_current`, so its matching dump command is below. Run it in a Linux shell on the host from `/opt/checkout-lab/current`, and keep the resulting dump outside Git:

```sh
docker compose -p checkout-lab \
  --env-file /opt/checkout-lab/shared/release.env \
  -f compose.yaml -f infra/compose.ampere.yaml \
  exec -T postgres pg_dump -U checkout -d checkout_current -Fc > checkout_current.dump
```

## Deployment boundary

An ARM64 deployment was executed on the Oracle Ampere host at `147.15.78.236` using the existing HTTPS route `checkout-lab.147-15-78-236.sslip.io`. The image was built natively from the verified working tree, two API containers and a loopback-only Caddy proxy were started, migrations completed, and public health/menu plus synthetic idempotency checks passed. The sanitized record and rollback details are in [deployment-current.md](deployment-current.md); the checked-in [ARM64 Compose overlay](../infra/compose.ampere.yaml) contains no credentials. The API is also published at `https://api.megamashgin.top` with a dedicated Nginx vhost and TLS certificate expiring 2026-12-21; the existing checkout `PUBLIC_ORIGIN` remains `https://checkout-lab.147-15-78-236.sslip.io` until the checkout domain changes. See [API-domain evidence](evidence/api-domain-preparation.json).

Other applications sharing the host and their Nginx routes remain outside this Compose project. The historical prototype database was preserved; because its schema is incompatible with the current migrations, the active API uses `checkout_current` in the same PostgreSQL volume. The active environment is mode 600 and carries the existing random database credential needed to preserve the volume; no provider credential is configured.

Image tags are pinned to major runtime families and npm dependencies to exact versions through package-lock.json. The active release retains the prior release directory and a database backup for rollback. A future public rollout should still pin verified image digests and run a separate restore drill before relying on an off-host backup.

The existing pre-release backup is on the same host. Off-host backup scheduling and a separate restore drill are not yet recorded; a local backup is not protection against losing the VM.

## Limits to explain

Single-host failure stops both APIs and the database. No real payment, stock reservation, tax calculation, receipt compliance, kitchen workflow or verified personal accounts are implemented. Anonymous visitor identity and history are implemented. Availability endpoints and bounded experiments do not prove an SLA or throughput target.

## Optional discovery

The root `.env` key is interpolated only into API containers; it is excluded from images and Git. Set PUBLIC_ORIGIN to the actual HTTPS origin for public deployment so the visitor cookie is Secure. After changing the key, recreate the APIs. A 401/403 provider response opens a five-minute shared cooldown for that credential; corrected keys use a new cooldown identity. See [Jev discovery](jev-discovery.md) for quotas, failure behavior and telemetry.

## Public page metadata

Set `PUBLIC_ORIGIN` to the real HTTPS origin to emit canonical/social URLs and enable indexing. Local or HTTP origins remain noindex and expose no public URLs in the sitemap. `/press/` is a static, accessible presentation page; `/robots.txt` and `/sitemap.xml` are generated from trusted configuration. Unknown paths return 404. Rebuild/recreate the APIs after changing the origin. The Vercel static build uses the same metadata helpers; see [Vercel setup](vercel.md). The historical brand-only run preceded the [recorded Oracle release](deployment-current.md).

## Optional MarketTycoon browser client

`GAME_ORIGINS` is a comma-separated explicit origin allowlist. It is empty by default for direct Node deployments; the local Compose stack allows localhost/127.0.0.1 on 5180, 4180 and 4181. The deployed allowlist includes `https://game.megamashgin.top` and `https://mashgin-market-tycoon.vercel.app`; local development origins remain available. Cross-origin game requests use anonymous purchase bearer tokens and `credentials: omit`; visitor cookies, visitor routes and AI discovery remain unavailable to that profile. No wildcard or credentialed CORS is enabled. The game never receives TypeSafe or Suno credentials. `GAME_SESSIONS_LIMIT` defaults to 15,000 sessions per source IP per 10-minute bucket for those explicit game origins, and `GAME_SESSIONS_GLOBAL_LIMIT` defaults to 15,000 shared game sessions per 10 minutes. `GAME_ORDERS_LIMIT` defaults to 1,800 game orders per minute. These are finite game-only budgets sized for a measured 1,280-orders/minute four-store target; scale out only after measuring the database and proxy. Ordinary checkout keeps its existing 30-per-IP, 600-shared-session and 300-orders/minute limits.
