---
description: "Review a bug report, GitHub issue, PR, or proposed change and turn it into risks, questions, and a safe implementation plan"
mode: "agent"
---

Review the following issue, bug report, PR summary, or proposed change with a code-review mindset.

Focus on:

1. **Correctness risks** — likely bugs, regressions, hidden assumptions
2. **Edge cases** — missing validation, error paths, state transitions, race conditions
3. **Architecture impact** — boundary violations, coupling, migration risk, data-flow concerns
4. **Testing gaps** — what should be verified before or after implementation
5. **Implementation shape** — safest sequence of changes

If the input is ambiguous, start by listing the missing context that matters most.

Output format:

```markdown
## Findings
- Most important risk or ambiguity

## Open Questions
- Question that should be resolved before coding

## Recommended Plan
1. Step
2. Step

## Verification
- Test or check to run
```

${input:scope:What issue, PR, bug report, or change should I review?}
