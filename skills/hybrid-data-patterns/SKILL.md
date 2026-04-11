---
name: "hybrid-data-patterns"
description: "Combines `data/raw-store` and `data/simple` approaches in one project. Critical data gets raw storage; disposable data uses direct models."
pack: "skills-python"
---

# Skill: Hybrid Data Patterns

Combines `data/raw-store` and `data/simple` approaches in one project. Critical data gets raw storage; disposable data uses direct models.

## When to Use

- Project has **mixed data criticality** — some sources are irreplaceable, others are re-pullable
- Migrating from `data/simple` to `data/raw-store` for specific sources
- eCommerce hub pattern — customer orders are critical, your own channel listings are disposable

## Decision Tree

For each data source, answer these questions:

```
Can you re-fetch this data at any time?
├── YES → data/simple (direct models, no raw layer)
│   Examples: Your own eBay listings, public API data, cache data
│
└── NO or UNCERTAIN
    ├── Is this customer-provided data?
    │   └── YES → data/raw-store (raw JSON + core tables)
    │       Examples: Customer orders, customer catalogs, FTP uploads
    │
    ├── Does the source have aggressive rate limits?
    │   └── YES → data/raw-store (might not be able to re-pull)
    │       Examples: Amazon SP-API, heavily throttled APIs
    │
    ├── Is there an audit/compliance requirement?
    │   └── YES → data/raw-store (need proof of original data)
    │       Examples: Financial records, regulatory data
    │
    └── Is the API schema unstable/undocumented?
        └── YES → data/raw-store (raw JSON survives schema changes)
            Examples: Scraping, undocumented partner APIs
```

## Project Structure

```
src/{project}/
├── domain/
│   ├── entities/
│   │   ├── order.py           # Domain entity (used by both raw and simple paths)
│   │   ├── product.py
│   │   └── listing.py
│   └── ports/
│       ├── order_repo.py      # Repository port
│       └── listing_repo.py
│
├── infrastructure/
│   ├── raw/                   # Raw store layer (critical sources only)
│   │   ├── raw_repo.py        # Generic raw storage repository
│   │   ├── extractors/        # Parse raw JSON → core entities
│   │   │   ├── order_extractor.py
│   │   │   └── product_extractor.py
│   │   └── migrations/
│   │       └── 001_raw_tables.sql
│   │
│   ├── repos/                 # Simple CRUD repositories (all sources)
│   │   ├── order_repo.py      # Reads from core tables (extracted from raw)
│   │   └── listing_repo.py    # Reads from simple tables (no raw layer)
│   │
│   └── migrations/
│       ├── 002_core_tables.sql  # Tables derived from raw
│       └── 003_simple_tables.sql
```

## Source Registry

Document each data source's storage strategy explicitly:

```python
from dataclasses import dataclass
from enum import Enum


class StorageStrategy(Enum):
    RAW = "raw"      # Full raw JSON storage → core extraction
    SIMPLE = "simple"  # Direct model, no raw layer


@dataclass
class DataSourceConfig:
    """Declares how a data source's data should be stored."""

    name: str
    strategy: StorageStrategy
    rationale: str
    retention_days: int | None = None  # Only for RAW strategy


# Document in project config or AGENTS.md
SOURCE_REGISTRY: list[DataSourceConfig] = [
    DataSourceConfig(
        name="customer_orders",
        strategy=StorageStrategy.RAW,
        rationale="Customer-provided data, cannot re-fetch",
        retention_days=90,
    ),
    DataSourceConfig(
        name="shopify_orders",
        strategy=StorageStrategy.RAW,
        rationale="Rate-limited API, audit trail needed",
        retention_days=180,
    ),
    DataSourceConfig(
        name="own_ebay_listings",
        strategy=StorageStrategy.SIMPLE,
        rationale="Our own listings, re-pullable anytime",
    ),
    DataSourceConfig(
        name="exchange_rates",
        strategy=StorageStrategy.SIMPLE,
        rationale="Public API, cached for performance only",
    ),
]
```

## Ingestion Pattern

Route incoming data through the correct pipeline based on source config:

```python
async def ingest_data(
    source: str,
    payload: dict,
    raw_repo: RawRepository,
    simple_repo: SimpleRepository,
    registry: list[DataSourceConfig],
) -> None:
    """Route data to raw or simple storage based on source config."""
    config = next((s for s in registry if s.name == source), None)
    if config is None:
        raise ValueError(f"Unknown source: {source}. Register it in SOURCE_REGISTRY.")

    if config.strategy == StorageStrategy.RAW:
        await raw_repo.store_raw(
            source=source,
            entity_type=payload.get("type", "unknown"),
            source_id=payload["id"],
            payload=payload,
        )
    else:
        entity = parse_to_entity(source, payload)
        await simple_repo.upsert(entity)
```

## Migration Path: Simple → Raw

When a `data/simple` source needs upgrading to `data/raw-store`:

1. **Create the raw table** for the source
2. **Start dual-writing** — store raw JSON AND update existing simple table
3. **Backfill** raw table from API (if possible) or mark old records as `processed_at = migration_date`
4. **Update the source registry** — change strategy from SIMPLE to RAW
5. **Update repository** — read from core tables (derived from raw) instead of simple table
6. **Drop the simple table** once core tables are proven correct

Never do this migration in reverse. If data was worth raw storage, it stays raw.

## AGENTS.md Documentation

Every hybrid project should document the source registry in its AGENTS.md:

```markdown
## Data Sources

| Source | Strategy | Rationale |
|--------|----------|-----------|
| customer_orders | RAW | Customer-provided, cannot re-fetch |
| shopify_orders | RAW | Rate-limited, audit trail needed |
| own_ebay_listings | SIMPLE | Our listings, re-pullable |
| exchange_rates | SIMPLE | Public API cache |
```

## Anti-Patterns

- **Defaulting to raw "just in case."** Raw storage has overhead (extraction, retention, cleanup). Use it only when justified by the decision tree.
- **Mixing strategies for the same source.** One source = one strategy. Don't store some orders as raw and others as simple.
- **Undocumented strategy choices.** Every source must appear in the source registry with a rationale.
- **Skipping the migration path.** When upgrading simple → raw, always dual-write first. Never drop the simple table before the raw+core path is proven.
- **Different domain entities per strategy.** The domain entity (`Order`, `Product`) should be the same regardless of whether it came from raw extraction or simple persistence.
