---
description: Run the default interactive coding-partner workflow with compact checkpoints and ask-before-mutate gates
---

Run coding-partner mode for: $ARGUMENTS

Treat this as the default operation style.
Treat this as the default interactive Orchestrator workflow.
Default the interaction policy to `confirm-first` unless the user explicitly requests `checkpointed`, `mutate-only`, or `final-only`.

## Workflow

1. Create a compact `TaskBrief` from the request, including the implementation strategy and interaction policy
2. Start with a compact execution preview:
   - chosen mode
   - interaction policy
   - expected specialists or subflows
   - expected outputs
3. If the interaction policy is `confirm-first` or `checkpointed`, wait for confirmation before substantial work
4. Gather a compact evidence bundle when scope or dependencies are unclear, or when the downstream specialist does not have direct repo-read tools (use targeted reads or `@researcher`)
5. If the execution approach is ambiguous, do a quick pass with the `implementation-strategy-selection` skill before coding
6. Invoke `@mapper` with that bundle when mapping is needed
7. Implement in short cycles (prefer narrow diffs)
8. If confidence falls below threshold, stop and ask for clarification
9. If the interaction policy is `checkpointed`, stop again at major checkpoints
10. Verify affected behavior before closing

## Guardrails

- Ask before risky or broad mutations
- Keep context compact and avoid long narrative dumps
- Pass compact evidence bundles to read-limited specialists instead of expecting them to explore the repo unaided
- Prefer focused tests and checks tied to the changed scope
- Escalate uncertainty instead of guessing

## Output

Return:
- active operation style (`interactive`)
- active interaction policy
- summary of changes made
- verification run and outcome
- open questions (if any)
