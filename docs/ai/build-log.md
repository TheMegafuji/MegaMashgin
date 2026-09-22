# Build log

## 2026-09-21 — Scope and foundation

- Confirmed the parent directory contained only Initial_docs; preserved it and started a fresh root product.
- Reviewed the completed public-repository study and its cautions: public employment links do not establish acceptance; recent submissions already implement idempotency.
- Kept React/Fastify/PostgreSQL and removed the game from scope as requested.
- Checked current package versions from npm and the current OpenAI guidance on small, contextual agent instructions.
- Chose a short AGENTS.md, an explicit specification and generated verification artifacts instead of adding a large collection of agent rules.
- Local shell sandbox initialization failed with an ACL helper error. Authorized filesystem work is being performed through reviewed escalated commands; this is an environment issue, not an application failure.
- Implementation and tests are pending at this checkpoint. No independent review or deployment result is claimed.

## 2026-09-21 — Implementation and first evidence

- Implemented fresh shared schemas, catalog, opaque customer sessions and transactional orders; historical prototype source was not copied.
- First database run passed 4 contract tests and 12 PostgreSQL integration scenarios, including 20 concurrent attempts and a socket destroyed after commit.
- Implemented an original café interface with 12 deterministic SVG illustrations, cart, review, two fictional payment methods, durable intent and receipt recovery. The first 9 browser scenarios passed.
- A Windows command exceeded the operating-system command length. Recovered the already-generated source batch from this task’s own local record and wrote it in bounded batches; no code was lost.
- Automated accessibility testing then failed on secondary-text contrast (examples: 3.74:1 and 3.29:1, below the requested 4.5:1). Preserved the initial result and darkened muted text; removed reduced opacity from unavailable-item descriptions. Quantity buttons were widened to 44px.
- Noticed that a browser storage error should not be cleared by editing the cart. Locked product additions while storage is unavailable; submitting already required successful persistence of the intent.
- Container packaging and accessibility re-check are pending at this checkpoint.

## 2026-09-21 — Container and accessibility verification

- The follow-up accessibility run exposed one remaining low-contrast decorative stamp. Its color was corrected; menu, review and receipt then passed the selected axe rules.
- Docker built and started the new application on loopback 8090 without changing the earlier application. PostgreSQL stayed private to its network.
- A bounded HTTP check observed both API containers: 20 identical concurrent attempts, one created order and 19 replays. Restarting only those APIs preserved and recovered the same receipt.
- Added strict saved-state checks and a browser scenario that simulates storage quota failure before submission. Full final verification is pending at this checkpoint.
- Generated OpenAPI from shared schemas and added a drift check to the harness. CI actions were resolved from official GitHub releases and pinned to their commit SHAs; no remote CI run has occurred.

## 2026-09-21 — Final product verification

- The final formatter required one more pass on the API app file. The architecture harness then exposed a brittle assumption: it recognized only single spaces around Markdown table IDs. Updated it to accept formatted table padding and fail explicitly when no IDs are found.
- The full verification passed all eight stages: 7 unit/contract/state tests, 12 PostgreSQL integration tests, types, format, boundaries/spec references, API documentation drift and both builds.
- Rebuilt the final source into Linux containers. Repeated the bounded two-API restart experiment successfully, then ran all 11 browser tests against that packaged application: no skips, retries, unexpected failures or flaky results.
- Visually inspected desktop, narrow-screen, review and receipt captures. Copied representative original PNGs into docs/images for reviewers.
- Recorded the implementation in local Git after verification. Added a compact tracked evidence report, commands to reproduce it and explicit limits. The foundation specification remains an earlier commit; prompts in this repository are labeled templates, not invented transcripts.
- The finished product is available locally on port 8090. The historical files and earlier public deployment remain untouched. No external model API spend, public repository creation, remote CI result or new cloud deployment is claimed for this build.

## 2026-09-21 — Visitor and market expansion

- Recorded the expansion specification and implementation sequence in commit `29fdb4c` before implementation. The requested scope adds anonymous visitor history, an animated market and optional asynchronous Jev discovery.
- Read official TypeSafe API, model, Choice, confidence and semantic-find documentation. Chose a closed set of catalog IDs plus a separate Noul relevance gate; AI has no authority to change prices or submit orders.
- Separated the public visitor UUID from a random HttpOnly authentication cookie. Stored only the credential hash, bound purchase sessions to the authenticated visitor and scoped history in PostgreSQL. Kept anonymous legacy CLI sessions supported explicitly.
- Added versioned migrations and 64 original SVG product illustrations. The catalog now contains 76 products in nine categories. Existing item IDs and prices were preserved. Beer-style products are explicitly zero-alcohol; no age-verification workflow is claimed.
- Implemented an interactive landing page, category collections, touch-friendly cards, order history, motion controls and independent local/semantic autocomplete. Added shared PostgreSQL cache, leases, admission limits, provider timeout and status/token telemetry.

