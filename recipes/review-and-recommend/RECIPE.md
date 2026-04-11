---
description: Review code or plans, surface findings, and recommend the next action without silently applying changes.
interaction_policy: confirm-first
capability_ceiling: verify
contracts: AuditReport, RecommendationSet
skills: using-agent-toolkit, security-review, review-specs
specialists: code-reviewer, auditor, researcher, architect
---

# Review And Recommend

Use this recipe when the user wants critique, audit, or review findings first.

Lead with:

- concrete issues
- risks and regressions
- missing tests or verification gaps

Do not mutate by default from this route unless the user explicitly converts it into an implementation task.
