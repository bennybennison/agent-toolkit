---
description: Assess feasibility, placement, and repo fit for a change before planning or implementation
surface: user
---

Use the `feasibility-and-placement` and `repo-mapping` skills for: $ARGUMENTS

Treat this as the Orchestrator's `map`-mode alias.

## Goal

Produce:

- a `MapReport`
- a `ProjectMap` when broader repo orientation is needed

## Persist The Artifacts

1. Create `{{PROJECT_PLANS_DIR}}/maps/` if it does not exist
2. Save the main feasibility output to `{{PROJECT_PLANS_DIR}}/maps/{slug}-map-report.md`
3. When wider repo orientation is needed, also save `{{PROJECT_PLANS_DIR}}/maps/{slug}-project-map.md`
4. Use the templates in `templates/workflows/MAP_REPORT.md` and `templates/workflows/PROJECT_MAP.md`

## Required Output

Capture:

- relevant files and modules
- existing patterns
- candidate placement
- dependencies and risks
- feasibility notes
- narrowed working set

## Guardrails

- Stop at feasibility and placement unless the user explicitly asks for a full plan
- Prefer evidence-backed placement over generic architecture advice
