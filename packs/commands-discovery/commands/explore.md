---
description: Explore a rough idea before committing to a feature spec or implementation plan
surface: user-agent
agent: audit-planner
---

Before delegating to `@audit-planner`, gather a compact evidence bundle only when the idea depends on existing repo context.

Treat this as the Orchestrator's `plan` or `review` discovery-mode alias.

Use the `idea-exploration` skill for: $ARGUMENTS

## Goal

Produce an `IdeaBrief` that captures:

- the core idea
- user value
- use cases
- open questions
- risks and edge cases
- alternatives
- recommendation

## Persist The Artifact

1. Create `{{PROJECT_PLANS_DIR}}/ideas/` if it does not exist
2. Create a slug from the idea title
3. Save the artifact to `{{PROJECT_PLANS_DIR}}/ideas/{slug}.md`
4. Use the template in `templates/workflows/IDEA_BRIEF.md`

## Guardrails

- Do not silently turn this into a feature spec
- Do not jump to implementation details before the use case is clear
- End with a concrete recommendation:
  - proceed to `/map`
  - proceed to `/feature`
  - defer
  - reject for now
