---
description: Run workflow-first internal tool design using Outside-In Mode
surface: user
---

Use Outside-In Mode for: $ARGUMENTS

Treat this as the Orchestrator's `wireframe`-mode alias when the user wants outside-in design.

Work in this order:

1. discover the user workflow
2. define screens, actions, and visible data
3. create mock datasets
4. define mock API contracts and mock FastAPI endpoints where useful
5. validate that one workflow slice works conceptually
6. derive raw data, transforms, and backend services
7. derive infrastructure and implementation requirements

## Required Outputs

Produce the smallest useful set of these artifacts:

- `WorkflowBrief`
- `ScreenFlowSpec`
- `ScreenSpec`
- `MockDataset`
- `ApiContract`
- `ValidatedAppSlice`
- `DataRequirementSpec`
- `BackendRequirementSpec`
- `InfraRequirementSpec`
- `ImplementationPlan`

## Guardrails

- Do not design the whole backend before validating at least one workflow slice.
- Do not create infrastructure plans before the screen and contract layer is coherent.
- Prefer realistic mock data over abstract placeholder records.
- Tie every backend requirement back to a user action, visible field, or workflow step.
