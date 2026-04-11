---
name: "tdd-workflow"
description: "Test-driven development for application code. This skill covers methodology -- for Python-specific tooling, see [python-testing](../python-testing/SKILL.md). For testing agent behaviour, see [eval-driven-development](../eval-driven-development/SKILL.md)."
pack: "skills-autonomous"
---

# Skill: TDD Workflow

Test-driven development for application code. This skill covers methodology -- for Python-specific tooling, see [python-testing](../python-testing/SKILL.md). For testing agent behaviour, see [eval-driven-development](../eval-driven-development/SKILL.md).

---

## The Core Cycle

Every change follows three steps. The discipline is in not skipping any of them.

### 1. RED: Write a Failing Test

Write a test that describes the behaviour you want. Run it. It must fail.

**Why the test must actually fail:** If a new test passes immediately, either the behaviour already exists (no code needed) or the test is wrong (it does not test what you think). A test that never fails never proves anything.

Check that the failure reason is correct:
- `AssertionError` or `NameError` because the function does not exist yet -- good
- `SyntaxError` -- fix the test first
- Test passes -- your test is not testing the right thing

### 2. GREEN: Make It Pass

Write the **minimum** code to make the test pass. Not the elegant code. Not the general solution. The minimum.

**Why minimum:** Writing more than necessary means writing untested code. Every line of production code should exist because a test demanded it. This prevents speculative features and keeps the codebase lean.

### 3. REFACTOR: Clean Up

With all tests green, improve the code's structure:
- Extract duplication
- Rename for clarity
- Simplify conditionals
- Reorganize modules

**The rule:** No new behaviour during refactoring. If you want new behaviour, start a new RED step. Run tests after every refactoring move to catch regressions immediately.

---

## Decision Tree: TDD vs Test-After

```
Is this...
  +-- A new feature with known requirements?
  |     -> TDD. Write tests from the requirements.
  |
  +-- A bug fix?
  |     -> TDD. Write a test that reproduces the bug first.
  |     This test becomes your regression guard.
  |
  +-- Complex business logic?
  |     -> TDD. The tests become executable documentation.
  |
  +-- Exploratory / prototyping?
  |     -> Test-after is acceptable. But once direction is clear,
  |        write tests before extending further.
  |
  +-- Glue code / simple wiring?
        -> Test-after or integration test. Don't force unit tests
           on code that just connects components.
```

---

## Cycle Size

Keep cycles small. A cycle should take 2-10 minutes, not 30.

| Too Big | Right Size |
|---------|-----------|
| "Test the entire user registration flow" | "Test that email validation rejects missing @" |
| "Test the API endpoint" | "Test that the use case returns an error for duplicate usernames" |
| "Test the export feature" | "Test that CSV rows contain the header line" |

Small cycles give fast feedback. If you are stuck for more than 10 minutes making a test pass, the step is too large -- break it down.

---

## Coverage Strategy

Not all code layers deserve the same testing intensity. Focus effort where bugs are most costly.

| Layer | Target | Test Type | Rationale |
|-------|--------|-----------|-----------|
| Domain logic | ~100% | Unit tests, no mocks | This is your core value. Bugs here are business-logic bugs. |
| Use cases / application | ~90% | Unit tests, mocked ports | Orchestration logic. Test the flow, mock the I/O. |
| Infrastructure adapters | Key paths | Integration tests | Test against real DB/API where practical. |
| UI components | Behaviour | Interaction tests | Test what the user sees and does, not internal state. |
| Configuration / wiring | Smoke test | Integration / E2E | Verify components connect. Don't unit-test config. |

---

## Test Organization

```
src/
  domain/
    user.py
  application/
    create_user.py
tests/
  domain/
    test_user.py
  application/
    test_create_user.py
```

- Mirror the source tree in `tests/`
- One test file per source file
- Group related tests in classes when a source module has multiple public functions
- Naming: `test_{method}_{scenario}_{expected_outcome}`

Examples:
```python
def test_validate_email_missing_at_symbol_raises_validation_error(): ...
def test_create_user_duplicate_email_returns_conflict_error(): ...
def test_export_csv_empty_dataset_returns_header_only(): ...
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Skipping RED | You don't know if the test can fail | Always run the test before writing production code |
| Testing implementation details | Tests break on refactoring even though behaviour is unchanged | Test inputs and outputs, not internal method calls |
| Mocking everything | Tests pass but the system is broken | Mock at boundaries (I/O), not within the domain |
| Writing tests that always pass | `assert True`, tautological assertions | Every assertion must be falsifiable |
| Large batch: write 10 tests, then 200 lines of code | Defeats the purpose of fast feedback | One test at a time, keep cycles small |
| Testing getters/setters | No logic to verify | Test behaviour that involves decisions or transformations |
| Testing private methods directly | Couples tests to implementation | Test through the public interface |

---

## Workflow Summary

```
1. Pick the next behaviour to implement
2. Write ONE test (RED)
3. Run it -- confirm it fails for the right reason
4. Write minimum code (GREEN)
5. Run all tests -- confirm everything passes
6. Refactor if needed -- tests stay green
7. Commit
8. Go to 1
```

---

**See also:**
- [python-testing](../python-testing/SKILL.md) -- pytest-specific tooling and patterns
- [eval-driven-development](../eval-driven-development/SKILL.md) -- TDD for agent behaviour
- [verification-loop](../verification-loop/SKILL.md) -- pre-commit verification checklist
