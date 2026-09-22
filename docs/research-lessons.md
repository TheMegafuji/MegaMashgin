# Lessons carried into the implementation

Earlier studies of public checkout implementations informed these design criteria. This document records the lessons applied to this product, not a comparative scorecard or evidence that any submission led to a hiring decision.

- Idempotency needs persisted guarantees and observable recovery; naming the pattern in a README is insufficient.
- Source tests and a polished README do not prove runtime correctness. We exercise PostgreSQL and a real browser.
- An endpoint existing in the backend does not prove the UI reaches it. Browser tests follow submission through the saved receipt and next customer.
- Client-supplied prices remain untrusted even when a service has many tests.
- Current assignment emphasis on AI process should not be applied retroactively to old submissions. For this build, the process is explicitly recorded.
- A small modular application fits the domain. No separate queue, cloud runtime or game is required by this product scope.

No ranking of authors or predictions of hiring success are included in the submission.
