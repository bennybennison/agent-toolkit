---
description: Start, monitor, or stop a managed autonomous loop with safety defaults
surface: user
---

Manage an autonomous loop. Usage:

- `/loop start [task description]` — start a new loop
- `/loop status` — check progress of the current loop
- `/loop stop` — stop the current loop gracefully

Follow the patterns in `the `autonomous-loops` skill`.

$ARGUMENTS

---

## If starting a loop (`start`):

Run `/autonomy-check $ARGUMENTS` before starting autonomous execution.

If approved, establish branch isolation (`loop/<mission-id>`) before executing iterations.

**Step 1 — Define loop parameters**

Before starting, explicitly declare:

```
LOOP CONTRACT
=============
Task:           {what the loop will do}
Stop condition: {what "done" looks like}
Max iterations: {number, default 10, max 25}
Pattern:        {fix-verify | batch-process | continuous-improvement}
Stall limit:    3 (same error 3 times = stop)
```

**Step 2 — Execute the loop**

```
while not done AND iterations < max:
    1. Execute one iteration
    2. Verify result (build/tests/lint pass)
    3. If same error as last iteration: stall_count++
    4. If stall_count >= 3: ESCALATE — stop and report
    5. Log iteration to loop notes
    6. If stop condition met: DONE
```

Maintain loop notes across iterations:

```markdown
### Iteration {N}
- Did: {what was done}
- Result: {pass/fail}
- Next: {what to try next}
```

**Step 3 — Completion sentinel (required)**

When the loop ends, produce:

```
LOOP COMPLETE
=============
Iterations: {N} of {max}
Status:     {DONE | ESCALATED | STALLED | BUDGET_EXCEEDED}
Items:      {M} processed, {K} skipped

What was done:
- {item 1}
- {item 2}

What was NOT done:
- {item and reason}

Verification:
- Build: {PASS/FAIL}
- Tests: {PASS/FAIL}
```

After completion, consider running `@cleanup` — loops produce more slop than manual work.

---

## If checking status (`status`):

Report the current loop's progress:
- Current iteration number and max
- Items processed vs remaining
- Any stalls or errors encountered
- Estimated completion

---

## If stopping (`stop`):

1. Complete the current iteration (do not leave partial work)
2. Run verification (build + tests)
3. Produce the completion sentinel with status `STOPPED`
4. Report what was completed and what remains

---

## Escalation rules

Stop the loop and ask the human when:
- Same error appears 3+ times (stall)
- Error requires architectural change
- Fix would change public API
- Fix requires domain knowledge the agent lacks
- Iteration cap reached without completion
