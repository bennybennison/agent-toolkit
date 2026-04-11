---
name: "api-design"
description: "Design consistent, predictable REST APIs. Good API design reduces integration friction and prevents an entire class of frontend/backend misunderstandings."
pack: "skills-ops"
---

# Skill: API Design

Design consistent, predictable REST APIs. Good API design reduces integration friction and prevents an entire class of frontend/backend misunderstandings.

---

## Design Principles

1. **Resources are nouns, actions are HTTP verbs** -- `/users`, not `/getUsers`
2. **Plural nouns** for collections -- `/users/{id}`, not `/user/{id}`
3. **Kebab-case** for multi-word resources -- `/user-profiles`, not `/userProfiles`
4. **Shallow nesting** -- max two levels deep

```
Good:  /users/{id}/orders
Bad:   /users/{id}/orders/{order_id}/items/{item_id}/reviews
Fix:   /order-items/{item_id}/reviews
```

Why shallow: Deep nesting creates brittle URLs, forces clients to track multiple IDs, and makes caching harder.

---

## HTTP Methods

| Method | Purpose | Idempotent | Request Body | Typical Response |
|--------|---------|------------|--------------|------------------|
| GET | Read resource(s) | Yes | No | 200 with body |
| POST | Create resource | No | Yes | 201 with resource + Location |
| PUT | Full replace | Yes | Yes | 200 with resource |
| PATCH | Partial update | No | Yes | 200 with resource |
| DELETE | Remove resource | Yes | No | 204 no body |

Why idempotency matters: Network retries happen. If a PUT is retried, the result should be the same. If a POST is retried, you might create duplicates -- so POST handlers should check for and handle duplicate submissions.

---

## Status Codes

Use the correct code. Returning 200 for everything forces clients to parse the body to detect errors.

| Code | Meaning | Use When |
|------|---------|----------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (include Location header) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Malformed syntax, missing required fields |
| 401 | Unauthorized | No valid authentication credentials |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate resource, version conflict |
| 422 | Unprocessable Entity | Valid syntax but invalid semantics (e.g., email format) |
| 429 | Too Many Requests | Rate limit exceeded (include Retry-After header) |
| 500 | Internal Server Error | Never return this intentionally -- it means a bug |

---

## Error Response Format

Every error response should follow the same structure. Consistency lets clients build a single error handler.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description of what went wrong",
    "details": [
      {"field": "email", "issue": "Invalid email format"},
      {"field": "age", "issue": "Must be a positive integer"}
    ]
  }
}
```

- `code`: Machine-readable, UPPER_SNAKE_CASE, stable across versions
- `message`: Human-readable, may change without being a breaking change
- `details`: Optional array for field-level validation errors

---

## Pagination

### Cursor-Based (Preferred)

Use for large or frequently changing datasets. Cursors are stable -- inserting new records does not cause items to shift between pages.

```json
{
  "data": [...],
  "meta": {
    "has_more": true,
    "next_cursor": "eyJpZCI6IDEwMH0="
  }
}
```

### Offset-Based

Acceptable for small, static datasets where total count is useful (admin tables, reports).

```json
{
  "data": [...],
  "meta": {
    "total": 342,
    "page": 2,
    "page_size": 20
  }
}
```

### Pagination Rules

- Always set a default page size (e.g., 20)
- Enforce a maximum page size cap (e.g., 100) -- clients should not fetch unbounded lists
- Every list endpoint must be paginated, even if you think the dataset is small today

---

## Versioning

| Strategy | When | Example |
|----------|------|---------|
| URL path | Major breaking changes | `/api/v1/users`, `/api/v2/users` |
| Header | Minor variations (rare) | `Accept: application/vnd.api+json;version=2` |

- Prefer URL path versioning -- it is explicit and easy to route
- Announce deprecation timelines: minimum 3 months before sunsetting a version
- Document migration guides for each version bump

---

## Request/Response Patterns

- **Pydantic models** for request validation and response serialization
- **Datetime**: ISO 8601 UTC always (`2025-01-15T08:30:00Z`)
- **IDs**: Return as strings, even if numeric internally (avoids JS integer overflow at 2^53)
- **Envelope consistency**: Pick `{"data": ..., "meta": ...}` or flat responses and stick with it project-wide
- **Null vs absent**: Decide a convention -- either omit null fields or include them explicitly. Document which.

---

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Verbs in URLs (`/api/getUser`) | Duplicates what HTTP method expresses | `GET /api/users/{id}` |
| Mixed naming (`userId` + `user_name`) | Inconsistent, confusing for consumers | Pick one convention, enforce it |
| 200 for errors | Clients can't use status codes for control flow | Use proper 4xx/5xx codes |
| Exposing DB schema | Couples API to storage, leaks internals | Map to explicit response models |
| Unbounded list endpoints | Memory/performance risk, poor UX | Always paginate |
| Nested creation (`POST /users/{id}/orders/{id}/items`) | Complex transactions, unclear ownership | Flatten or use batch endpoint |

---

## FastAPI Implementation

When using FastAPI (the default for `interface/api`), follow these patterns:

### Route Organization

```
src/{project}/
├── api/
│   ├── __init__.py
│   ├── app.py              # FastAPI app factory
│   ├── dependencies.py     # Shared DI (database, auth, settings)
│   ├── middleware.py        # Error handling, CORS, request logging
│   └── routes/
│       ├── __init__.py      # Router aggregation
│       ├── health.py        # GET /health, GET /ready
│       ├── users.py         # /api/v1/users
│       └── orders.py        # /api/v1/orders
```

### Thin Routes

Routes delegate immediately to use cases. No business logic in route handlers:

```python
from fastapi import APIRouter, Depends, status

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_order(
    body: OrderCreate,
    use_case: CreateOrderUseCase = Depends(get_create_order_use_case),
) -> OrderResponse:
    """Create a new order."""
    order = await use_case.execute(body)
    return OrderResponse.model_validate(order)
```

### Dependency Injection

```python
from fastapi import Depends


async def get_db() -> AsyncGenerator[Connection, None]:
    async with pool.acquire() as conn:
        yield conn


async def get_order_repo(db: Connection = Depends(get_db)) -> OrderRepository:
    return SqlOrderRepository(db)


async def get_create_order_use_case(
    repo: OrderRepository = Depends(get_order_repo),
) -> CreateOrderUseCase:
    return CreateOrderUseCase(repo)
```

### Error Handling Middleware

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


async def error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": str(exc)}},
    )


app = FastAPI()
app.add_exception_handler(AppError, error_handler)
```

### Health Checks

Every API must expose:

```python
@router.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe — is the process running?"""
    return {"status": "ok"}


@router.get("/ready")
async def ready(db: Connection = Depends(get_db)) -> dict[str, str]:
    """Readiness probe — can we serve traffic?"""
    await db.execute("SELECT 1")
    return {"status": "ready"}
```

---

## See Also

- [security-review](../security-review/SKILL.md) -- every new endpoint should pass a security review