## 2026-09-21 — Observed expansion failures and corrections

- Visual inspection found an inherited 190px search-width rule. Removed that constraint for the expanded layout.
- Accessibility checks exposed secondary-label contrast, a scrolling autocomplete region without keyboard focus, and transient contrast during an opacity entrance animation. Corrected the colors and focus behavior and removed the opacity animation. Motion remains optional and respects reduced-motion preferences.
- Native search-input Escape behavior cleared the query while closing suggestions. Prevented that default when dismissing the autocomplete. Local ranking also matched the substring in chocolate ahead of cola; prioritized word-prefix matches.
- A reload while the old session-close request was still pending could retain a closed purchase intent. New-order reset now clears saved intent synchronously before that best-effort network call; a browser regression covers the race.
- The expanded catalog exposed a mismatch between the advertised 40-unit cart and the old 20-distinct-item schema. Aligned request/storage limits with the existing 40-unit bound; tested 40 distinct saved lines and a real 25-distinct-product purchase.
- Made PostgreSQL the authority for session-expiry comparisons after investigating an expiry-test failure. A measured clock offset was diagnostic only; it is not asserted as the proven cause.
- TypeSafe initially returned HTTP 401. After the user updated the root key, recreated the API containers and verified privately that the loaded key matched the file. Both the official model-list and inference endpoints still returned 401. Added a shared five-minute credential cooldown so one rejected key does not trigger repeated paid attempts. No secret was printed or committed.

## 2026-09-21 — Expansion verification and remaining dependency

- Final verification passed all eight stages: 13 unit/contract/state tests and 27 PostgreSQL integration tests, plus formatting, boundaries/spec references, OpenAPI drift, types and builds.
- Rebuilt the final source into Linux amd64 containers. The bounded two-API experiment returned one creation and 19 replays for 20 concurrent attempts, then recovered the receipt after restarting both APIs.
- All 17 browser tests passed against that final Compose application, with no skips or flaky/unexpected results. Reviewed desktop/mobile, history and autocomplete captures and saved original screenshots in docs/images.
- The source fingerprint agrees across verification, Compose and live-evaluation artifacts. The harness now connects 30 specification IDs through 69 test references.
- Live Jev smoke evaluation remains blocked by HTTP 401: seven scenarios received no model results, with one upstream attempt before cooldown. Usage was not reported; the cost estimate is null. Controlled provider doubles in automated tests are not presented as live model quality. A corrected active credential is the outstanding external dependency.
- The local application remains available on port 8090. No Oracle deployment, remote CI, independent review or large-scale performance result is claimed for this expansion.

## 2026-09-21 — Brand, open artwork and sensory feedback

- Recorded UX-06 through UX-09 and OPS-04 before implementation (commit `c217680`). The existing artwork was code-authored SVG, not image-model output.
- Reviewed Mashgin's current public design direction and Kenney Food Kit 2.0's CC0 license. The pack's supplied preview PNGs were only 64px, so rendered 20 original GLB models into 480x360 static PNGs. Kept the selected models, original license and source hashes in the repository. Three.js is a development dependency and is omitted from the customer bundle/runtime dependencies.
- The first render lacked the pack's external palette texture and appeared white. Included the original texture and made the renderer fail if a mesh material has no map; regenerated the assets successfully.
- Added eight original drink SVGs with different silhouettes and contents. Used additive migrations for images and descriptions while preserving product IDs, prices and existing receipts.
- Created one charcoal/citrus concept identity for the header, receipt, favicon and press materials. Built a static press page, SVG wordmarks, landscape/square/presentation graphics, PNG exports, app icons and a downloadable ZIP with credits.
- Added decorative card-overflow vapor to hot products, reduced-motion support and a motion toggle. Added nine short synthesized cart motifs with persistent mute, a low gain and rate limiting. Sounds are triggered only after an accepted quantity increase is saved.
- A browser test exposed continuously moving quick-add hit areas. Kept buttons stationary and moved the float animation to the images. A first rerun was still testing the previous dist build; added an automatic build hook for the browser test server, then all three targeted tests passed. Real AudioContext oscillator scheduling was observed; audio-device failure still allowed cart updates.
- Server-generated canonical/Open Graph/Twitter metadata, robots and sitemap use trusted PUBLIC_ORIGIN. Local mode remains noindex; unknown paths return 404. No new public domain, indexing result or cloud deployment is claimed.
- A local `scripts/jev_debug.py` appeared during the task. It is preserved, excluded from the product fingerprint and will not be included in this visual-update commit. No diagnostic credential content is used for the presentation work.
- The implementation and targeted tests were saved before the user's resume message. Resumed at the pending Docker packaging and final full-browser verification step; earlier completed work was not restarted.

