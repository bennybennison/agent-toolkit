---
description: Run a structured TDD cycle — write failing test, implement, verify, refactor
surface: user-agent
agent: tdd-runner
subtask: true
---

Follow the TDD workflow defined in `the `tdd-workflow` skill` for: $ARGUMENTS

**Step 1 — RED: Write a Failing Test**

1. Read the existing test structure (`tests/` directory) and match the project's conventions
2. Write ONE test that describes the desired behaviour
3. Run the test — confirm it fails
4. Verify the failure reason is correct:
   - `AssertionError` or `NameError` (function missing) — correct, proceed
   - `SyntaxError` — fix the test first
   - Test passes — the test is wrong or the behaviour already exists

**Step 2 — GREEN: Make It Pass**

1. Write the **minimum** code to make the test pass
2. No extra features, no elegant solution — just make it green
3. Run ALL tests — confirm nothing else broke

**Step 3 — REFACTOR: Clean Up**

1. With all tests green, improve structure:
   - Extract duplication
   - Rename for clarity
   - Simplify conditionals
2. Run tests after EVERY refactoring move
3. No new behaviour during refactoring

**Step 4 — Report**

After each cycle, output:

```
TDD CYCLE COMPLETE
==================
Test:     {test name}
Status:   RED -> GREEN -> REFACTOR
Tests:    {passed}/{total} passing
Coverage: {area covered}
Next:     {suggested next test, if applicable}
```

If the scope requires multiple TDD cycles, repeat Steps 1-4 for each behaviour. Keep cycles small — each should take 2-10 minutes, not 30.

**Decision tree (from the `tdd-workflow` skill):**
- New feature with known requirements → TDD
- Bug fix → write a test that reproduces the bug first
- Complex business logic → TDD (tests become executable docs)
- Exploratory / prototyping → test-after is acceptable
- Glue code / simple wiring → integration test or test-after
