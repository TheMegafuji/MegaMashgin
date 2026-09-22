# Work prompts

These are reusable templates created for this repository, not a verbatim historical conversation.

## Implement a slice

Read the relevant acceptance IDs and existing boundary contracts. Implement the smallest complete behavior, including user-facing failure recovery. Keep pricing and persistence decisions on the server. Run the affected checks and record observed results or unresolved limits.

## Review a transaction change

Trace the complete request through schema, session lock, prior-order check, price validation, writes and commit. Check concurrent same-key requests, a changed payload, a lost response, cross-session reads and database failure. Report concrete evidence with file/line references; distinguish code inspection from executed results.

## Review the tablet experience

Walk through catalog, cart, review, payment, receipt and next customer. Exercise keyboard controls, small viewports, network failure and reload. Identify where the customer lacks a next action. Capture screenshots and state exactly which browsers and layouts were exercised.

## Complete a delivery

Run the verification harness and browser suite against a disposable database, build/start Compose and run bounded checks through the proxy. Update evidence and build log. Ensure setup does not depend on Initial_docs, credentials, private services or a local file outside the repository.
