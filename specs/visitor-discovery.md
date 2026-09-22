# Visitor identity and discovery

Accepted from the user's request on 2026-09-21, before implementation.

Expand the existing checkout into a convenience market. Keep its transaction/recovery guarantees. Add server-issued visitor identity and order history, asynchronous Jev suggestions beside immediate autocomplete, an expanded categorized catalog and an animated landing experience. Keep the product in the same root folder; do not change the earlier Oracle prototype.

| ID    | Observable behavior                                                                                                                                                        |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CK-12 | First visit obtains a server-generated UUID and an opaque HttpOnly cookie; reload retains the visitor. UUID alone cannot authenticate.                                     |
| CK-13 | Completed purchases across checkout sessions appear in the authenticated visitor's paginated API history. Other visitors cannot retrieve them.                             |
| CK-14 | Forgetting this device revokes the visitor credential; the next visit starts a different identity. Pending purchases cannot be silently discarded.                         |
| CK-15 | A versioned migration expands the menu without deleting original products or orders.                                                                                       |
| UX-03 | The home experience introduces the market, offers category entry points and leads directly to the catalog.                                                                 |
| UX-04 | Search offers immediate local matches and separate asynchronous semantic matches; stale responses cannot replace a newer query. Keyboard and touch can select suggestions. |
| UX-05 | Motion is purposeful, bounded and respects reduced-motion preferences. Narrow and tablet layouts remain usable.                                                            |
| AI-03 | Jev receives only query and fictional catalog data via the server; credentials and visitor/order data never enter the request or client bundle.                            |
| AI-04 | Choice ranks known available product IDs; Noul checks whether a match exists. Unknown IDs, low match evidence and invalid provider responses never create products.        |
| AI-05 | Timeout, provider outage, missing key or quota preserve ordinary search and checkout.                                                                                      |
| AI-06 | Shared PostgreSQL cache, request coalescing and paid-call admission limits work across two API instances. Live calls are opt-in for tests.                                 |
| AI-07 | A small recorded live evaluation distinguishes model quality from mocked integration evidence; cost estimates use reported tokens and dated official pricing.              |

Identity is an anonymous browser/device capability, not verified personal identity or cross-device account recovery. Credentials expire after 30 days. A separate 24-hour purchase session still admits one order. Start another order keeps the visitor; Forget this device removes access on a shared device.

All payments remain fictional. Catalog includes zero-alcohol alternatives rather than claiming to implement legal age verification. Food labels are fictional product metadata, not health or allergy advice.
