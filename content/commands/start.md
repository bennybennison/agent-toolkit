---
description: Fast session bootstrap with minimal useful context loading to reduce context bloat
---

Start the working session with minimal useful context. $ARGUMENTS

Use this at the beginning of a session or when re-focusing onto a new area.
Treat this as a Session-Manager lifecycle alias.

## Goal

Load only the smallest context set needed to execute the next meaningful task.

## Minimum Context Set

1. Identity layer:
   - `AGENTS.md`
   - `.github/copilot-instructions.md` (if in VS Code/Copilot mode)
2. Active planning layer:
   - `{{PROJECT_BRIEF_PATH}}` (if present)
   - `{{GOTCHAS_PATH}}` (if present)
3. Active task layer:
   - If `.beads/` exists: `bd ready --json` and `bd list --status in_progress --json`
   - Else: `{{BACKLOG_PATH}}`
4. Active code scope:
   - determine target area/files from user request

## Output Contract

Return exactly this structure:

```
START CONTEXT
=============
Mode: {interactive|autonomous}
Task source: {beads|backlog-file}
Current focus: {area or feature}
Ready next:
- {item 1}
- {item 2}
Minimal files to read next:
- {path 1}
- {path 2}
Suggested command: {/partner|/feature|/plan|/mission}
```

## Hard Session State

At the start, update `{{SESSION_STATE_PATH}}` with:

- `activeCommand: "start"`
- `goal: "Load minimal context for immediate execution"`
- `phase: "discovering"` then `"executing"`
- `nextAction`: current concrete step
- `blockedReason: null` unless blocked

## Constraints

- Do not load broad docs or long histories unless required by the immediate task
- Prioritize context reduction over completeness
- Stop once a clear next action is identified
