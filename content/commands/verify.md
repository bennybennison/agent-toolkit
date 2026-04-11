---
description: Verify code quality, types, tests, and documentation
---

Run a verification pass for the current project or scope: $ARGUMENTS

Select checks that match the repo stack instead of assuming Python-only tooling.

Core check categories:

1. **Lint check** — use the project-native linter
2. **Format check** — use the project-native formatter when configured
3. **Type or static check** — use the project-native type checker when configured
4. **Tests** — run the smallest meaningful automated test set first
5. **File size / maintainability check** — find oversized source files when relevant
6. **Documentation check** — verify AGENTS.md or equivalent governance docs are present for modified packages when that rule applies

Common examples:

- Python:
  - `ruff check .`
  - `ruff format --check .`
  - `mypy .`
  - `uv run pytest`
- TypeScript:
  - `eslint .`
  - `prettier --check .`
  - `tsc --noEmit`
  - project test runner

Produce a `VerificationReport` that includes:

- checks run
- expected versus actual result
- evidence
- issues found
- signoff recommendation

Report results as a summary table:

| Check | Status | Details |
|-------|--------|---------|

If any checks fail, list the specific issues and suggest fixes.
