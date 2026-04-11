---
description: Show app-by-app portfolio status for a monorepo or multi-app repository
---

Generate a portfolio view for the current repo. $ARGUMENTS

Use this for multi-app repos where you need human visibility over which apps exist, what features are active, and what is blocked or drifting.

## Step 1 - Discover areas

1. Read the root `AGENTS.md`
2. Find the `## Monorepo Map` section if it exists
3. List all defined areas

If no monorepo map exists:

- say that portfolio status is limited
- fall back to a repo-wide status summary

## Step 2 - Gather task visibility

If `.beads/` exists:

1. Run `/bd-check`
2. Run `bd ready --json`
3. Run `bd list --status in_progress --json`
4. If `bv` is installed, run `bv --db .beads --robot-triage --format json`
5. Prefer grouping work by labels or fields matching:
   - `app:{name}`
   - `feature:{name}`
   - `business:{name}` when present

If `.beads/` does not exist:

- report that Beads is not initialized

## Step 3 - Gather framework health

1. Run `/optimise --days 7`
2. Run `/optimise-compare --days 7` when comparison data is likely to exist

## Step 4 - Organize by area

For each area in the monorepo map, summarize:

- what the area is for
- any visible in-progress work
- any ready work
- any blockers or drift signals

When `bv` triage output is available:

- use it as the primary source for cross-task grouping
- map tasks to areas by `app:{area}` labels first
- if `app:` labels are missing, fall back to title or path hints only when the mapping is obvious
- if the mapping is not obvious, report `unmapped work` instead of guessing

If Beads labels or `bv` output do not clearly map tasks to areas, say so explicitly instead of guessing.

## Output

Produce:

```text
PORTFOLIO STATUS
================
Areas:
- area-name: purpose

By Area:
- area-name
  - In progress: ...
  - Ready: ...
  - Risk: ...

Framework:
- Optimisation signal: ...
- Trend: ...

Gaps:
- Missing labels / missing monorepo map / no Beads initialization / no previous comparison window
- Unmapped work that cannot be safely assigned to an area

Next:
- One recommended portfolio-management improvement
```

Keep this high-signal and human-readable. Prefer explicit gaps over invented structure.
