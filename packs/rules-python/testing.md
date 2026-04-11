---
rule: python-testing
scope: python
profile: all
tags: [python, testing, pytest]
---

# Python Testing Standards

## Test Runner

Use `pytest` with `pytest-cov`. Run with:

```bash
uv run pytest                       # all tests
uv run pytest tests/unit/           # unit only
uv run pytest -x                    # stop on first failure
uv run pytest -k "test_order"       # filter by name
uv run pytest --cov=src             # with coverage
```

## Naming

```python
# Pattern: test_{method}_{scenario}_{expected_outcome}
def test_create_order_with_empty_items_raises_validation_error(): ...
def test_calculate_margin_with_zero_cost_returns_error(): ...
def test_sync_inventory_when_rate_limited_retries_three_times(): ...
```

## Structure

Group related tests in classes. One test file per source module.

```python
import pytest
from decimal import Decimal

class TestPriceCalculator:
    """Tests for PriceCalculator"""

    def test_calculate_margin_happy_path(self) -> None:
        calc = PriceCalculator()
        result = calc.calculate_margin(
            cost=Decimal("10.00"),
            target_margin=Decimal("0.30"),
        )
        assert result == Decimal("14.29")

    def test_calculate_margin_zero_cost_raises(self) -> None:
        calc = PriceCalculator()
        with pytest.raises(ValueError, match="Cost must be positive"):
            calc.calculate_margin(
                cost=Decimal("0"),
                target_margin=Decimal("0.30"),
            )
```

## Fixtures

```python
@pytest.fixture
def sample_order() -> Order:
    return Order(
        id="ORD-001",
        channel="amazon",
        items=[OrderItem(sku="SKU-1", quantity=2)],
    )

@pytest.fixture
def mock_repository(mocker) -> OrderRepository:
    repo = mocker.Mock(spec=OrderRepository)
    repo.get.return_value = None
    return repo
```

## Testing Depth by Profile

| Profile | Expectation |
|---------|-------------|
| `minimal` | Tests optional but encouraged for non-trivial logic |
| `standard` | Tests expected for business logic and use cases |
| `full` | Domain: 100% coverage. Use cases: mocked port tests. Adapters: integration tests |

## Testing by Layer (standard+ profiles)

| Layer | Strategy | Mocks |
|-------|----------|-------|
| Domain | Pure unit tests | None needed — pure logic |
| Use Cases | Unit tests | Mock ports (repositories, clients) |
| Adapters | Integration tests | Real/sandbox external systems |
| E2E | Critical paths only | Full stack |

## Assertions

- Use plain `assert` — pytest's introspection gives good error messages
- Use `pytest.raises` for expected exceptions, with `match=` for message validation
- Use `pytest.approx` for floating point comparisons
- Avoid `assertEqual`, `assertTrue` — those are unittest patterns

## See Also

- `skills/python-testing.md` — deep dive on fixtures, parametrize, mocking, and test organization
- `rules/python/tooling.md` — pytest configuration and running tests with uv
