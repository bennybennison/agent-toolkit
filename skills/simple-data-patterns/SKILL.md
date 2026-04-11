---
name: "simple-data-patterns"
description: "Direct Pydantic models mapped to storage with standard CRUD operations. No raw layer, no medallion architecture — just clean models and straightforward persistence."
pack: "skills-python"
---

# Skill: Simple Data Patterns

Direct Pydantic models mapped to storage with standard CRUD operations. No raw layer, no medallion architecture — just clean models and straightforward persistence.

## When to Use

- Data is **re-pullable** (your own channels, public APIs)
- You only need a **subset** of the API response
- **Caching** data for performance, not archival
- Internal application state (user preferences, settings, queues)
- Prototyping — start simple, upgrade to `data/raw-store` if needed

If data is critical and hard to re-fetch, use `data/raw-store` instead.

## Model Structure

Use Pydantic `BaseModel` for API boundaries and `@dataclass` for domain entities:

### Domain Entity (dataclass)

```python
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Product:
    """Domain entity — pure data, no framework dependencies."""

    id: int
    sku: str
    title: str
    price: float
    currency: str = "CHF"
    active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None
```

### API Schema (Pydantic)

```python
from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    """Request schema for creating a product."""

    sku: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=255)
    price: float = Field(..., gt=0)
    currency: str = Field(default="CHF", max_length=3)


class ProductResponse(BaseModel):
    """Response schema for product data."""

    id: int
    sku: str
    title: str
    price: float
    currency: str
    active: bool
    created_at: datetime | None

    model_config = {"from_attributes": True}
```

## Repository Pattern

Repositories handle persistence. The domain layer defines the port (Protocol), infrastructure implements it:

### Port (Domain)

```python
from typing import Protocol


class ProductRepository(Protocol):
    """Port for product persistence."""

    async def get_by_id(self, product_id: int) -> Product | None: ...
    async def get_by_sku(self, sku: str) -> Product | None: ...
    async def list_active(self, limit: int = 100, offset: int = 0) -> list[Product]: ...
    async def create(self, product: Product) -> Product: ...
    async def update(self, product: Product) -> Product: ...
    async def delete(self, product_id: int) -> bool: ...
```

### Adapter (Infrastructure)

```python
class SqlProductRepository:
    """SQL implementation of ProductRepository."""

    def __init__(self, connection: Any) -> None:
        self._conn = connection

    async def get_by_id(self, product_id: int) -> Product | None:
        row = await self._conn.fetchone(
            "SELECT * FROM products WHERE id = ?", (product_id,)
        )
        return Product(**row) if row else None

    async def create(self, product: Product) -> Product:
        result = await self._conn.execute(
            "INSERT INTO products (sku, title, price, currency) VALUES (?, ?, ?, ?)",
            (product.sku, product.title, product.price, product.currency),
        )
        product.id = result.lastrowid
        return product
```

## CRUD Conventions

| Operation | Method Name | Returns | Raises |
|-----------|-------------|---------|--------|
| Create | `create(entity)` | Created entity with ID | `DuplicateError` if exists |
| Read one | `get_by_id(id)` | Entity or `None` | Never raises |
| Read many | `list_*(filters)` | `list[Entity]` (empty if none) | Never raises |
| Update | `update(entity)` | Updated entity | `NotFoundError` if missing |
| Delete | `delete(id)` | `bool` (True if deleted) | Never raises |

### Naming Conventions

- `get_by_{field}` — single lookup by unique field
- `list_{filter}` — filtered list (e.g., `list_active`, `list_by_category`)
- `find_{criteria}` — search with complex criteria (returns list)
- `count_{filter}` — count matching records
- `exists_by_{field}` — boolean existence check

## SQL Migration Template

```sql
CREATE TABLE {entity_plural} (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    -- domain fields here --
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- indexes for common access patterns --
    INDEX idx_{entity}_created (created_at)
);
```

## Sync Patterns

When syncing from external APIs:

```python
async def sync_products(
    api_client: ExternalApiClient,
    repo: ProductRepository,
) -> SyncResult:
    """Pull products from external API and upsert locally."""
    remote_products = await api_client.list_products()
    created, updated, skipped = 0, 0, 0

    for remote in remote_products:
        local = await repo.get_by_sku(remote.sku)
        if local is None:
            await repo.create(Product(sku=remote.sku, title=remote.title, price=remote.price))
            created += 1
        elif _has_changes(local, remote):
            local.title = remote.title
            local.price = remote.price
            await repo.update(local)
            updated += 1
        else:
            skipped += 1

    return SyncResult(created=created, updated=updated, skipped=skipped)
```

Key: use `get_by_sku` (or whatever the external ID field is) for upsert logic, not your internal ID.

## Anti-Patterns

- **Storing raw API responses "just in case."** That's `data/raw-store`. If you're using `data/simple`, commit to parsing upfront.
- **Mixing Pydantic models and dataclasses for the same entity.** Dataclass for domain, Pydantic for API boundary. Never both in the domain layer.
- **Fat repositories with business logic.** Repositories do CRUD only. Business rules belong in use cases.
- **Returning database rows directly from API endpoints.** Always map through a response schema.
- **Implicit ordering.** Always specify `ORDER BY` — don't rely on database default ordering.
