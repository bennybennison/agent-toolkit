---
description: Run UI-first workflow for mocked frontend concepts with fake data and explicit handoff
surface: user
---

Use UI-First Mode for: $ARGUMENTS

Treat this as the Orchestrator's `wireframe`-mode alias when the goal is mocked UI and fake-data validation.

Work in this order:

1. discover the user workflow
2. define screens, actions, and visible data
3. create realistic fake data
4. build wireframes or mocked UI in a dedicated concept branch
5. validate one or more workflow slices through the mock UI
6. produce an explicit UI handoff

Then stop.

Do not continue into backend derivation, infrastructure planning, or production implementation unless the user explicitly changes mode.

## Required Outputs

Produce the smallest useful set of these artifacts:

- `WorkflowBrief`
- `ScreenFlowSpec`
- `ScreenSpec`
- `MockDataset`
- `WireframeSpec`
- `UiMockHandoff`

## Guardrails

- Prefer realistic fake data over backend speculation.
- Keep the concept branch clearly separate from production implementation work.
- Make the handoff boundary explicit.
- State what remains intentionally undefined.
