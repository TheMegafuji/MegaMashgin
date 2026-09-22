# Checkout specification

Status: accepted for implementation, 2026-09-21.

The source assignment asks for an API-backed menu, local order assembly, fictional payment, order persistence and a sensible response. It emphasizes an unattended tablet, judgment, failures and a visible process of building with AI. AWS, microservices, authentication accounts, real payments and a game are not requirements.

## Acceptance criteria

| ID     | Observable behavior                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------ |
| CK-01  | Menu loads from the API; loading, unavailable, empty and retry states are usable.                      |
| CK-02  | Categories/search, item availability and cart quantities work with keyboard and touch.                 |
| CK-03  | Order review shows items, quantities and total; payment selects a fictional method only.               |
| CK-04  | Server validates quantities and products, owns integer-cent prices and detects stale menu revisions.   |
| CK-05  | Order, item snapshots and intent are committed atomically before a receipt is returned.                |
| CK-06  | Concurrent identical requests across separate API instances produce one order and the same receipt.    |
| CK-07  | Reusing a key with another payload conflicts; a session cannot create a second purchase accidentally.  |
| CK-08  | After a lost response, the same intent survives reload and safely recovers its receipt.                |
| CK-09  | Database failure produces no false success; retry remains possible.                                    |
| CK-10  | A customer cannot read another session's order; expired/closed sessions cannot purchase.               |
| CK-11  | Starting another order clears the purchase session, cart, intent and receipt; visitor history remains. |
| UX-01  | Tablet and narrow layouts have no horizontal overflow and controls have accessible names.              |
| UX-02  | Review manages focus; pending or uncertain purchases cannot be silently edited/discarded.              |
| OPS-01 | A Unix clone runs with Docker Compose; DB is private and volumes survive application restarts.         |
| OPS-02 | Two API processes share PostgreSQL; health, request IDs and graceful shutdown are observable.          |
| OPS-03 | Public demo resource consumption is bounded using shared database admission limits.                    |
| AI-01  | Short agent guidance links to specs, decisions, commands and real build evidence.                      |
| AI-02  | Harness checks boundaries, requirement references and results; failures and corrections are recorded.  |

## Product decisions

- One customer session corresponds to one completed purchase; “Start another order” creates a fresh purchase context under the same visitor.
- A pending purchase is immutable until the server confirms success or definitively rejects it.
- Network failure is an unknown result, not a failed payment. Replaying the saved intent resolves it.
- Menu revision changes require a new review. Already persisted orders retain their original snapshots.
- Sessions last 24 hours. Visitor-owned receipts remain in authenticated history for the visitor lifetime; this is a demo, not a fiscal receipt system.
- Amounts use USD for this demonstration. No money moves, tax engine, kitchen fulfillment or inventory reservation is implemented.
- The first release targets a single host. Multiple processes are not host-level high availability.

The later [visitor/discovery specification](visitor-discovery.md) extends identity, search and home behavior. Earlier foundation requirements remain except for the explicitly revised visitor-preserving reset.
