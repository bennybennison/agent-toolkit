---
description: Set the active working area in a monorepo to scope context and enforce boundaries
---

# Focus — Monorepo Area Selector

Sets the active working area in a monorepo project. This scopes the agent's context to a specific area, loads its area-specific AGENTS.md, and establishes import/dependency boundaries.

## Usage

```
/focus <area-name>
```

Where `<area-name>` matches a key in the monorepo map defined in the project's root AGENTS.md.

## Behavior

1. **Read the monorepo map** from the project's root AGENTS.md (the `## Monorepo Map` section)
2. **Find the matching area** by name
3. **Read the area's AGENTS.md** at the path specified in the map
4. **Set scope boundary** — remind yourself of:
   - What this area owns (its path and responsibilities)
   - What it imports from other areas (explicit dependencies)
   - What it exports to other areas (public API surface)
   - What it must NEVER touch (boundaries)
5. **Confirm focus** — tell the user which area is active and summarize its boundaries
6. **Surface planning gate** — if the requested work appears feature-sized or likely to cross into other areas, say that `/plan` should be used before implementation

## Example

Given a root AGENTS.md with:

```markdown
## Monorepo Map

| Area | Path | AGENTS.md | Description |
|------|------|-----------|-------------|
| connectors | `src/connectors/` | `src/connectors/AGENTS.md` | Platform integrations |
| domain | `src/domain/` | `src/domain/AGENTS.md` | Business logic and entities |
| api | `src/api/` | `src/api/AGENTS.md` | FastAPI routes and DTOs |
| frontend | `frontend/` | `frontend/AGENTS.md` | React SPA |
```

Running `/focus connectors` would:
1. Read `src/connectors/AGENTS.md`
2. Note that connectors imports from `src/domain/` and exports connector interfaces
3. Confirm: "Focused on **connectors** (`src/connectors/`). This area imports from domain entities and exports connector client classes. It must not import from api or frontend."

## When to Use

- Before starting work on a specific area of a monorepo
- When switching between areas during a session
- When the agent starts making changes outside its current scope

## Notes

- If no monorepo map exists in the root AGENTS.md, tell the user to add one (see `templates/AGENTS.md` for the format)
- The focus is advisory — it helps the agent stay in scope but does not prevent cross-area reads when investigating
- Running `/focus` without arguments should list all available areas from the map
