# Remote checkout evidence — 2026-09-22

These JSON files are unchanged copies of the alternate game client's recorded Oracle checks, retained here so this checkout repository can be reviewed independently. Source in the companion project: `docs/verify/release/remote/`. They describe the original run; copying them is not a new test execution.

- [Recovery](connected.json): an already-committed response was lost, then recovered with the same intention.
- [Scheduled arrivals](rate-80.json): 87 purchases during a 65-second run offering 80/minute.
- [Database check](database-check.json): a separate SQL check matched the receipts and totals.

Synthetic IDs are evidence references, not authentication credentials. These observations establish neither maximum capacity nor high availability.
