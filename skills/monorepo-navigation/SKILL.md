---
name: "monorepo-navigation"
description: "Patterns for navigating and maintaining boundaries in monorepo projects. Works with the `/focus` command to scope agent context to specific areas."
pack: "skills-ops"
---

# Skill: Monorepo Navigation

Patterns for navigating and maintaining boundaries in monorepo projects. Works with the `/focus` command to scope agent context to specific areas.

---

## Monorepo Map

Every monorepo project should have a **Monorepo Map** section in its root AGENTS.md. This is a routing table that tells the agent where to find each area and its documentation.

```markdown
## Monorepo Map

| Area | Path | AGENTS.md | Description |
|------|------|-----------|-------------|
| domain | `src/domain/` | `src/domain/AGENTS.md` | Business logic, entities, ports |
| connectors | `src/connectors/` | `src/connectors/AGENTS.md` | Platform integrations |
| api | `src/api/` | `src/api/AGENTS.md` | FastAPI routes and DTOs |
| workers | `src/workers/` | `src/workers/AGENTS.md` | Background jobs and schedulers |
| frontend | `frontend/` | `frontend/AGENTS.md` | React SPA |
| shared | `src/shared/` | `src/shared/AGENTS.md` | Cross-cutting utilities |
```

The map exists to prevent the agent from randomly exploring the codebase. When asked to work on something, the agent should:

1. Check the monorepo map for the relevant area
2. Read that area's AGENTS.md
3. Understand the area's boundaries before making changes

---

## Area AGENTS.md — Boundary Section

Each area's AGENTS.md should include an **Imports / Exports / Boundaries** section that declares its dependencies:

```markdown
## Boundaries

### Imports (this area depends on)
- `src/domain/entities` — Order, Product, Money value objects
- `src/shared/logging` — structured logger setup

### Exports (other areas may use)
- `src/connectors/amazon/client.py` — AmazonClient class
- `src/connectors/shopify/client.py` — ShopifyClient class

### Never Touches
- `src/api/` — connectors do not know about API routes
- `frontend/` — connectors have no frontend awareness
- `src/workers/` — connectors are called BY workers, never call them
```

Why this matters: Without explicit boundaries, the agent will create convenient but architecturally wrong shortcuts (e.g., a connector importing from the API layer to reuse a Pydantic model).

---

## Cross-Area Change Protocol

When a change requires modifying multiple areas:

1. **Identify all affected areas** before starting
2. **Start from the innermost layer** — domain first, then outward
3. **Respect import direction** — changes flow from domain → application → infrastructure → interface
4. **Update each area's AGENTS.md** if the change modifies its public surface

### Example: Adding a new entity

```
1. src/domain/entities/        — add the entity dataclass
2. src/domain/ports/           — add the repository Protocol
3. src/connectors/             — implement the repository adapter
4. src/api/schemas/            — add request/response Pydantic models
5. src/api/routes/             — add the endpoint
6. frontend/                   — add the UI (if applicable)
```

Each step happens in its own area and respects that area's patterns.

---

## Shared Code Rules

The `shared/` area (or equivalent) contains cross-cutting utilities. Rules for shared code:

- **Minimal dependencies** — shared code should only depend on stdlib and universal third-party libs
- **No business logic** — if it encodes domain knowledge, it belongs in `domain/`
- **Stable interfaces** — changes to shared code affect all areas, so interfaces should be stable
- **Well-documented** — every shared module needs clear docstrings explaining its purpose

Examples of good shared code:
- Logging setup and formatters
- Common error types (not domain-specific ones)
- Retry/backoff utilities
- Date/time helpers

Examples of code that should NOT be shared:
- Order processing logic (→ domain)
- API serialization helpers (→ api)
- Platform-specific utilities (→ connectors)

---

## Navigation Workflow

When the user asks you to work on something in a monorepo:

1. **Check if a focus area is set** — if not, determine the right area from the request
2. **Read the monorepo map** — find the relevant area(s)
3. **Read the area's AGENTS.md** — understand its patterns and boundaries
4. **Do the work** — stay within the area's boundaries
5. **If you need to cross boundaries** — explicitly call this out to the user and explain why

---

## See Also

- `/focus` command — sets the active working area
- `templates/AGENTS.md` — includes monorepo map template section
- `rules/python/imports.md` — Clean Architecture import boundaries
