# Publication cleanup — 2026-09-22

This cleanup removed the earlier test implementation and unused project material while preserving the current product and its reproducible sources.

## Removed

- Contents of `Initial_docs/`: the historical checkout-lab prototype, dependencies, scratch images and old plans. Before cleanup it contained 7,956 files, approximately 144.6 MiB. The obsolete directory is excluded from publication.
- `scripts/jev_debug.py`: the temporary authentication diagnostic, superseded by `npm run test:jev:live`. Its fingerprint exclusion was removed.
- `artifacts/frontend-batch.js`: an unused temporary construction script.
- `playwright-report/` and `test-results/`: reproducible local browser caches; future test runs may recreate them.

[Detailed removal inventory](evidence/cleanup.json). The current product, root `.env` and Git repository remain intact. Remote rollback material was preserved separately before replacing the previous deployment.

## Preserved deliberately

- Current application, migrations, tests, deployment configuration and actual AI/build evidence.
- Runtime art and press kit, original generators, Kenney source models and licenses.
- `artifacts/vendor/kenney_food-kit.zip`: retained as an original source archive for artwork regeneration. It stays outside Git/Docker publication; the required source models and licenses are included separately.
- `.env`, `.git`, installed dependencies and active build outputs. Credentials are ignored and never included in the application bundle or release archive.
- Historical current-product evidence under `docs/evidence/`, with dates and limitations preserved.

No required model was replaced by a private download step. Ordinary Docker/Node builds use included current artwork and never call paid media-generation services. Final verification and deployment records distinguish local checks from the actual ARM64 deployment.
