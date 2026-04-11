---
skill: python-testing
scope: python
profile: standard, full
tags: [testing, pytest, python, fixtures]
requires_bins: [python3, uv]
---

# Skill: Python Testing

Pytest-specific patterns and tooling for Python projects. This skill complements [tdd-workflow](tdd-workflow.md) (which covers methodology) with concrete implementation guidance.

---

## Project Structure

```
tests/
  conftest.py              # root-level fixtures (db sessions, clients)
  factories.py             # object creation helpers
  fixtures/                # complex test data (JSON, CSV samples)
    sample_export.csv
  domain/
    conftest.py            # domain-specific fixtures
    test_user.py
  application/
    conftest.py
    test_create_user.py
  infrastructure/
    conftest.py
    test_user_repository.py
```

Each `conftest.py` provides fixtures scoped to that directory and below. Keep fixtures close to where they are used -- root `conftest.py` is for truly shared fixtures only.

---

## Fixtures

### Factory Pattern

Avoid creating test objects inline. Use factories that provide sensible defaults but allow overrides.

```python
# tests/factories.py
from myapp.domain.user import User

def make_user(**overrides) -> User:
    defaults = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "active": True,
    }
    return User(**(defaults | overrides))
```

This keeps tests readable -- each test only specifies the fields relevant to the scenario under test.

### Fixture Scoping

| Scope | Lifetime | Use For |
|-------|----------|---------|
| `function` (default) | Each test | Most fixtures. Isolation is the priority. |
| `class` | All tests in a class | Shared setup when tests don't mutate the fixture |
| `module` | All tests in a file | Expensive setup shared across a file (e.g., parsed config) |
| `session` | Entire test run | Database connections, Docker containers |

**Rule of thumb:** Use `function` scope unless setup is genuinely expensive. Broader scopes risk test pollution -- one test's side effects leaking into another.

### Fixture Parametrization

```python
@pytest.fixture(params=["sqlite", "postgres"])
def db_engine(request):
    return create_engine(request.param)
```

Every test that uses `db_engine` runs twice, once per parameter. Useful for testing adapters against multiple backends.

---

## Mocking

### `monkeypatch` vs `unittest.mock.patch`

| Use | Tool | Why |
|-----|------|-----|
| Override an attribute or env var | `monkeypatch.setattr`, `monkeypatch.setenv` | Simpler API, auto-reverts after test |
| Replace a function/method call | `unittest.mock.patch` | Supports call assertions, `side_effect` |
| Assert call count or arguments | `unittest.mock.patch` | `mock.assert_called_once_with(...)` |
| Quick env var override | `monkeypatch.setenv("API_KEY", "test")` | One line, no context manager |

### Patch Placement

Patch where the name is **looked up**, not where it is **defined**.

```python
# WRONG: patches the original module
@patch("myapp.domain.email.send_email")

# RIGHT: patches where it's imported in the code under test
@patch("myapp.application.create_user.send_email")
```

This is because Python's import system creates a new reference. Patching the original does not affect the reference the consuming module already holds.

### When NOT to Mock

Domain logic should be tested without mocks. If your domain function needs a mock to be testable, the function has a dependency problem -- inject it through a port instead.

---

## Parametrize

```python
@pytest.mark.parametrize("email, valid", [
    pytest.param("user@example.com", True, id="valid-standard"),
    pytest.param("missing-at.com", False, id="missing-at-symbol"),
    pytest.param("", False, id="empty-string"),
])
def test_validate_email(email, valid):
    assert validate_email(email) == valid
```

Use `pytest.param(..., id="name")` so failure reports show which case failed instead of `[0]`, `[1]`, etc.

**Combining decorators** for cross-product: stack multiple `@pytest.mark.parametrize` decorators. `3 roles x 2 states = 6 test runs`.

---

## Markers

```python
@pytest.mark.slow
def test_full_export(): ...

@pytest.mark.integration
def test_database_roundtrip(): ...
```

Register in `pyproject.toml` to avoid warnings:

```toml
[tool.pytest.ini_options]
markers = [
    "slow: marks tests as slow (deselect with '-m \"not slow\"')",
    "integration: requires external services",
]
```

Selective runs: `uv run pytest -m "not slow"`, `uv run pytest -m "integration"`.

---

## Assertions

```python
# Exceptions -- always verify the message, not just the type
with pytest.raises(ValidationError, match="email.*required"):
    create_user(email="")

# Floating point
assert calculate_tax(100.0) == pytest.approx(7.25, rel=1e-2)
```

For domain objects with complex equality, write assertion helpers that produce clear failure messages instead of relying on `__eq__`.

---

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| `assert True` | Proves nothing | Assert a specific expected value |
| `pytest.raises(Exception)` | Catches unrelated errors | Use the specific exception type and `match` |
| Importing from test files | Creates fragile cross-test dependencies | Extract shared code to `conftest.py` or `factories.py` |
| Test order dependencies | Tests fail when run in isolation | Each test sets up its own state via fixtures |
| `time.sleep()` in tests | Slow and flaky | Use polling with timeout, or mock the clock |
| Assertions in fixtures | Failures report as fixture errors, not test failures | Assert in the test body, not in setup |

---

**See also:**
- [tdd-workflow](tdd-workflow.md) -- the RED/GREEN/REFACTOR methodology
- [eval-driven-development](eval-driven-development.md) -- testing agent behaviour (not application code)
