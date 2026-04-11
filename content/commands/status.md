---
description: Show a unified project status across tasks, framework health, and verification
---

Generate a concise project status snapshot for the current repo. $ARGUMENTS

Treat this as a Session-Manager status alias.

This command is the visibility hub. It should help the user answer:

- What is ready to work on?
- What is already in progress?
- Is Beads available in this session?
- Is the framework looping or degrading?
- Is the repo currently verifiable?

## Step 1 - Check task visibility

If `.beads/` exists:

1. Run `/bd-check`
2. Run `bd ready --json`
3. Run `bd list --status in_progress --json`
4. If `bv` is installed, run `bv --db .beads --robot-triage`
5. Treat Beads as task source of truth

If `.beads/` does not exist:

- Treat `{{BACKLOG_PATH}}` as task source of truth
- Read `## Ready`, `## In Progress`, and `## Blocked` from backlog file
- If backlog file does not exist, report task source as "uninitialized backlog"

## Step 2 - Check framework health

1. Run `/optimise --days 7`
2. Run `/optimise-compare --days 7` if a previous window exists or the user asked for trend comparison

## Step 3 - Check verification state

1. Run `/verify`
2. If `/verify` is too heavy for the repo, say so and report which check is likely to be the bottleneck

## Output

Produce a status summary with these sections:

```
STATUS
======
Tasks:
- Ready: ...
- In progress: ...
- Blockers: ...

Beads:
- Task source: `beads` | `backlog-file`
- Session availability: ...
- Visibility tool: ...

Framework:
- Latest optimisation signal: ...
- Trend: ...

Quality:
- Verify status: ...

Next:
- One immediate next action
```

Keep it concise and operational. Prefer visible state over abstract commentary.
