---
description: Inspect Beads state with bv for visible backlog, drift, and planning views
surface: user
---

Use `bv` to inspect the Beads task graph for the current project. $ARGUMENTS

This command is for visibility, not mutation. Prefer it when you want to see backlog shape, dependency flow, drift, or a machine-readable triage view without changing tasks.

## Defaults

- If no arguments are provided, run `bv --db .beads`
- If `.beads/` does not exist, report that Beads is not initialized
- If `bv` is not installed, report that explicitly

## Suggested Modes

Interpret `$ARGUMENTS` as one of these common views:

- `board` or no args: Run `bv --db .beads`
- `triage`: Run `bv --db .beads --robot-triage --format json`
- `plan`: Run `bv --db .beads --robot-plan --format json`
- `drift`: Run `bv --db .beads --check-drift`
- `export`: Run `bv --db .beads --export-md {{BEADS_REPORT_PATH}}`
- `insights`: Run `bv --db .beads --robot-insights --format json`
- `portfolio`: Run `bv --db .beads --robot-triage --format json` and summarize by `app:` / `feature:` labels when present

If the user supplied a raw `bv` flag sequence instead, pass it through with `--db .beads` unless they already set `--db`.

## Output

Summarize:

1. What view was run
2. The most important visible signals
3. One suggested next action

If the output is machine-readable JSON, summarize the key fields instead of dumping raw JSON.
Prefer surfacing app-level grouping, unmapped work, blockers, and top recommendations over raw totals.
