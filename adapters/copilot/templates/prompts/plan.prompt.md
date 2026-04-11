---
description: "Create an implementation plan with approach evaluation and step breakdown"
mode: "agent"
---

Create a structured plan for the following work. Follow this process:

1. Read `AGENTS.md` in the target area to understand conventions
2. Map affected files and dependencies
3. Choose an explicit implementation strategy:
   - `outside-in`
   - `ui-first`
   - `inside-out`
   - `frontend-first`
   - `backend-first`
   - `infra-first`
   - `full-stack-staged`
   - `repair-first`
4. Evaluate 2-3 approaches (compare complexity, risk, reversibility)
5. Recommend one approach with rationale
6. Break down into ordered implementation steps
7. If this is a review or audit, define a durable review workspace:
   - append an entry to `{{AUDITS_DIR}}/REVIEW_LOG.md`
   - create a review folder under `{{AUDITS_DIR}}/{date}-{slug}/`
   - use `README.md`, `USAGE_SCENARIOS.md`, and `ISSUES_AND_DECISIONS.md` as the default file set
8. If this work produces scenarios, issues, or findings, do a final consolidation pass:
   - merge duplicates or near-duplicates
   - preserve unique details before collapsing items
   - group related items into a smaller set of themes
   - prioritize what should be addressed first
   - if you use a matrix, include a `Priority` field for each row
   - classify each issue as `bug`, `feature-gap`, `docs-gap`, `ux-gap`, `workflow-gap`, `ownership-gap`, `cleanup-gap`, or `decision-gap`
   - record `Blocked by` when an issue depends on another
   - convert smaller dependent items into `Subtasks` where that makes the backlog clearer

Output format:

```markdown
## Goal
One sentence.

## Approach
Which approach and why.

## Strategy
- Chosen strategy
- Why it fits

## Steps
1. Step — what and why
2. Step — what and why

## Risks
- Risk: mitigation

## Review Workspace
- Log entry
- Review folder
- Files to create

## Consolidation
- What was merged or grouped
- Which themes appeared

## Priorities
1. Highest-priority item — why now
2. Next item — why next

## Issue Map
- Type
- Priority
- Blocked by
- Subtasks

## Files Affected
- path/file — what changes
```

Prefer simple over clever. Flag if scope is too large for one PR.

${input:goal:What do you want to build or change?}
