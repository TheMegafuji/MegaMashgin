# Decision record

## ADR-001 — Modular application

Accepted before implementation. The domain has one purchase transaction and a short delivery window. React and Fastify share strict contracts; PostgreSQL provides consistency. Separate API processes can serve the same application. Microservices would add deployment and failure boundaries without a distinct business owner or workload.

## ADR-002 — Synchronous order confirmation

Accepted before implementation. The receipt is returned after the database commit. A queue is unnecessary for inserting a purchase. Fulfillment could later use an outbox and idempotent worker, if a real downstream workflow appears.

## ADR-003 — Durable intent and one purchase per session

Accepted before implementation. Browser intent is saved before submission. A session-row lock, request hash and unique order/session constraint cover retries across processes. The tradeoff is serialized purchase attempts within a single customer session, which matches this kiosk model.

## ADR-004 — Fictional payment by method

Accepted before implementation. The assignment allows any non-real payment model. A choice of demo card or demo cash communicates payment without collecting card details.

## ADR-005 — Locally reproducible checkout; alternate clients stay separate

The initial scope prioritized the checkout product, runnable with Compose without a cloud account or API budget. Later work added an Oracle deployment and a game in a separate repository; neither is required to run the core checkout locally.

## ADR-006 — Visible AI work through evidence

Accepted before implementation. We record the brief, decisions, actual changes, failures and verification outcomes. AGENTS.md is an index with invariants. Generated evidence includes source fingerprints; prose and traceability alone cannot mark a test as passed.

## ADR-007 — Anonymous visitor capability, separate from purchase intent

The user requested persistent identity and order history. The API generates a public UUID and a separate random HttpOnly cookie. History is scoped by the verified cookie owner. One visitor can own multiple single-purchase sessions. This preserves idempotency while making repeat orders usable. Forget this device revokes access; verified personal identity and account recovery remain out of scope.

## ADR-008 — Jev for discovery, never settlement

Use typed Choice ranking plus Noul existence in one provider call, based on TypeSafe's official semantic-find pattern. Local autocomplete remains immediate. Suggestions contain only existing available product IDs and server-owned prices. PostgreSQL handles shared cache leases and paid-call quotas across both APIs. No Redis or extra broker is required for this bounded workload.

## ADR-009 — Animated market with accessible controls

Use original SVG product art, category collections, quick-add hero products and motion controls. Respect reduced-motion preferences. Preserve keyboard selection, native dialogs and accessible focus. Product actions stay explicit; AI never adds an item automatically.

## ADR-010 — Additive assortment migration

Expand to 76 products in nine categories using a new migration. Preserve original IDs and receipt snapshots. Include zero-alcohol alternatives without pretending that a fictitious payment demo implements age verification or real product recognition.
