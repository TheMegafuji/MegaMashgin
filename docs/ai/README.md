# How this product was built with AI

This folder is an evidence trail for the actual construction of this product. It is not a fabricated transcript or a claim that an autonomous tool replaced engineering judgment.

## Read in this order

1. [Accepted brief and execution plan](plan.md), then the [market expansion](expansion-plan.md).
2. [Build log](build-log.md): what was done, what failed, what changed.
3. [Decisions](../decisions.md): constraints and alternatives.
4. [Evidence](../evidence.md): results, environment and limits.
5. [Work prompts](prompts.md): reusable task/review templates, not a verbatim chat export.

## Working method

Define observable behavior, implement a bounded slice, run relevant checks, inspect the result, and record a correction when evidence changes the design. Specs identify requirements; tests and runtime artifacts establish which ones were exercised. A linked test name alone is not proof of correctness.

The root AGENTS.md is a small entry point with concrete commands and invariants. Additional documentation is loaded according to the work being done. This follows the current guidance on [agent instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md) and [keeping prompts and skills focused](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra), consulted on 2026-09-21.

## Attribution and cost

Implementation in this build session is AI-assisted through Codex, with review by the same working agent. It is not an independent human review. The original checkout had no runtime AI dependency. The market expansion adds optional Jev discovery; provider usage is bounded and recorded separately from mocked tests. The earlier Luna research was a separate activity and its spending authorization is not reused here. Third-party take-home source was studied for lessons, not copied into this implementation.

## Boundaries

Do not add an AI feature solely to advertise AI usage. Do not expose prompts or diagnostics in the customer's checkout flow. Do not invent rejected suggestions or past test failures. Record only events that actually happened.
