---
name: "database-patterns"
description: "Platform-agnostic patterns for database schema design, migrations, queries, and data access. These patterns apply regardless of which database engine or ORM you use -- the principles are the same."
pack: "skills-ops"
---

# Skill: Database Patterns

Platform-agnostic patterns for database schema design, migrations, queries, and data access. These patterns apply regardless of which database engine or ORM you use -- the principles are the same.

---

## Schema Design

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | snake_case, plural | `user_accounts`, `order_items` |
| Columns | snake_case | `created_at`, `email_address` |
| Foreign keys | `{referenced_table_singular}_id` | `user_id`, `order_id` |
| Indexes | `idx_{table}_{columns}` | `idx_users_email` |
| Unique constraints | `uq_{table}_{columns}` | `uq_users_email` |

Why consistent naming: When every developer can predict a column name without looking it up, queries get written faster and join conditions are obvious. Inconsistency causes bugs -- `userId` vs `user_id` vs `fk_user` in the same schema is a maintenance tax.

### Required Columns

Every table should include:

- `id` -- primary key (UUID or auto-increment, decide once for the project and be consistent)
- `created_at` -- timestamp, set on insert, never modified
- `updated_at` -- timestamp, updated on every write

Why timestamps on every table: You will eventually need to debug "when did this change?" or build an audit trail. Adding these retroactively requires a migration on every table.

### Indexes

- Every foreign key column gets an index (most ORMs do not create these automatically)
- Columns used in `WHERE` or `ORDER BY` clauses in frequent queries
- Composite indexes: put the most selective column first
- Do not over-index -- each index slows down writes. Add indexes for actual query patterns, not hypothetical ones.

### Soft Deletes vs Hard Deletes

| Approach | Use When | Trade-offs |
|----------|----------|------------|
| Soft delete (`deleted_at` timestamp) | Audit requirements, recoverability needed, foreign key dependencies | Every query must filter `WHERE deleted_at IS NULL`, increases storage |
| Hard delete (`DELETE` row) | No regulatory requirement to retain, data is truly ephemeral | Simpler queries, but data is gone forever |

Decision criteria: If a regulator, auditor, or user might ask "what happened to that record?" -- use soft deletes. Otherwise, prefer hard deletes for simplicity.

---

## Migration Patterns

1. **One migration per logical change** -- "add users table" and "add orders table" are two migrations, not one. This makes rollbacks granular.

2. **Migrations must be reversible** -- every `up()` needs a corresponding `down()`. If you cannot reverse a migration (e.g., dropping a column with data), document why in the migration file.

3. **Never mix data and schema changes** -- a migration either alters structure or transforms data, not both. Why: schema changes acquire locks; data migrations can be slow. Combining them holds locks for the duration of the data migration.

4. **Naming convention** -- descriptive and ordered: `001_create_users_table.py`, `002_add_email_to_users.py`. The prefix ensures execution order.

5. **Test against production-like data** -- a migration that works on an empty database may fail or lock a table with 10 million rows. Test against a copy of production data when possible.

6. **Run migrations separately from deployment** -- migrations are a distinct step, not something the application runs on startup. This prevents partial deployments where the app is running new code against the old schema.

---

## Query Patterns

### Parameterized Queries

Always use parameterized queries. Never construct SQL with string formatting.

```python
# Correct -- parameterized
cursor.execute("SELECT * FROM users WHERE email = %s", (email,))

# Wrong -- SQL injection vulnerability
cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")
```

Why: String formatting is the #1 cause of SQL injection. Parameterized queries separate code from data at the protocol level.

### SELECT Only What You Need

Avoid `SELECT *`. Specify columns explicitly. Why: `SELECT *` fetches data you do not use, breaks when columns are added, and prevents covering indexes from working.

### Pagination

| Strategy | Use When | Trade-offs |
|----------|----------|------------|
| Cursor-based | Large datasets, user-facing feeds, real-time data | Stable under concurrent inserts, but no "jump to page 5" |
| Offset-based | Admin UIs, reports, small static datasets | Simple, supports page numbers, but unstable under inserts |

Always enforce a maximum page size. An unbounded `LIMIT` is effectively `SELECT *` on the whole table.

### N+1 Query Detection

The N+1 problem: fetch a list of N items, then run one query per item for related data. This means N+1 total queries instead of 2.

Fix: use eager loading (`JOIN` or `IN` clause) to batch the related data fetch. Most ORMs provide this -- use it explicitly rather than relying on lazy loading defaults.

### Connection Pooling

- Configure a connection pool -- do not open/close connections per request
- Set pool size based on expected concurrency (typically 5-20 connections)
- Set connection timeouts to prevent pool exhaustion from slow queries

---

## Repository Pattern

One repository class per aggregate root. The repository translates between the domain and storage layers.

```
Repository methods:
  get_by_id(id) -> Entity | None
  list(filters, pagination) -> list[Entity]
  create(entity) -> Entity
  update(entity) -> Entity
  delete(id) -> None
```

Why the repository pattern: It keeps SQL and ORM details out of your business logic. The domain layer works with entities; the infrastructure layer handles persistence. This means you can change databases, ORMs, or query strategies without rewriting business logic.

Key rules:
- Return domain entities, not ORM model objects -- ORM objects leak infrastructure into the domain
- Keep all query logic inside the repository -- no raw queries in use cases
- Accept domain-level filter objects, not raw SQL fragments

---

## Transaction Management

Use the unit of work pattern for operations spanning multiple tables.

- Wrap multi-step operations in an explicit transaction boundary (context manager or decorator)
- Rollback on any exception -- partial commits leave the database in an inconsistent state
- Keep transactions short -- hold locks for the minimum duration necessary
- Avoid transactions that call external services (network calls inside a transaction hold locks during I/O)

---

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Business logic in SQL | Untestable, hard to debug, locked to one DB | Move logic to domain layer, use SQL for data access only |
| ORM models as domain entities | Couples domain to infrastructure, leaks DB concerns | Map ORM results to plain domain objects |
| Unbounded queries (no LIMIT) | Memory exhaustion, slow responses | Always paginate, always set LIMIT |
| Storing computed values | Data inconsistency when source data changes | Derive at query time or use materialized views with refresh |
| Database as job queue | Row locking contention, polling overhead, poor scaling | Use a proper message queue (Redis, RabbitMQ, etc.) |
| N+1 queries undetected | Slow pages, database overload | Eager loading, query logging in development |
| Migrations on app startup | Partial deployments, race conditions in multi-instance | Run migrations as a separate deployment step |

---

## See Also

- [api-design](../api-design/SKILL.md) -- API endpoints that consume these data access patterns
- [security-review](../security-review/SKILL.md) -- SQL injection checks and data protection review
