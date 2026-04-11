---
name: "search-first"
description: "Research before coding. Understand what exists before building."
pack: "skills-core"
---

# Skill: Search-First Workflow

Research before coding. Understand what exists before building.

---

## The Decision Matrix

Before building anything, evaluate existing options:

```
Need a solution?
  |
  +-- Does it already exist in the codebase?
  |     -> ADOPT: Use it as-is
  |
  +-- Does something similar exist that could be modified?
  |     -> EXTEND: Add to it rather than duplicating
  |
  +-- Can multiple existing pieces be combined?
  |     -> COMPOSE: Wire them together
  |
  +-- Nothing exists?
        -> BUILD: Create from scratch
```

### Priority Order

1. **Adopt** — always preferred. Zero new code.
2. **Extend** — add to existing. Minimal new code.
3. **Compose** — combine existing. New glue code only.
4. **Build** — last resort. Full new implementation.

## Before Writing Code

1. **Search the codebase** for existing solutions:
   - Grep for related function names, class names, patterns
   - Check SKILL.md files for exposed capabilities
   - Check AGENTS.md files for documented patterns

2. **Search dependencies** for built-in solutions:
   - Check `packages.md` or `pyproject.toml` for already-installed packages
   - Read docs for packages you're already using — they may have the feature

3. **Search external options** (if building):
   - Is there a well-maintained package that solves this?
   - Check `packages.md` rules — some packages are preferred over others

## Document the Decision

If you chose **extend**, **compose**, or **build**, briefly note why in a comment or the relevant AGENTS.md:

```python
# Chose to extend AmazonClient.get_orders() rather than build a new
# order fetcher — the existing client already handles auth and pagination.
```

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Build before searching | Search first — always |
| Duplicate existing logic | Find it and import it |
| Add a new package for one function | Check if stdlib or existing deps cover it |
| Copy-paste from another file | Extract to shared module and import |

---

## See Also

- [iterative-retrieval](../iterative-retrieval/SKILL.md) — Multi-round search strategy
