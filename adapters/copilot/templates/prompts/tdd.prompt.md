---
description: "Test-driven development workflow — write failing test first, then implement, then refactor"
mode: "agent"
---

Follow strict TDD (Red → Green → Refactor) for the following change:

## Process

1. **Red** — Write a failing test that describes the desired behaviour
   - Name: `test_{method}_{scenario}_{expected_outcome}`
   - Run: confirm it fails for the right reason
2. **Green** — Write the minimum code to make the test pass
   - No extra features, no premature abstractions
   - Run: confirm test passes
3. **Refactor** — Clean up while keeping tests green
   - Extract duplication, improve naming, simplify
   - Run: confirm all tests still pass

## Rules

- One test at a time — never write multiple failing tests
- Test file mirrors source file (`order_service.py` → `test_order_service.py`)
- Use fixtures for shared setup, parametrize for data-driven tests
- Each cycle should take 2-5 minutes of work

After each Green phase, ask before continuing to the next test cycle.

${input:feature:What behaviour should I implement with TDD?}
