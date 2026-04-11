---
description: Diagnose and fix build or type errors with minimal diffs
surface: user-agent
agent: build-fixer
subtask: true
---

Diagnose and fix the build or type errors in the current project. $ARGUMENTS

If this work starts repeating the same steps or re-fixing the same errors, stop and escalate. Do NOT spin.

**Step 1 — Collect all errors**

Run the appropriate build/type check commands:

```bash
# Python
uv run mypy src/ --no-error-summary
uv run ruff check .

# TypeScript
npx tsc --noEmit --pretty
npm run build
```

If no specific scope is given, run all applicable checks.

**Step 2 — Categorise and prioritise**

Group errors by type:
1. Build-blocking errors (imports, syntax, missing modules) — fix first
2. Type errors (missing annotations, incompatible types) — fix second
3. Lint warnings (unused imports, formatting) — fix last

**Step 3 — Fix with minimal diffs**

For each error:
- Apply the smallest change that resolves the error
- Do not refactor unrelated code
- Do not change architecture or patterns
- Do not rename variables unless they cause the error

**Step 4 — Verify in a loop**

After each batch of fixes:
1. Re-run the build/type checker
2. If new errors appeared, fix those too
3. Track iterations explicitly (default max 10)
4. If you hit the same error class 3 times (even if the exact message text changes), escalate to the user
5. Repeat until the build passes or you hit the iteration cap

Maintain loop notes so you don't re-do the same work after compaction:

```markdown
### Iteration {N}
- Checks run: {commands}
- Top errors: {1-3 bullets}
- Fixes applied: {1-3 bullets}
- Result: {pass/fail}
```

**Step 5 — Report**

```
BUILD FIX REPORT
================
Errors found:    {N}
Errors fixed:    {M}
Errors remaining: {R}

Build:  {PASS/FAIL}
Types:  {PASS/FAIL}
Lint:   {PASS/FAIL}

Changes made:
- {file}: {what was fixed}
```

If errors remain that cannot be fixed with minimal diffs (e.g., require architectural changes), report them and explain why.
