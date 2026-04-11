---
name: "backend-derivation"
description: "Derive backend needs from validated workflow and contract artifacts."
pack: "skills-outside-in"
---

# Skill: Backend Derivation

Derive backend needs from validated workflow and contract artifacts.

## Goal

Produce:

- `DataRequirementSpec`
- `BackendRequirementSpec`

## Inputs

Start from:

- `WorkflowBrief`
- `ScreenFlowSpec`
- `ScreenSpec`
- `MockDataset`
- `ApiContract`
- `ValidatedAppSlice`

## Derive

- raw source systems
- required fields
- joins
- transforms
- validation rules
- service boundaries
- persistence needs

## Rule

Only include backend elements that support a validated screen action, visible field, or workflow step.

If a service or table cannot be traced back to a concrete workflow need, it is probably premature.

## Anti-Patterns

- Rebuilding the whole domain before a single slice is validated
- Inventing abstractions with no direct workflow driver
- Treating mock contract fields as automatically identical to raw source data
