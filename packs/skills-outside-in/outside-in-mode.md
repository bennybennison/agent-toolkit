---
skill: outside-in-mode
scope: universal
profile: standard, full
tags: [product-design, internal-tools, workflow, ui, planning]
---

# Skill: Outside-In Mode

Use this when designing an internal tool or operational app where the safest path is to prove the workflow and UI before locking in backend structure.

## When To Use

- admin tools
- warehouse support tools
- ecommerce operations dashboards
- business process tools
- internal apps with messy or evolving backend realities

## Core Rule

Work in this order:

1. workflow
2. screens
3. visible data
4. mock data
5. mock contracts
6. backend derivation
7. infrastructure derivation

Do not jump straight to database tables, service layers, or event pipelines unless the user explicitly wants backend-first design.

## Required Outputs

Create or update these artifacts as needed:

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

Use the templates in `templates/outside-in/` when creating them.

## Phase Flow

### Phase 1: Workflow Discovery

First determine:

- who the user is
- what job they are doing
- what they do repeatedly
- what slows them down
- what outcomes matter

Primary skill:

- `workflow-discovery`

### Phase 2: Screen Flow Design

Turn jobs into:

- screens
- actions
- screen-to-screen transitions
- required visible data
- empty, error, and exception states

Primary skill:

- `screen-flow-design`

### Phase 3: Mock System

Create:

- representative mock records
- UI-facing API contracts
- mock endpoints or FastAPI stubs

Then validate that the UI flow can operate against those mocks.

Primary skills:

- `mock-data-design`
- `mock-api-contracts`

### Phase 4: Backward Derivation

Once the mocked slice makes sense, derive:

- upstream source systems
- raw fields
- joins and transforms
- service boundaries

Primary skill:

- `backend-derivation`

### Phase 5: Infra And Delivery

Only after the validated slice exists, define:

- auth
- persistence
- background jobs
- deployment
- observability

Primary skill:

- `infra-derivation`

## Heuristics

- Prefer one validated workflow slice over broad speculative backend design.
- Prefer believable mock data over abstract schemas.
- Prefer UI-facing contracts over internal service contracts in the first pass.
- Prefer deriving backend needs from real screen actions instead of inventing service layers early.

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Start from database tables | Start from user jobs and screens |
| Model the entire backend first | Prove one workflow slice first |
| Use unrealistic mock data | Use realistic records and edge cases |
| Design internal services before UI actions are clear | Let screen actions drive contract design |
| Over-spec infrastructure on day one | Derive infra after workflows and contracts stabilize |

## See Also

- [workflow-discovery](workflow-discovery.md)
- [screen-flow-design](screen-flow-design.md)
- [mock-data-design](mock-data-design.md)
- [mock-api-contracts](mock-api-contracts.md)
- [backend-derivation](backend-derivation.md)
- [infra-derivation](infra-derivation.md)
