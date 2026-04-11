---
rule: monorepo-governance
scope: universal
profile: standard, full
tags: [monorepo, governance, planning, task-management]
---

# Monorepo Governance

Multi-area repositories need explicit boundaries, sequencing, and area ownership. Agents should not treat a monorepo like a flat codebase.

## Rules

### Identify Scope Before Acting

If a repository clearly contains multiple apps or areas, identify the target area before implementation.

- Use a focus or map step for one target area
- If multiple areas are affected, name them explicitly
- Do not start broad cross-area edits without stating why multiple areas are required

### Portfolio Hierarchy

Keep these levels distinct:

1. Portfolio
2. App or area
3. Feature
4. Task

Portfolio decisions are not the same as app decisions, feature work, or concrete implementation tasks.

### Mandatory Planning Gate

For monorepo work, planning is mandatory before implementation when:

- the work spans multiple files
- the work creates or changes a feature
- the work touches more than one area
- the work changes an area’s public interface

Required behavior:

1. map the area
2. produce the plan
3. stop after the plan unless autonomous execution was explicitly requested

### Area Boundaries Must Be Visible

Each area should declare:

- what it owns
- what it depends on
- what it exports
- what it should not touch

### Task Labels Must Encode Structure

For durable planning or issue tracking, labels should make the structure visible:

- `area:{name}`
- `feature:{name}`
- `type:feature|bug|chore`

## Prohibited

1. Starting feature-sized monorepo work without naming the area
2. Crossing app boundaries silently
3. Treating a multi-app repo as one undifferentiated task stream
4. Skipping a planning gate where one should exist
