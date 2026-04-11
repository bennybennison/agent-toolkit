---
name: "verification-loop"
description: "Comprehensive verification system to run before committing, creating PRs, or shipping."
pack: "skills-core"
---

# Skill: Verification Loop

Comprehensive verification system to run before committing, creating PRs, or shipping.

## When to Use

- After completing a feature or significant code change
- Before creating a PR
- After refactoring
- Periodically during long sessions (every 15-20 minutes of active work)

## Verification Phases

Run all phases sequentially. If any phase fails, stop and fix before continuing.

### Phase 1: Build

```bash
# Python
uv run python -m py_compile src/main.py

# TypeScript
npm run build
```

If build fails, STOP. Fix build errors before any other verification.

### Phase 2: Type Check

```bash
# Python
uv run mypy src/

# TypeScript
npx tsc --noEmit
```

Report all type errors. Fix critical ones before continuing.

### Phase 3: Lint

```bash
# Python
uv run ruff check .

# TypeScript
npm run lint
```

Auto-fix where safe: `ruff check --fix .`

### Phase 4: Tests

```bash
# Python
uv run pytest --tb=short

# TypeScript
npm test
```

Report: total / passed / failed / skipped.

### Phase 5: Security Scan

Check for:
- Hardcoded secrets (`sk-`, `api_key=`, passwords in source)
- `.env` files staged for commit
- Debug code left behind (`print()`, `console.log()`, `debugger`)
- SQL injection vectors (string-formatted queries)

### Phase 6: Diff Review

```bash
git diff --stat
git diff --name-only
```

Review each changed file for:
- Unintended changes (leftover debug code, unrelated modifications)
- Missing error handling
- Potential edge cases
- Files that should not be committed

## Output Format

```
VERIFICATION REPORT
===================

Build:     [PASS/FAIL]
Types:     [PASS/FAIL] (X errors)
Lint:      [PASS/FAIL] (X warnings)
Tests:     [PASS/FAIL] (X/Y passed)
Security:  [PASS/FAIL] (X issues)
Diff:      [X files changed]

Verdict:   [READY / NOT READY]

Issues to Fix:
1. ...
2. ...
```

## Continuous Mode

During long sessions, set mental checkpoints:
- After completing each function or component
- After finishing a logical unit of work
- Before moving to the next task

Run `/verify` at each checkpoint. Do not let errors accumulate.

## Integration

- Complements hooks (hooks catch issues immediately; this is comprehensive review)
- Run before `/review` (no point reviewing code that does not build)
- Use after `/plan` implementation is complete

---

## See Also

- [autonomous-loops](../autonomous-loops/SKILL.md) — Self-directed work cycles that use verification
