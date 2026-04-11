---
name: "refactor-planning"
description: "Plan refactors as behavior-preserving structure work with explicit safety rails."
pack: "skills-discovery"
---

# Skill: Refactor Planning

Plan refactors as behavior-preserving structure work with explicit safety rails.

## Goal

Produce:

- a `RefactorMap`
- a `RefactorPlan`

Use the templates in `templates/workflows/REFACTOR_MAP.md` and `templates/workflows/REFACTOR_PLAN.md`.

## Process

1. Define the refactor target and non-goals
2. Identify the main structural problems:
   - duplication
   - oversized files
   - confusing boundaries
   - outdated patterns
   - technical debt hotspots
3. Mark the safe scope boundaries
4. Define incremental slices
5. Define the regression safety net:
   - tests
   - lint/type checks
   - manual checks
6. Decide whether cleanup is a final pass or unnecessary

## Output

Capture:

- current problems
- affected files and risks
- refactor slices
- verification strategy
- rollback or stop conditions

## Anti-Patterns

- Treating cleanup and refactor as the same thing
- Mixing behavior changes into a structural refactor
- Starting a broad refactor without a regression plan
