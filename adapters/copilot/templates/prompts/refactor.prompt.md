---
description: "Refactor code — split large files, extract modules, improve structure without changing behaviour"
mode: "agent"
---

Refactor the specified code following these principles:

## Process

1. **Assess** — Read the target code and understand its responsibilities
2. **Identify boundaries** — Find natural split points (classes, API groups, concerns)
3. **Create a `RefactorMap`** — capture structural problems, affected files, and regression risks
4. **Create a `RefactorPlan`** — list each slice with rationale and verification
5. **Execute** — One change at a time, verify tests pass after each step
6. **Verify** — Run full test suite, check no behaviour changed

## File Size Caps

| Type | Max Lines | Action |
|------|-----------|--------|
| Source | 300 | Split by responsibility |
| Tests | 500 | Split by test class |

## Split Naming

```
pricing.py (too large)
  → pricing_eligible.py
  → pricing_competitive.py
  → pricing_batch.py
  → pricing.py (barrel re-exports)
```

## Rules

- Refactoring and behaviour changes are separate commits
- Cleanup is a follow-up pass, not the refactor itself
- Keep original file as barrel (re-exports) or update all import sites
- No resulting file under 50 lines (too granular)
- Update AGENTS.md if module structure changed

${input:target:What should I refactor? (file path or module)}
