---
description: Diagnose and repair a bug or unstable behavior with a diagnosis-first workflow
surface: user
---

Use the `bug-diagnosis` and `implementation-strategy-selection` skills for: $ARGUMENTS

Treat this as the Orchestrator's `repair`-mode alias.

## Workflow

1. Reproduce or clearly define the reproduction blocker
2. Produce a `BugDiagnosis`
3. Choose the repair strategy
4. Implement the narrowest credible fix
5. Verify the repair with focused evidence

## Persist The Diagnosis

1. Create `{{PROJECT_PLANS_DIR}}/repairs/` if it does not exist
2. Save the diagnosis to `{{PROJECT_PLANS_DIR}}/repairs/{slug}-bug-diagnosis.md`
3. Use the template in `templates/workflows/BUG_DIAGNOSIS.md`

## Guardrails

- Do not jump straight from symptom to fix
- Treat diagnosis as required work, not optional preamble
- Prefer focused verification tied to the reproduced failure
- If the issue is really a build/type failure with no broader diagnosis needed, `/build-fix` is still the fast path
