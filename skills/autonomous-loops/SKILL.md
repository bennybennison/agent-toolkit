---
name: "autonomous-loops"
description: "Patterns for running agents in loops with proper safety mechanisms."
pack: "skills-autonomous"
---

# Skill: Autonomous Loop Patterns

Patterns for running agents in loops with proper safety mechanisms.

## When to Use

- Repetitive tasks across many files (bulk renames, migration, formatting)
- Continuous integration loops (fix, test, repeat)
- Multi-step autonomous work with defined completion criteria

## Safety Mechanisms (Required)

Every autonomous loop MUST have:

1. **Explicit stop condition** — define what "done" looks like before starting
2. **Maximum iteration cap** — hard limit on cycles (default: 10, max: 25)
3. **Stall detection** — if the same error appears 3 times, stop and escalate
4. **Cost awareness** — track token usage; stop if budget exceeded
5. **Escalation path** — when to stop and ask the human

## Loop Patterns

### Pattern 1: Fix-Verify Loop

The simplest autonomous loop. Fix an error, verify, repeat.

```
while errors exist AND iterations < max:
    1. Run build/tests
    2. If pass: done
    3. If fail: fix the first error
    4. If same error as last iteration: stall_count++
    5. If stall_count >= 3: escalate to human
```

**Use for:** build errors, type errors, lint fixes, test failures.

### Pattern 2: Batch Process Loop

Process a list of items sequentially.

```
items = [list of files/tasks to process]
for item in items:
    1. Process item
    2. Verify (build still passes)
    3. If fail: revert item, log skip, continue
    4. Commit progress
```

**Use for:** bulk migrations, rename operations, file format conversions.

### Pattern 3: Continuous Improvement Loop

Repeatedly improve code quality until a threshold is met.

```
while quality_score < threshold AND iterations < max:
    1. Measure current quality (lint warnings, type coverage, test coverage)
    2. Identify the highest-impact improvement
    3. Implement it
    4. Verify (no regressions)
    5. Measure again
```

**Use for:** code quality improvement, reducing tech debt, increasing coverage.

## Cross-Iteration Context

For multi-iteration loops, maintain a shared notes file:

```markdown
## Loop Notes

### Iteration 1
- Did: [what was done]
- Result: [pass/fail]
- Next: [what to try next]

### Iteration 2
...
```

This prevents the agent from repeating failed approaches.

## Escalation Rules

Stop the loop and ask the human when:

- Same error appears 3+ times (stall)
- Error requires architectural change
- Fix would change public API
- Fix requires domain knowledge the agent lacks
- Iteration cap reached without completion

## Anti-Patterns

- Loops without stop conditions (infinite loops)
- No verification between iterations (error accumulation)
- Trying different approaches to the same error without tracking what was tried
- Loops that modify unrelated code to "fix" errors
- No progress tracking between iterations

## Completion Sentinel

Autonomous loops must have an explicit, structured completion signal. This prevents agents from silently finishing without confirming all work is done.

### The Contract

At the end of every autonomous loop, the agent must produce a completion summary:

```markdown
## Loop Complete

**Iterations:** {N} of {max}
**Status:** {DONE | ESCALATED | STALLED | BUDGET_EXCEEDED}
**Items processed:** {M} of {total}
**Items skipped:** {K} (with reasons)

### What was done
- [List of completed items]

### What was NOT done
- [List of skipped/failed items with reasons]

### Verification
- [How completion was verified — tests passed, build succeeded, etc.]
```

### Status Definitions

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `DONE` | All items processed, verification passed | Loop ends normally |
| `ESCALATED` | Hit an issue requiring human judgment | Report and wait for user input |
| `STALLED` | Same error 3+ times, no progress | Report what was tried, ask for help |
| `BUDGET_EXCEEDED` | Iteration cap or token budget reached | Report progress, let user decide to continue |

### Rules

1. An agent must **explicitly declare completion** — it cannot just stop responding
2. The completion summary must account for **every planned item** (done, skipped, or failed)
3. If status is not `DONE`, the summary must explain what remains and why
4. The user should be able to run `/resume-session` and pick up where the loop left off

## De-Sloppify Pass

After any autonomous loop completes, run the @cleanup agent. Loops tend to produce more slop than manual work because the agent is focused on getting past errors, not on code quality.

---

## See Also

- [verification-loop](../verification-loop/SKILL.md) — Correctness checking within loops
- [agent-orchestration](../agent-orchestration/SKILL.md) — Multi-agent coordination
