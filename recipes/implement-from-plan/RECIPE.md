---
description: Implement an approved plan, make the required changes, and finish with verification evidence.
interaction_policy: mutate-only
capability_ceiling: mutate
contract_mode: validated
artifact_root: .agent-artifacts/handoffs/
contracts: build-proposal, change-summary, verification-report
skills: using-agent-toolkit, verification-loop, terminal-execution
specialists: contractor, builder, verifier, build-fixer, cleanup, tdd-runner
---

# Implement From Plan

Use this recipe when a plan or clearly bounded implementation direction already exists and the next step is to make changes.

The recipe should:

1. Restate the implementation scope briefly.
2. Execute the change through the smallest useful slice.
3. Verify the result.
4. Return a concise change summary and evidence.
