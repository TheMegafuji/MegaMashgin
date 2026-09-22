# Market expansion plan

2026-09-21. The user requested persistent anonymous identity, API order history, an improved animated home/catalog, more convenience-store products and a real Jev integration using the local Typesafe key.

1. Read the official Jev HTTP API, Choice/Noul, semantic-find cookbook and model pricing.
2. Specify boundaries before changing code: UUID is an identifier; opaque HttpOnly credential is authentication. Keep purchase idempotency separate from visitor identity.
3. Add additive migrations, visitor/history endpoints and a bounded Jev adapter with shared cache/admission.
4. Expand original catalog artwork and implement the market home, dynamic interactions and accessible dual-source autocomplete.
5. Exercise isolation, replay, reset, failure, cache/coalescing and UI flows; run a small explicit live Jev evaluation with fictional queries.
6. Rebuild only this project's local containers and record exact results.

No copied credentials in source, no runtime AI requirement for checkout, no game, no public failure injection and no cloud replacement in this scope.
