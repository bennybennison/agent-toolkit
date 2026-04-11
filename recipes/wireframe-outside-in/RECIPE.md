---
description: Derive a front-end-first implementation slice using mock data, interface flows, and API contracts before backend completion.
interaction_policy: confirm-first
capability_ceiling: mutate
contracts: WireframePlan, ApiContractSet, MockDataPlan
skills: using-agent-toolkit, outside-in-mode, screen-flow-design, mock-api-contracts, mock-data-design
specialists: architect, mapper, builder, verifier
---

# Wireframe Outside In

Use this recipe when the fastest path is to establish the user-facing experience first, backed by mock data and explicit contracts.

The recipe should leave behind:

- a visible UI slice
- the mocked or provisional data model
- the API contracts or backend expectations needed to complete the system later