## 2026-09-21 — Final brand delivery verification

- Final `npm run verify` passed all eight stages with 15 unit/contract/state tests and 27 PostgreSQL integration tests. The source fingerprint now includes index.html and excludes the unrelated local Jev diagnostic.
- Rebuilt and recreated the dedicated Compose application on port 8090. All 20 Chromium scenarios passed against that final package: 62 automated tests total, no skips or flaky/unexpected results.
- The separate two-API experiment again produced one order from 20 concurrent attempts, with 19 replays, and recovered the same receipt after restarting both APIs.
- Injected a configured HTTPS origin into the actual built-page server: canonical and social URLs used that configuration even with an unrelated Host header. Local robots/noindex, press download and 404 behavior passed browser checks. Confirmed Three.js is absent from runtime dependencies.
- Visually inspected the social composition, coffee silhouettes and warm cards. An initial warm-card capture landed during the opacity entrance animation; recaptured after cards reached full opacity to show the real steady presentation and vapor.
- Saved screenshots, source/license records and compact verification evidence. No live Jev smoke evaluation, remote deployment or subjective speaker-loudness assessment is claimed in this visual update.

- Final mobile inspection found a decorative spark touching the headline. Hid that decoration below 700px, rebuilt the package and repeated the browser verification. The upstream license text retains its original tab-only lines; application-source whitespace checks exclude only those two vendor notices.

## 2026-09-21 — Post-reboot live Jev confirmation

- The user reported repairing Jev and rebooting the computer. Docker was available; restarted the project Compose stack and its development/test PostgreSQL containers. API containers were recreated with the current environment. Existing data volumes were retained.
- The bounded live evaluator made seven upstream calls, all successful: exact and semantic matching, Portuguese input, and two no-match rejection cases. Authentication no longer failed in this run. Reported usage: 46,086 input tokens; estimated input cost about USD 0.00194 at the documented rate, not an invoice.
- Used a real browser without provider interception: the Portuguese query displayed three real Jev suggestions from the just-populated cache. Selected Sea salt chips and added one unit to the cart; no page errors occurred. Saved the actual UI capture and successful report, retaining the earlier 401 report separately.
- No application source needed changing. The existing source fingerprint matches the successful evaluation. Updated current documentation so the previous credential failure is no longer presented as the current integration status. The user's local jev_debug.py remains untouched and outside this commit.

## 2026-09-22 — publication cleanup and Ampere release

Removed the unused Jev debugging script and transient browser output, plus all obsolete Initial_docs prototype contents. The empty historical folder remains because it was the active desktop working directory; it is excluded from Git. Licensed model source archives were preserved for reproducibility. Verification passed after cleanup: 15 unit tests, 31 real PostgreSQL integration tests, types/contracts/architecture/format and both builds. The source fingerprint and executed steps are preserved in [the release verification record](../evidence/release-verification.json).

Deployed the current ARM64 API to the existing Ampere host, preserving the unrelated application and the old prototype database. A separate current database resolves the historical schema mismatch without deleting old data. Two replicas and the private PostgreSQL reported healthy. Public create/replay/conflict checks passed; a game browser then recovered a lost committed response against the public API. The [deployment record](../deployment-current.md) distinguishes these functional checks and the short remote 80/minute measurement from previous local load tests.

The optional Jev key was not included in this release; the core checkout was deployed successfully without that optional provider.

## 2026-09-22 — Publication preparation

Prepared a frontend-only Vercel build and external API rewrite, keeping HttpOnly visitor routes same-origin and explicitly disabling proxy caching. Static publication reuses the existing SEO helpers so production has canonical/social metadata and previews stay noindex. No database/TypeSafe/provider key is required by the frontend deployment.

The current deployment notes distinguish the existing ARM64 Oracle deployment from the prepared Vercel configuration and future redundancy. Current Fastify support and provider quotas were verified from primary sources; Vercel compatibility is not dismissed just because this app uses app.listen or pg. No Vercel account operation, remote configuration update or database migration was performed in this turn.

## 2026-09-22 — Documentation review for GitHub

Reviewed current public documentation and dated evidence before publication. Removed links to deleted documents, made each repository's evidence navigation independent of sibling directories, and clarified original-scope decisions and historical test results. Imported evidence snapshots were checked byte-for-byte against their source files.

Across the checkout and game repositories, the final documentation scan covered 75 Markdown files and 263 local links: no missing targets, ignored-file targets or links escaping the repository remained. Credential-pattern checks found no candidates in the documentation examined or its local Git history (59 checkout and 73 game documentation blobs). This was a scoped documentation review, not a complete application security assessment or validation of every external URL. Formatting and specification/architecture reference checks passed; no new runtime test, deployment or push was performed for these prose changes.
