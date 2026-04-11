---
rule: python-class-structure
scope: python
profile: all
tags: [python, classes, naming, architecture]
---

# Python Class Structure

## Naming Conventions

Class names communicate their architectural role. Use these suffixes consistently:

| Suffix | Layer | Purpose | Example |
|--------|-------|---------|---------|
| (none) | Domain | Entity or value object | `Order`, `Money`, `Product` |
| `Service` | Application | Orchestrates a business operation | `OrderSyncService`, `PricingService` |
| `Repository` | Domain (port) | Data access interface | `OrderRepository`, `ProductRepository` |
| `Client` | Infrastructure | External API adapter | `AmazonClient`, `ShopifyClient` |
| `Handler` | Interface | Handles a single request/event | `CreateOrderHandler`, `WebhookHandler` |
| `Settings` | Configuration | Typed config from env vars | `DatabaseSettings`, `AmazonSettings` |
| `Error` / `Exception` | Any | Custom error types | `OrderNotFoundError`, `RateLimitError` |

Avoid generic suffixes like `Manager`, `Helper`, `Utils` — they indicate a class doing too much.

## File-to-Class Naming

One primary class per file. The filename is the snake_case version of the class.

```
order.py           → class Order
order_repository.py → class OrderRepository (Protocol)
amazon_client.py    → class AmazonClient
pricing_service.py  → class PricingService
```

Multiple small related classes in one file are acceptable (e.g., `Money` and `Currency` in `money.py`), but a file should not exceed 300 lines (see `rules/common/file-size-caps.md`).

## Dataclass Patterns

### Frozen for Value Objects

Value objects are immutable — use `frozen=True`. This makes them hashable and prevents accidental mutation.

```python
from dataclasses import dataclass
from decimal import Decimal

@dataclass(frozen=True)
class Money:
    amount: Decimal
    currency: str

@dataclass(frozen=True)
class Address:
    line1: str
    city: str
    postcode: str
    country: str = "GB"
```

### Mutable for Entities

Entities have identity and change over time. Use plain `@dataclass` (mutable).

```python
@dataclass
class Order:
    id: str
    channel: str
    status: str
    items: list["OrderItem"]

    def mark_shipped(self, tracking_number: str) -> None:
        self.status = "shipped"
        self.tracking_number = tracking_number
```

### Slots for Performance

Use `slots=True` on dataclasses that will be instantiated frequently (e.g., in batch processing). This reduces memory usage and speeds up attribute access.

```python
@dataclass(frozen=True, slots=True)
class InventoryLevel:
    sku: str
    quantity: int
    warehouse: str
```

When to use `slots=True`:
- Batch-processed objects (thousands of instances)
- Objects in tight loops
- Value objects with no need for `__dict__`

When to skip `slots`:
- Classes that use `__dict__` features (dynamic attributes)
- Classes with complex inheritance hierarchies
- When it complicates the code for no measurable benefit

## Protocol Classes

Ports in the domain layer are `Protocol` classes, not abstract base classes.

```python
from typing import Protocol

class OrderRepository(Protocol):
    def get(self, order_id: str) -> Order | None: ...
    def save(self, order: Order) -> None: ...
    def list_by_channel(self, channel: str) -> list[Order]: ...
```

Why `Protocol` over `ABC`:
- Structural subtyping — implementations don't need to inherit
- Better for dependency injection and testing
- Cleaner separation between domain and infrastructure

## Service Classes

Services have a single responsibility and receive dependencies via `__init__`.

```python
class OrderSyncService:
    def __init__(
        self,
        repository: OrderRepository,
        client: AmazonClient,
        logger: logging.Logger,
    ) -> None:
        self._repository = repository
        self._client = client
        self._logger = logger

    def execute(self, channel: str) -> SyncResult:
        """Single public method that performs the operation."""
        ...
```

Conventions:
- Store injected dependencies as private attributes (`self._repo`, not `self.repo`)
- One primary public method (`execute`, `run`, `handle`) — additional methods are private helpers
- No class-level state — services are stateless orchestrators

## See Also

- `rules/python/pydantic.md` — two-model system (dataclass vs BaseModel)
- `rules/python/type-hints.md` — Protocol and typing patterns
- `skills/connector-dev.md` — connector class naming (Brain/Plumbing/Translator/Settings)
