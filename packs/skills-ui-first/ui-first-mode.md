---
skill: ui-first-mode
scope: universal
profile: standard, full
tags: [product-design, ui, wireframes, internal-tools, frontend]
---

# Skill: UI-First Mode

Use this when the desired end product is a mocked frontend experience, not a backend implementation plan.

## Core Rule

Work in this order:

1. workflow
2. screens
3. visible data
4. realistic fake data
5. wireframes or mocked UI
6. compact handoff

Then stop.

Do not continue into backend derivation or infrastructure planning unless the user explicitly changes mode.

## When To Use

- internal tool concepting
- operational app wireframes
- frontend validation before implementation ownership changes
- stakeholder review branches with fake data

## Required Outputs

Create or update these artifacts as needed:

- `WorkflowBrief`
- `ScreenFlowSpec`
- `ScreenSpec`
- `MockDataset`
- `WireframeSpec`
- `UiMockHandoff`

Use the templates in `templates/ui-first/` when creating them.

## Delivery Rule

The mocked UI should live in a dedicated concept branch where possible.

Examples:

- `ui-first/<feature>`
- `wireframes/<feature>`

Treat the branch as a prototype branch, not a backend implementation branch.

## Handoff Rule

The final output must make three things explicit:

1. what the UI proves
2. what assumptions are still fake
3. what the next process must decide

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Start backend modeling | Stop at mocked UI |
| Add real APIs too early | Use fake data and local mocks |
| Treat the prototype branch as production-ready | Mark it as a UI concept branch |
| Leave the handoff implicit | Produce an explicit UI handoff artifact |

## See Also

- [wireframe-planning](wireframe-planning.md)
- [mock-ui-handoff](mock-ui-handoff.md)
