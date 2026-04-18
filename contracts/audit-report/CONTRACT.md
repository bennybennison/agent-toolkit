# Contract: AuditReport

## Purpose

`AuditReport` records review findings, policy fit, and the recommended decision
after an audit or review pass.

## When To Use

Use `AuditReport` for:

- `review-and-recommend`
- architecture or policy review
- audit-style checkpoints before approval

## Required Sections

- scope reviewed
- findings
- architecture and policy fit
- recommendation

## Notes

- findings should be ordered by severity
- the report should make blocking issues obvious

## Related Contracts

- `task-brief`
- `build-proposal`
- `verification-report`
