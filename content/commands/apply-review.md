---
description: Execute final apply gate review using BuildProposal, AuditReport, and VerificationReport evidence
surface: internal
---

Run apply review for mission: $ARGUMENTS

Use this command after build, audit, and verification payloads exist.

## Gate Criteria

1. `BuildProposal` confidence is documented and scope-bounded
2. `AuditReport.approved` is true and has no critical unresolved findings
3. `VerificationReport.signed` is true with reproducible evidence
4. Commander mode policy allows apply at current confidence level

## Decision Rules

- If any criterion fails: return `hold` with required remediation
- If all criteria pass: return `approve` with final rationale

## Output

Return exactly:
- decision: `approve` | `hold`
- rationale: concise explanation
- blocking findings: list (empty if approved)
- next step: `apply` | `rework`
