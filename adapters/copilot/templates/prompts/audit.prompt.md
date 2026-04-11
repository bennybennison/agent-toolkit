---
description: "Review an area and create durable audit artifacts"
mode: "agent"
---

Create a structured audit for the following area.

If this is a review of an adapter, workflow, host, docs area, or capability:

1. Define the review scope clearly
2. Compare expected workflow versus observed behavior
3. Create a durable review workspace:
   - append an entry to `{{AUDITS_DIR}}/REVIEW_LOG.md`
   - create a review folder under `{{AUDITS_DIR}}/{date}-{slug}/`
   - create `README.md`, `USAGE_SCENARIOS.md`, and `ISSUES_AND_DECISIONS.md`
4. Consolidate duplicate findings
5. Prioritize what should be addressed first
6. In the issue map, include `Type`, `Priority`, `Blocked by`, and `Subtasks`

Do not write product code. Focus on the audit artifacts.

${input:goal:What area do you want to audit?}
