---
description: Assess whether a task is safe for autonomous execution and select required controls
---

Run autonomy safety assessment for: $ARGUMENTS

Use this before `/mission` or `/loop start`.

## Goal

Decide whether the requested work is safe for autonomous handling and define controls before execution begins.

## Assessment Criteria

Evaluate each criterion as `pass`, `warning`, or `fail`:

1. Scope clarity: task boundaries and success criteria are explicit
2. Blast radius: expected files/systems changed are limited and known
3. Verification path: lint/tests/checks are available and reproducible
4. Reversibility: changes can be rolled back safely
5. External risk: production/external side effects are controlled
6. Policy fit: Commander mode and mutation gate match risk level

## Required Output

Return a compact `SafetyAssessment` object:

```json
{
  "task": "...",
  "decision": "approve-autonomy|approve-with-controls|reject-autonomy",
  "riskLevel": "low|medium|high",
  "requiredControls": [
    "shadow-root-staging",
    "branch-isolation",
    "explicit-apply-gate",
    "human-checkpoint"
  ],
  "blockingReasons": [],
  "recommendedMode": "interactive|autonomous",
  "recommendedNextCommand": "/partner|/mission|/loop start"
}
```

## Decision Rules

- Any `fail` on reversibility or external risk: `reject-autonomy`
- Medium risk with full controls available: `approve-with-controls`
- Low risk with clear verification and bounded scope: `approve-autonomy`

## Hard Session State

At the start, update `{{SESSION_STATE_PATH}}` with:

- `activeCommand: "autonomy-check"`
- `goal: "Assess autonomous execution safety and required controls"`
- `phase: "discovering"` then `"executing"`
- `nextAction`: current concrete step
- `blockedReason: null` unless blocked

## Constraints

- Do not execute the task in this command
- Do not default to autonomy when risk is unclear
- Prefer conservative decisions when evidence is weak
