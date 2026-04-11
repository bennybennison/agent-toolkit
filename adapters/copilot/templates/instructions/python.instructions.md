---
applyTo: "**/*.py"
description: "Python coding standards — tooling, type hints, testing patterns, class structure. Use when writing or reviewing Python code."
---

# Python Standards

## Tooling

- **Package manager:** `uv` only. Never pip or poetry.
- **Linting & formatting:** `ruff` only. No black, isort, or flake8.
- **Type checking:** `mypy` in strict mode
- **Testing:** `pytest` with `pytest-cov`
- **Settings:** `pydantic-settings` with `BaseSettings`
- **HTTP:** `httpx` (async-first)

```bash
uv sync                    # install deps
uv add httpx               # add dep
uv add --dev pytest        # add dev dep
uv run pytest              # run tests
ruff check --fix .         # lint + autofix
ruff format .              # format
```

## Type Hints

Every function must have complete type annotations — all parameters and return type.

```python
# Modern syntax (3.10+)
def get_user(user_id: str) -> User | None: ...

# NOT Optional[User]
# Use Literal for constrained strings
def set_status(status: Literal["active", "paused", "deleted"]) -> None: ...

# Protocol for dependency injection (ports)
class OrderRepository(Protocol):
    def get(self, order_id: str) -> Order | None: ...
    def save(self, order: Order) -> None: ...
```

## Testing

```bash
uv run pytest                       # all tests
uv run pytest tests/unit/           # unit only
uv run pytest -x                    # stop on first failure
uv run pytest -k "test_order"       # filter by name
```

Naming: `test_{method}_{scenario}_{expected_outcome}`

```python
def test_create_order_with_empty_items_raises_validation_error(): ...
def test_sync_inventory_when_rate_limited_retries_three_times(): ...
```

Group related tests in classes. One test file per source module.

Use `pytest.fixture` for shared setup. Use `pytest.mark.parametrize` for data-driven tests.

## Class Structure

```python
class OrderService:
    """One-line purpose."""

    # 1. __init__
    def __init__(self, repo: OrderRepository, notifier: Notifier) -> None:
        self._repo = repo
        self._notifier = notifier

    # 2. Public methods (the API)
    def create_order(self, items: list[OrderItem]) -> Order: ...
    def cancel_order(self, order_id: str) -> None: ...

    # 3. Private methods
    def _validate_items(self, items: list[OrderItem]) -> None: ...
```

## Pydantic

```python
from pydantic import BaseModel, Field

class CreateOrderRequest(BaseModel):
    """Validate at API boundary."""
    items: list[OrderItem] = Field(min_length=1)
    customer_id: str
    notes: str | None = None
```

## Imports

- stdlib → third-party → local, separated by blank lines
- Absolute imports only (no relative imports except in `__init__.py`)
- `ruff` handles import sorting — don't manually reorder
