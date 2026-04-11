---
description: Discover and specify a feature from rough intent to implementation-ready spec and backlog items
---

Develop a feature spec from this request: $ARGUMENTS

Use this when the request is not implementation-ready yet and needs clarification, boundary mapping, risks, and backlog conversion.
If the request is still mostly exploratory, has unclear use cases, or has multiple viable directions, use `/explore` first and turn the result into an `IdeaBrief` before continuing here.

## Goal

Produce all of the following:

1. A durable feature spec at `{{SPECS_DIR}}/{feature-slug}.md`
2. Backlog items ready for implementation
3. Explicit implementation constraints and risk notes

## Context Loading

Before any discovery work, read these files if they exist:

1. `{{PROJECT_BRIEF_PATH}}` — project scope and priorities
2. `{{GOTCHAS_PATH}}` — known pitfalls
3. `{{CONSTITUTION_PATH}}` — architecture principles and boundaries
4. `{{SPECS_DIR}}/` — existing specs (scan titles to detect overlap)
5. `AGENTS.md` in the target area — module layout and ownership

Skip files that do not exist; do not warn about missing optional files.

## Workflow

1. **Clarify intent.** If the request is ambiguous or missing critical details (target area, user need, scope boundary), ask all clarification questions in a single batch. After asking, set phase to `"awaiting_user"` and **stop** — do not keep exploring, reading files, or calling subagents until the user answers.
2. **Map location.** Determine where the feature belongs in the current repo structure. If the repo has a monorepo layout (multiple `apps/`, packages, or a `## Monorepo Map` section), identify the target area explicitly. When needed, create a `MapReport` first instead of guessing.
3. **Check for overlap/conflicts:**
   - If `.beads/` exists: check `bd ready --json`, `bd list --status in_progress --json`
   - Otherwise: inspect `{{BACKLOG_PATH}}` for related items
   - Scan existing specs in `{{SPECS_DIR}}/` for duplication
4. **Produce implementation constraints:**
   - architecture boundaries (from CONSTITUTION.md and project-brief)
   - data/migration constraints
   - external integrations and MCP/tool dependencies
5. **Save a feature spec** under `{{SPECS_DIR}}/{feature-slug}.md` following the structure in `{{SPECS_DIR}}/_TEMPLATE.md`.
6. **Convert the spec into implementation backlog entries:**
   - Beads path: create tasks with dependencies via `bd create`
   - Non-Beads path: append actionable tasks into `{{BACKLOG_PATH}}` under `## Ready`

## Output Contract

Return a compact summary with:

- spec path
- target area (if monorepo)
- backlog items created (ids or list entries)
- key constraints
- top risks
- recommended next command (`/partner` or `/mission`)

## Hard Session State

At the start, update `{{SESSION_STATE_PATH}}` with:

- `activeCommand: "feature"`
- `goal: "Produce feature spec and implementation-ready backlog"`
- `phase: "discovering"` → `"awaiting_user"` (if questions asked) → `"executing"` → `"done"`
- `outputPath: "{{SPECS_DIR}}/{feature-slug}.md"` once known
- `nextAction`: current concrete step
- `blockedReason: null` unless blocked

## Constraints

- Do not start code implementation in this command
- Keep context compact; avoid long narrative dumps
- Prefer one focused spec and a small set of actionable tasks over broad framework theory
- When asking clarification questions, batch them into one message and wait for answers before proceeding
