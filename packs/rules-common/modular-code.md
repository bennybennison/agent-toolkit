---
rule: modular-code
scope: universal
profile: standard, full
tags: [code-quality, modularity, file-structure]
---

# Modular Code Enforcement

Code should be organized into focused, single-purpose modules. Catch-all files create navigation and maintenance debt for both humans and agents.

## Rules

### Banned Catch-All File Names

| Banned | Use Instead |
|--------|-------------|
| `utils.*` | Name by function, such as `date-formatting.py` or `string-helpers.ts` |
| `helpers.*` | Name by purpose, such as `validation.ts` |
| `misc.*` | Find the correct module or create one |
| `common.*` | Split into types, constants, adapters, or other specific modules |
| `functions.*` | Name by what the functions actually do |
| `stuff.*` | Never acceptable |

`utils/` as a directory is acceptable when the files inside are still specific and focused.

### Index Files Are Entry Points Only

`index.ts`, `__init__.py`, and similar entry points should re-export or wire things together, not hold core business logic.

### File Size Limits

| File Type | Soft Limit | Hard Limit | Action |
|-----------|-----------|------------|--------|
| Source code | 200 lines | 300 lines | Split using a focused extraction |
| Test files | 300 lines | 400 lines | Split by scenario or class |
| `AGENTS.md` | 150 lines | 200 lines | Split by sub-area |
| `SKILL.md` | 300 lines | 400 lines | Split by capability area |

### One Concept Per File

Each source file should cover one concept:

- one class and its directly related private helpers
- one closely related function set
- one type family or model group

### Module Cohesion

If removing one function would make the rest of the file still make sense as a coherent unit, cohesion is probably fine. If not, the file is probably mixing concerns.

## Prohibited

1. Catch-all filenames used as dumping grounds
2. Index files containing substantial business logic
3. Source files growing past the hard limit without a split plan
4. Mixing unrelated concerns in one module
