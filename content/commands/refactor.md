description: Refactor code through a mapped, regression-safe structure plan without changing behaviour
surface: user
---

Refactor the specified code without changing its behaviour. $ARGUMENTS

Use the `refactor-planning` skill before making changes.

**Step 1 — Map the refactor**

1. Identify the target files/area from `$ARGUMENTS` or an explicit handoff file list. Use `git diff --name-only` only when the worktree is confirmed clean or otherwise isolated to the current task
2. Read the target code and understand its current structure
3. Check AGENTS.md for architectural constraints in the target area
4. Produce:
   - a `RefactorMap`
   - a `RefactorPlan`
5. Run tests to establish a green baseline — do NOT proceed if tests are failing

Persist the refactor artifacts under `{{PROJECT_PLANS_DIR}}/refactors/` when the work is expected to span multiple files or sessions.
Use the templates in `templates/workflows/REFACTOR_MAP.md` and `templates/workflows/REFACTOR_PLAN.md`.

**Step 2 — Identify refactoring opportunities**

Scan for:

| Category | What to Look For |
|----------|-----------------|
| Dead code | Unused imports, unreachable branches, commented-out blocks |
| Duplication | Copy-pasted logic that can be extracted |
| File size | Files over 300 lines that should be split (see `the `split-large-file` skill`) |
| Naming | Variables/functions with unclear or misleading names |
| Complexity | Deep nesting, long parameter lists, god functions |
| Debug artifacts | `print()`, `console.log()`, `debugger`, agent-generated TODOs |
| Over-defensive code | Redundant null checks, bare except blocks, unnecessary type assertions |

**Step 3 — Refactor incrementally**

For each improvement:
1. Make the change
2. Run tests — confirm all pass
3. If a test breaks, revert and try a smaller step
4. Update the `RefactorPlan` if the slice boundaries change
5. Commit the change before moving to the next

**Do NOT:**
- Change behaviour or public API
- Add new features
- Refactor unrelated code outside the scope
- Remove human-written comments or TODOs

**Step 4 — Optional cleanup pass**

If the refactor leaves obvious slop, run a cleanup pass after the structural changes are stable.
Treat cleanup as optional follow-through, not as the refactor itself.

**Step 5 — Verify**

Run the full verification suite:
1. `ruff check .` — lint
2. `ruff format --check .` — format
3. `mypy .` — types (if configured)
4. `uv run pytest` — tests

**Step 6 — Report**

```
REFACTOR REPORT
===============
Files scanned:  {N}
Changes made:   {M}
  - {N} dead code removals
  - {N} duplication extractions
  - {N} naming improvements
  - {N} complexity reductions
  - {N} debug artifact removals

Build:  {PASS/FAIL}
Tests:  {PASS/FAIL}
Lint:   {PASS/FAIL}

Behaviour changes: NONE
```
