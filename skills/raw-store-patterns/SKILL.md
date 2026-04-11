---
name: "raw-store-patterns"
description: "Medallion architecture for data you cannot easily re-fetch. Stores raw API responses as JSON, extracts structured \"core\" tables when access patterns emerge."
pack: "skills-python"
---

# Skill: Raw Store Patterns

Medallion architecture for data you cannot easily re-fetch. Stores raw API responses as JSON, extracts structured "core" tables when access patterns emerge.

## When to Use

- Ingesting data from **customer systems** (you may only get one pull)
- Third-party APIs with **rate limits** or **pagination tokens** that expire
- Audit trail requirements (need to prove what the source said)
- Data whose schema changes frequently (parse-on-demand handles evolution)

If the data is re-pullable from your own channels, use `data/simple` instead.

## Raw Table Schema

Every raw store needs exactly one table per source entity type:

```python
from dataclasses import dataclass
from datetime import datetime


@dataclass
class RawRecord:
    """Base schema for raw storage. All raw tables follow this pattern."""

    id: int                    # Auto-increment PK
    source: str                # e.g., "shopify", "amazon-sp-api"
    entity_type: str           # e.g., "order", "product", "customer"
    source_id: str             # The ID from the source system
    payload: str               # Raw JSON response body
    fetched_at: datetime       # When we pulled this data
    processed_at: datetime | None = None  # When we parsed it into core tables
```

### SQL Migration Template

```sql
CREATE TABLE raw_{source}_{entity} (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    source        VARCHAR(50)  NOT NULL DEFAULT '{source}',
    entity_type   VARCHAR(50)  NOT NULL DEFAULT '{entity}',
    source_id     VARCHAR(255) NOT NULL,
    payload       JSON         NOT NULL,
    fetched_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at  DATETIME     NULL,

    INDEX idx_source_id (source_id),
    INDEX idx_fetched_at (fetched_at),
    INDEX idx_processed (processed_at)
);
```

## Parse-on-Demand Pattern

Never parse raw JSON at ingestion time. Extract data when you need it:

```python
import json
from typing import Any


def extract_from_raw(raw_record: RawRecord, path: str) -> Any:
    """Extract a value from raw JSON payload using dot-notation path.

    Example: extract_from_raw(record, "order.line_items.0.sku")
    """
    data = json.loads(raw_record.payload)
    for key in path.split("."):
        if isinstance(data, list):
            data = data[int(key)]
        elif isinstance(data, dict):
            data = data[key]
        else:
            raise KeyError(f"Cannot traverse {type(data)} at '{key}'")
    return data
```

### When to Create Core Tables

Create a dedicated "core" table when:

1. You query the same JSON path in **3+ places**
2. You need to **JOIN** raw data with other tables
3. You need **indexes** on extracted fields
4. A reporting dashboard needs fast reads

Core tables are always derived from raw — raw is the source of truth.

```python
@dataclass
class CoreOrder:
    """Extracted/structured order data. Derived from raw_shopify_orders."""

    id: int
    raw_id: int                # FK back to raw table
    order_number: str
    customer_email: str
    total_amount: float
    currency: str
    ordered_at: datetime
    extracted_at: datetime     # When this core record was created
```

## Retention Policies

| Tier | Retention | Rationale |
|------|-----------|-----------|
| Raw | 90 days (default) | Storage cost; re-fetch if needed |
| Core | Permanent | Business data, already extracted |
| Archive | Indefinite (cold storage) | Compliance/audit |

Retention is configurable per source. Override in project settings:

```python
from pydantic_settings import BaseSettings


class RawStoreSettings(BaseSettings):
    raw_retention_days: int = 90
    archive_enabled: bool = False
    archive_storage: str = "s3"  # or "local", "gcs"
```

### Cleanup Job

```python
from datetime import datetime, timedelta


async def cleanup_expired_raw(
    repo: RawRepository,
    retention_days: int = 90,
) -> int:
    """Delete raw records older than retention period that have been processed."""
    cutoff = datetime.utcnow() - timedelta(days=retention_days)
    deleted = await repo.delete_processed_before(cutoff)
    return deleted
```

## Ingestion Workflow

```
1. Fetch from source API → raw JSON
2. Store in raw_{source}_{entity} table (payload = full response body)
3. Mark fetched_at = now()
4. Later: extract into core tables when access patterns emerge
5. Mark processed_at = now() on the raw record
6. Cleanup: delete processed raw records past retention window
```

## Anti-Patterns

- **Parsing at ingestion time.** Store the raw JSON first, parse later. If parsing fails, you still have the data.
- **Skipping source_id.** Always store the external system's ID — you need it for deduplication and lookups.
- **Storing raw data without timestamps.** `fetched_at` is critical for debugging stale data issues.
- **Deleting raw data before processing.** Only cleanup after `processed_at` is set.
- **Normalizing raw storage.** Raw tables are intentionally denormalized — one row per API response.
