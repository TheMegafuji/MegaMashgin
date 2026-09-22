# Documentation

Start with the [product README](../README.md) and [short walkthrough](market-tour.md). This index separates the current design from dated implementation evidence.

| What you want to understand      | Read                                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Product behavior and constraints | [Checkout specification](../specs/checkout.md), [visitor/discovery specification](../specs/visitor-discovery.md)      |
| Architecture and tradeoffs       | [Architecture](architecture.md), [decisions](decisions.md)                                                            |
| Identity and recovery            | [Visitor identity](visitor-identity.md), [API contract](api.openapi.json)                                             |
| Optional AI                      | [Jev discovery](jev-discovery.md)                                                                                     |
| Run, deploy and operate          | [Operations](operations.md), [actual Oracle deployment](deployment-current.md), [prepared Vercel frontend](vercel.md) |
| Evidence and its limits          | [Latest and historical checks](evidence.md)                                                                           |
| How AI assisted development      | [Process index](ai/README.md)                                                                                         |
| Artwork and branding             | [Brand and provenance](brand-and-experience.md)                                                                       |
| What was removed                 | [Cleanup record](cleanup.md)                                                                                          |

The alternate game client is a separate project. Its remote API measurements needed for this review are copied unchanged into [remote evidence](evidence/remote/README.md), so this repository's documentation does not depend on a sibling directory. Screenshots are observations of the recorded versions, not a claim of continuous monitoring. Local test commands produce their detailed logs in the ignored `artifacts/` directory.
