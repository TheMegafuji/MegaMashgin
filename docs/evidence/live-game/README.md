# Public game and API evidence

Measured on **2026-09-23 UTC**, from the developer's Windows workstation, against
`https://game.megamashgin.top` and `https://api.megamashgin.top`.

## Separate claims, separate experiments

1. **The published game really sends purchases:** [browser/result.json](browser/result.json).
   A fresh browser started offline. Settings explicitly selected the live API.
   The existing debug clock advanced the simulation; HTTP remained real with no
   interception. 35 HTTP 201 receipts were observed and subsequently fetched.
   The game counted exactly 35 purchases and $76.11, matching those receipts.
   This is a functional integration proof, not a real-time load measurement.
2. **A lost response does not create another sale:** [recovery/connected.json](recovery/connected.json).
   A real 201 was obtained before its browser delivery was deliberately aborted.
   Reload replayed the identical intention and recovered the original ID. The
   game credited the receipt once. Only this experiment intercepts a response.
3. **The public API accepts a measured arrival rate:** the standalone driver
   creates sessions and orders through the same public game-origin endpoints.
   It does not depend on the renderer, game clock, debug funds or local mock data.

| Offered purchases/min | Offering window | Confirmed   | p95 session + order | Later GET matches |
| --------------------- | --------------- | ----------- | ------------------- | ----------------- |
| 80                    | 15 seconds      | 20/20       | 104 ms              | 20/20             |
| 320                   | 15 seconds      | 80/80       | 110 ms              | 80/80             |
| 1,280                 | 60 seconds      | 1,280/1,280 | 99 ms               | 1,280/1,280       |

[80/min raw](rate-80.json) · [320/min raw](rate-320.json) · [1,280/min raw](rate-1280.json).
Every stage had zero errors, duplicate IDs or dropped arrivals. Both `api-1` and
`api-2` answered. In the largest stage, the offering and drain window was 60.034
seconds: approximately 1,279.3 completed purchases/minute and 42.64 write requests/
second. Each purchase requires two POSTs. Readback happened afterwards and is not
included in that write-window rate or purchase latency. The menu GET is also
excluded. CORS preflights from real browsers are not simulated by this driver.

## What persistence means here

The driver retains bearer credentials only in process memory, then fetches **every
receipt** with a new authenticated HTTP request after the write window. Complete
receipt JSON must match. The implementation reads persisted orders from PostgreSQL;
this is stronger than counting on-screen animations or POST success alone.

The current dataset does **not** include a new independent SQL query. The SSH
identity attempted during the run was rejected. Historical SQL evidence in
`../remote/database-check.json` belongs to a different, earlier experiment.
Do not relabel it as confirmation of these new IDs.

## Reproduce deliberately

These commands create fictional orders on the public demonstration. They never
contact a payment processor. Run stages sequentially; do not run multiple load
sources simultaneously. The script caps arrivals at 1,280 purchases/minute,
duration at 60 seconds, active purchases at 32 and individual HTTP calls at ten
seconds. Five observed errors stop new arrivals. No quotas are changed.

```sh
node scripts/check-live-game.mjs
# Recovery proof (POSIX shell; set these variables equivalently in PowerShell):
GAME_URL=https://game.megamashgin.top CHECKOUT_URL=https://api.megamashgin.top node scripts/check-game-recovery.mjs
node scripts/measure-game-api.mjs https://api.megamashgin.top 80 15 artifacts/rate-80.json
node scripts/measure-game-api.mjs https://api.megamashgin.top 320 15 artifacts/rate-320.json
node scripts/measure-game-api.mjs https://api.megamashgin.top 1280 60 artifacts/rate-1280.json
```

The game defaults to the offline sandbox; use Settings to enable live mode during
an interview. The new invocation of a proof script is a new experiment, not a way
to assert that an old run still represents current performance.

## Limits

Short synthetic workload; one generator location; one product per load-driver
purchase; no soak test; no maximum-capacity search; no failover/load balancing SLA;
no production traffic, real payment or database redundancy. Purchase p95 includes
network round trips and both session/order operations. It excludes failed attempts
(which were zero here) and the later readback. No browser audio, local unit test,
or game animation can substitute for this HTTP measurement.
