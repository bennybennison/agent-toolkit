# Recipes

Recipes are the toolkit's first-class orchestration workflows.

Use a recipe when the top-level orchestrator needs to choose how to proceed, what artifacts to produce, which hidden specialists are allowed, and what interaction cadence and permission ceiling should apply.

Each recipe lives in its own folder:

```text
recipes/<recipe-id>/RECIPE.md
```

Each `RECIPE.md` should include frontmatter with:

- `description`
- `interaction_policy`
- `capability_ceiling`
- `contract_mode`
- `artifact_root`
- `contracts`
- `skills`
- `specialists`

`contracts` should use toolkit contract IDs from `contracts/<contract-id>/`,
for example:

- `task-brief`
- `plan`
- `map-report`
- `build-proposal`
- `audit-report`
- `verification-report`
- `context-bundle`

Recipes are intentionally separate from shared skills:

- skills = reusable techniques and workflow knowledge
- recipes = top-level execution routes the orchestrator chooses from
- contracts = durable handover/output objects a recipe must produce or consume

### Contract Fields

Recipes can declare how strongly they depend on contracts:

- `contract_mode: advisory`
  - contracts are recommended structure, but lightweight execution can proceed
- `contract_mode: required`
  - the workflow should produce or consume the listed contract-backed artifacts
- `contract_mode: validated`
  - the workflow should treat the contracts as required and suitable for stronger
    validation by an optional contract-aware specialist or backend

Recipes can also declare a default durable output root:

- `artifact_root`
  - repo-relative path where recipe-backed Markdown artifacts should be stored
  - default convention is under `.agent-artifacts/`
  - common subdirectories include `plans/`, `context-bundles/`, `handoffs/`,
    `verification/`, and `decisions/`

The initial recipe set is intentionally small so the visible workflow stays simple while the hidden specialist layer remains available behind it.
