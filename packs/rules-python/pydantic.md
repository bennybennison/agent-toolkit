---
rule: python-pydantic
scope: python
profile: all
tags: [python, pydantic, validation, domain]
---

# Pydantic & Domain Model Rules

## Two-Model System

The codebase uses **two types of models** for different purposes:

| Model Type | Where | When |
|------------|-------|------|
| `@dataclass` | Domain layer | Entities, value objects, pure business logic |
| `BaseModel` | API boundaries | DTOs, request/response schemas, external data |

### Domain Layer — `@dataclass`

Domain entities must have zero framework dependencies. Plain Python only.

```python
from dataclasses import dataclass
from decimal import Decimal

@dataclass(frozen=True)
class Money:
    amount: Decimal
    currency: str

    def __add__(self, other: "Money") -> "Money":
        if self.currency != other.currency:
            raise ValueError("Cannot add different currencies")
        return Money(amount=self.amount + other.amount, currency=self.currency)

@dataclass
class Order:
    id: str
    channel: str
    items: list["OrderItem"]
    total: Money
```

### API Boundaries — `BaseModel`

Pydantic models validate and serialise data crossing system boundaries.

```python
from pydantic import BaseModel, Field, ConfigDict

class OrderResponse(BaseModel):
    model_config = ConfigDict(
        frozen=True,
        str_strip_whitespace=True,
    )

    id: str
    channel: str
    total_amount: Decimal = Field(ge=0, decimal_places=2)
    currency: str = Field(min_length=3, max_length=3)
```

## Configuration — `BaseSettings`

All configuration uses `pydantic-settings`, not `python-dotenv`.

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class DatabaseSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="DB_",
        env_file=".env",
        env_file_encoding="utf-8",
    )

    host: str = "localhost"
    port: int = 3306
    name: str
    user: str
    password: str
```

## Validation Patterns

```python
from pydantic import field_validator, model_validator

class CreateOrderRequest(BaseModel):
    channel: str
    items: list[OrderItemRequest]

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, v: str) -> str:
        valid = {"amazon", "ebay", "shopify"}
        if v not in valid:
            raise ValueError(f"Invalid channel: {v}")
        return v

    @model_validator(mode="after")
    def validate_has_items(self) -> "CreateOrderRequest":
        if not self.items:
            raise ValueError("Order must have at least one item")
        return self
```

## Serialization

```python
# To dict
data = model.model_dump(mode="json")

# To JSON string
json_str = model.model_dump_json(indent=2)

# From dict
model = MyModel.model_validate(data)

# From JSON
model = MyModel.model_validate_json(json_string)
```

## Prohibited

- Pydantic `BaseModel` in the domain layer — use `@dataclass`
- `python-dotenv` / `load_dotenv()` — use `BaseSettings` + `dotenvx`
- `os.environ["KEY"]` / `os.getenv()` directly — wrap in a settings class
- Pydantic V1 syntax (`class Config:`, `.dict()`, `.json()`)

## See Also

- `rules/python/class-structure.md` — dataclass patterns (frozen, slots), naming conventions
- `skills/environment-management.md` — dotenvx + BaseSettings workflow
- `rules/common/security.md` — secrets management and encrypted env patterns
