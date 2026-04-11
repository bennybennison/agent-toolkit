---
description: Review an area and persist a durable audit trail
surface: user-agent
agent: audit-planner
---

Before delegating to `@audit-planner`, gather a compact evidence bundle for the requested review area. Include the following context when it exists:

Treat this as the Orchestrator's structured `review`-mode alias.
- AGENTS.md in the target area
- CONSTITUTION.md
- GOTCHAS.md
- relevant specs in {{SPECS_DIR}}/
- any earlier related review folders under `{{AUDITS_DIR}}/`

If the review scope is ambiguous, ask the user to narrow the area before continuing.

Review the following area and create a durable audit trail: $ARGUMENTS

The audit should:

1. Define the requested review scope clearly
2. Compare expected workflow versus observed behavior
3. Generate usage scenarios where useful
4. Consolidate findings into issues and decisions
5. Prioritize what should be addressed first
6. Persist the review in a reusable folder structure

## Persist the Audit

After generating the audit:

1. Create `{{AUDITS_DIR}}/` if it does not exist
2. Create a slug from the review area (lowercase, hyphens, max 50 chars)
3. Create a review folder at `{{AUDITS_DIR}}/{date}-{slug}/`
4. Append a new entry to `{{AUDITS_DIR}}/REVIEW_LOG.md` with:
   - review id: `{date}-{slug}`
   - area reviewed
   - status
   - review folder path
   - artifact file names
5. Write these files in the review folder:
   - `README.md` — scope, status, summary, related earlier reviews, and artifact index
   - `USAGE_SCENARIOS.md` — scenario matrix and scenario narratives for the requested area
   - `ISSUES_AND_DECISIONS.md` — consolidated findings with `Type`, `Priority`, `Blocked by`, and `Subtasks`
6. If this continues an earlier review, cross-link the old and new folders instead of overwriting the earlier audit

Do NOT write product code. Only create the audit artifacts.
