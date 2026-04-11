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
- `contracts`
- `skills`
- `specialists`

Recipes are intentionally separate from shared skills:

- skills = reusable techniques and workflow knowledge
- recipes = top-level execution routes the orchestrator chooses from
- contracts = durable handover/output objects a recipe must produce or consume

The initial recipe set is intentionally small so the visible workflow stays simple while the hidden specialist layer remains available behind it.
