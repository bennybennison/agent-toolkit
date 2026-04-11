---
rule: python-type-hints
scope: python
profile: all
tags: [python, typing, type-hints]
---

# Python Type Hints

## Core Rule

Every function must have complete type annotations — all parameters and return type. No exceptions.

## Syntax

Use modern syntax (Python 3.10+):

```python
# Preferred — union operator
def get_user(user_id: str) -> User | None: ...

# NOT this
from typing import Optional
def get_user(user_id: str) -> Optional[User]: ...
```

## Common Patterns

```python
from collections.abc import Iterator, Sequence
from typing import Any, Callable, Generic, Literal, Protocol, TypeVar

# Optional values
def find(key: str) -> Item | None: ...

# Literal for constrained strings
def set_status(status: Literal["active", "paused", "deleted"]) -> None: ...

# Callable
def apply(data: list[dict], fn: Callable[[dict], dict]) -> list[dict]: ...

# Generic
T = TypeVar("T")
def first_or_none(items: Sequence[T]) -> T | None:
    return items[0] if items else None

# Generators
def iter_batches(items: list[T], size: int) -> Iterator[list[T]]:
    for i in range(0, len(items), size):
        yield items[i:i + size]

# Properties
class Product:
    @property
    def total(self) -> Decimal: ...

# Class methods
class Order:
    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Order": ...

# Async
async def fetch_orders(channel: str) -> list[Order]: ...
```

## Advanced Patterns

### Self Type (Python 3.11+)

Use `Self` for methods that return the current class, instead of quoting the class name:

```python
from typing import Self

class Builder:
    def with_name(self, name: str) -> Self:
        self.name = name
        return self

    @classmethod
    def create(cls) -> Self:
        return cls()
```

### TypedDict

Use `TypedDict` for dictionaries with a known structure, especially for JSON-like data at boundaries:

```python
from typing import TypedDict, NotRequired

class OrderPayload(TypedDict):
    id: str
    channel: str
    total: float
    metadata: NotRequired[dict[str, str]]

def process_order(payload: OrderPayload) -> None: ...
```

### Protocol

Use `Protocol` for structural subtyping (duck typing with type safety). This is the standard way to define ports in the domain layer:

```python
from typing import Protocol

class Repository(Protocol):
    def get(self, id: str) -> Order | None: ...
    def save(self, order: Order) -> None: ...

# Any class with matching methods satisfies this — no inheritance needed
class SqlOrderRepository:
    def get(self, id: str) -> Order | None: ...
    def save(self, order: Order) -> None: ...
```

### TYPE_CHECKING Imports

Use `TYPE_CHECKING` to avoid circular imports and reduce runtime import overhead. Types imported inside `if TYPE_CHECKING:` blocks are only available to type checkers, not at runtime:

```python
from __future__ import annotations  # Required — makes all annotations strings
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.domain.entities import Order
    from src.infrastructure.clients import AmazonClient

class OrderService:
    def process(self, order: Order) -> None: ...
```

When to use `TYPE_CHECKING`:
- Circular import situations
- Heavy imports only needed for type annotations
- Cross-layer imports that would violate architecture at runtime

## Rules

1. **No `Any`** unless absolutely necessary — add a comment explaining why
2. **No `# type: ignore`** without an inline explanation of what's being suppressed
3. **No bare `dict`** — use `dict[str, Any]` or a TypedDict
4. **No bare `list`** — use `list[str]` or `list[Item]`
5. **Use `collections.abc`** for abstract types (`Sequence`, `Mapping`, `Iterator`) not `typing`
6. **Return type always explicit** — even for `-> None`

## Validation

Type checking is done with `mypy` (not pyright). Run with:

```bash
mypy .
# or for a specific package
mypy src/domain/
```

See `rules/python/tooling.md` for recommended mypy configuration.

## See Also

- `rules/python/class-structure.md` — Protocol classes, naming conventions, dataclass patterns
- `rules/python/imports.md` — `TYPE_CHECKING` import conventions
- `skills/python-testing.md` — typing patterns in test code
