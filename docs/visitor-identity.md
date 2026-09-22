# Anonymous visitor identity

The API assigns a UUID on the first visit. That UUID identifies a database row; it is not a credential.

A separate random 256-bit capability is stored in an HttpOnly, SameSite=Lax cookie for 30 days. Only its SHA-256 hash is stored in PostgreSQL. The cookie is Secure when PUBLIC_ORIGIN uses HTTPS; public deployments must use HTTPS. The frontend cannot read it.

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as API
  participant D as PostgreSQL
  B->>A: POST /api/visitor
  A->>D: Find credential hash or create visitor UUID
  A-->>B: UUID + expiry; HttpOnly cookie
  B->>A: Create purchase session with cookie + UUID header
  A->>D: Verify cookie owner, bind purchase session
  B->>A: Commit order with cookie + purchase token + intent key
  A->>D: Verify ownership; commit once
  B->>A: GET /api/visitor/orders with cookie
  A->>D: List only this visitor's receipts
  A-->>B: Ten receipts + optional cursor
```

Each purchase still has a separate 24-hour session and exactly one order. Starting another order clears that purchase's browser state immediately and closes the purchase token on a best-effort basis. It keeps the visitor cookie, so earlier receipts remain in My orders. History joins on the authenticated visitor; a caller-supplied UUID or cursor cannot select another person's history.

Browser-created purchase sessions require the matching `X-Visitor-ID` and cookie. This prevents a browser with blocked cookies from silently creating an unowned order. Existing anonymous purchase sessions and the local bounded CLI experiment remain compatible; older unowned receipts are not retroactively assigned to a new identity.

On a shared device, **Forget this device** revokes the credential and creates a new guest. The old history becomes inaccessible with that cookie. Pending purchases cannot use this action from the UI. Clearing browser cookies also loses access; there is no password, verified personal identity, cross-device account recovery or email-based login.

History is retained while the visitor is valid. The maintenance script prunes expired visitors (and their orders), revoked visitors after a seven-day grace period, old anonymous sessions, cache entries and telemetry. No retention job runs automatically.

API ownership checks and revocation are covered by real PostgreSQL integration tests. Browser tests cover reload, history, cookie inaccessibility to JavaScript and device reset. This is anonymous device authentication, not proof of the human operating the device.
