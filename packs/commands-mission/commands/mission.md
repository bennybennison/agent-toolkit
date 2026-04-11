---
description: Run optional autonomous mission workflow with staged execution and specialist gate sequence
surface: user
---

Run autonomous mission mode for: $ARGUMENTS

Use this only when the user explicitly requests autonomous or batch execution.

Before running, execute `/autonomy-check $ARGUMENTS`.

## Workflow

1. Emit `TaskBrief` with `operationStyle=autonomous`
2. Run `@mapper` -> `@builder` -> `@auditor` -> `@verifier`
3. Ensure branch isolation (`mission/<mission-id>`) before any autonomous edits
4. Stage edits and collect evidence before apply
5. Enforce Commander escalation policy on low confidence
6. End with explicit apply recommendation

## Guardrails

- Fail fast on critical audit or verification issues
- Do not bypass review gates
- Keep all handoffs schema-first and compact
- Require explicit approval before irreversible actions
- If branch isolation cannot be established, report it explicitly and downshift to interactive mode unless user overrides

## Output

Return:
- mission id and status
- stage-by-stage outcomes
- audit decision and verification evidence
- apply recommendation (`approve` or `hold`)
