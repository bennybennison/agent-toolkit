---
description: Plan a feature or task before implementing
surface: user-agent
agent: audit-planner
---

Before delegating to `@audit-planner`, gather a compact evidence bundle for the target scope. Include the following context when it exists:

Treat this as the Orchestrator's `plan`-mode alias.
- AGENTS.md in the target area
- CONSTITUTION.md
- GOTCHAS.md
- Any relevant specs in {{SPECS_DIR}}/

If `@audit-planner` is running in a tool-limited context, pass these materials in the bundle rather than expecting it to search the repo on its own.

Then create a detailed implementation plan for: $ARGUMENTS

Persist the result under `{{AUDITS_DIR}}/` when the request is review-oriented or needs durable audit artifacts.
Use the `implementation-strategy-selection` skill before finalizing the plan whenever the execution approach is not already obvious.

The plan should include:

1. **Context** — What existing code/patterns are relevant
2. **Strategy selection** — Choose one of:
   - `outside-in`
   - `ui-first`
   - `inside-out`
   - `frontend-first`
   - `backend-first`
   - `infra-first`
   - `full-stack-staged`
   - `repair-first`
3. **Approach** — How to implement (adopt/extend/compose/build decision for each component)
4. **Files to create/modify** — List every file that will be touched
5. **Testing and verification strategy** — What tests/checks are needed
6. **Documentation updates** — Which AGENTS.md/SKILL.md files need updating
7. **Risks/gotchas** — What could go wrong
8. **Task breakdown** — Ordered list of specific implementation steps

Do NOT write any code. Only plan.

## Review Audit Persistence

If the requested work is a review of an area, workflow, adapter, host, or capability:

1. Create `{{AUDITS_DIR}}/` if it does not exist
2. Append a new entry to `{{AUDITS_DIR}}/REVIEW_LOG.md` with:
   - review id: `{date}-{slug}`
   - area reviewed
   - status: `planned`, `in_progress`, or `completed`
   - review folder path
   - artifact file names
3. Create a dedicated review folder at `{{AUDITS_DIR}}/{date}-{slug}/`
4. Write these files in that folder:
   - `README.md` — scope, status, summary, related earlier reviews, and artifact index
   - `USAGE_SCENARIOS.md` — scenario matrix and scenario narratives for the requested area
   - `ISSUES_AND_DECISIONS.md` — consolidated findings with `Type`, `Priority`, `Blocked by`, and `Subtasks`
5. If the review continues an earlier audit, link the new folder to the prior one instead of overwriting history

Treat this audit structure as durable project memory so later reviews can learn from earlier ones.

## Monorepo Gate

If the repository has a `## Monorepo Map` or clearly contains multiple apps/areas:

1. Identify the target area for this work
2. Name any additional affected areas
3. Before finalizing the plan, check whether these details are explicit:
   - target app / area
   - feature name
   - work type: feature, bug, or chore
   - whether execution should stop after planning for approval
4. If any of those details are missing, ask the user concise plain-text questions before finalizing the plan. Do not invent them silently.
5. If you ask questions, treat the task as awaiting user input. Stop after the question batch and do not keep exploring, rereading files, or calling subagents until the user answers.
6. If the work is feature-sized, cross-area, or touches multiple files, stop after the plan and wait for approval unless the user explicitly asked to proceed autonomously

If the repo uses Beads, include a short metadata block in the plan with:

- `area:`
- `feature:`
- `type:`
- `strategy:`
- `workstream: frontend|backend|infra|mixed`
- `approval_gate: yes|no`
- `additional_areas:` when relevant

If the repo is not a monorepo, still include:

- `type:`
- `strategy:`
- `workstream: frontend|backend|infra|mixed`
- `approval_gate: yes|no`

## Hard Session State

At the start of this command, create or update `{{SESSION_STATE_PATH}}` with:

- `activeCommand: "plan"`
- `goal: "Create or update a saved implementation plan"`
- `phase: "planning"` or `"awaiting_user"` or `"executing"`
- `filesRead: []`
- `outputPath: "{{PROJECT_PLANS_DIR}}/{slug}.md"` once known
- `nextAction:` set to the current concrete step
- `blockedReason: null` unless a real blocker exists

Treat this file as authoritative session state. Do not let unrelated recovery, task-triage, or "what should I work on?" flows override it while this command is active.

## Strategic Fast-Path

This command is a focused planning flow, not a general research session.

- Do not create TodoWrite items unless the user explicitly asked for task tracking.
- Do not run optimisation commands, status commands, or unrelated Beads triage during this flow.
- After the required scope/context reads, either ask the missing questions or write the plan file.
- Expected shape: a few targeted reads, then either one question batch or one plan write.

## Persist the Plan

After generating the plan, save it to disk for cross-session persistence:

1. Create the directory `{{PROJECT_PLANS_DIR}}/` if it does not exist
2. Generate a slug from the plan title (lowercase, hyphens, max 50 chars)
3. Write the plan to `{{PROJECT_PLANS_DIR}}/{slug}.md` with a YAML frontmatter header that carries the planning metadata:
   ```yaml
   ---
   plan: {slug}
   created: {ISO date}
   status: draft
   area: {area-or-null}
   feature: {feature-name-or-null}
   type: {feature|bug|chore}
   strategy: {strategy-or-null}
   workstream: {frontend|backend|infra|mixed|null}
   approval_gate: {yes|no}
   additional_areas:
     - {area-name}
   ---
   ```
   Rules:
   - Use `null` for fields that do not apply or are unknown after asking
   - Omit `additional_areas` if there are none
   - Do not invent metadata silently; ask first when needed
4. Structure the body using the template in `templates/workflows/PLAN.md`
5. Tell the user where the plan was saved

If Beads (`bd`) is initialized in the project, also offer to convert the task breakdown into Beads issues with dependencies and carry the same area / feature / type metadata into task naming or labels.
