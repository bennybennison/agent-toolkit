---
name: "connector-dev"
description: "How to build and extend external API connectors."
pack: "skills-ops"
---

# Skill: Connector Development

How to build and extend external API connectors.

**Module:** This skill applies when `connector/full` or `connector/lite` is active.

---

## Workflow — Research Before Code

**BEFORE building or testing any connector endpoint:**

1. **Check OpenAPI specs** — look in `{connector}/openapi/` for downloaded API specs
2. **Check local docs** — read `plan/specs/integrations/{system}.md`
3. **Check AGENTS.md** — follow documented patterns
4. **Read external docs** — links in AGENTS.md
5. **Document findings** — update local docs with discoveries
6. **Then code** — only after understanding parameters, rate limits, gotchas

## Full Connector Structure (`connector/full`)

```
connectors/{system}/
+-- AGENTS.md           # How to work with this connector
+-- SKILL.md            # What methods are available
+-- __init__.py         # Clean public API
+-- config.py           # Typed settings (BaseSettings)
+-- client.py           # HTTP client, auth, rate limiting
+-- gateway.py          # High-level facade (optional)
+-- services/
|   +-- base.py         # Shared patterns (pagination, error handling)
|   +-- {entity}.py     # One file per API entity (< 300 lines)
+-- openapi/            # Downloaded API specs
```

### The 4-Tier Pattern

| Tier | File | Responsibility |
|------|------|----------------|
| **Settings** | `config.py` | Typed configuration via `BaseSettings` |
| **Plumbing** | `client.py` | HTTP transport, auth, retries, rate limiting |
| **Translator** | `services/*.py` | API-specific request/response translation |
| **Brain** | `gateway.py` | Business-level orchestration across services |

## Lite Connector Structure (`connector/lite`)

```
connectors/{system}/
+-- client.py           # Everything in one file
+-- config.py           # Settings
```

Use when the API has few endpoints and simple auth.

## Choosing Full vs Lite

| Signal | Choice |
|--------|--------|
| > 5 endpoints | `connector/full` |
| Complex auth (OAuth, token refresh) | `connector/full` |
| Pagination, rate limiting | `connector/full` |
| Multiple entity types | `connector/full` |
| 1-5 simple endpoints | `connector/lite` |
| API key auth only | `connector/lite` |
| Started lite, growing complex | Upgrade to full |

## Common Patterns

### Base Service

```python
class BaseService:
    def __init__(self, client: HttpClient) -> None:
        self._client = client

    def _paginate(
        self,
        endpoint: str,
        params: dict[str, str],
    ) -> Iterator[dict]:
        """Generic pagination handler."""
        next_token: str | None = None
        while True:
            if next_token:
                params["nextToken"] = next_token
            response = self._client.get(endpoint, params=params)
            yield from response["data"]
            next_token = response.get("nextToken")
            if not next_token:
                break
```

### Settings

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class AmazonSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AMAZON_")

    client_id: str
    client_secret: str
    refresh_token: str
    marketplace_id: str = "A1F83G8C2ARO7P"
```

## Checklist

- [ ] Read API docs before writing code
- [ ] Settings use `BaseSettings` (not hardcoded)
- [ ] Auth handled in client layer (not in services)
- [ ] Rate limiting respected
- [ ] Error responses handled gracefully
- [ ] AGENTS.md and SKILL.md created/updated

---

## Scaffolding Procedure — New Connector

When creating a new connector from scratch, follow this sequence:

### Step 1 — Requirements Gathering

Before writing any code:

1. Get the API documentation URL
2. Determine auth method (API key, OAuth2, token refresh)
3. List the entities/resources you need (orders, products, etc.)
4. Identify rate limits and pagination approach
5. Check if an OpenAPI spec is available (download to `openapi/`)

### Step 2 — Choose Full vs Lite

Use the decision table above. Default to lite — you can always upgrade later.

### Step 3 — Create Files (Full Connector)

Create files in this order — each builds on the previous:

| Order | File | Dependencies |
|-------|------|-------------|
| 1 | `config.py` | None — start here |
| 2 | `client.py` | Imports from `config.py` |
| 3 | `services/base.py` | Imports from `client.py` |
| 4 | `services/{entity}.py` | Extends `base.py` |
| 5 | `gateway.py` | Orchestrates services |
| 6 | `__init__.py` | Re-exports public API |
| 7 | `AGENTS.md` | Use CONNECTOR_AGENTS.md template |
| 8 | `SKILL.md` | Document public methods |

### Step 4 — Registration

After the connector is functional:

1. Add environment variables to `.env.example`
2. Add connector to project's AGENTS.md key files table
3. If using a connector registry, register the new connector
4. Update project README if it lists available integrations

### Step 5 — Verification

- [ ] All endpoints return expected data with real credentials
- [ ] Rate limiting is respected (check response headers)
- [ ] Auth token refresh works (if applicable)
- [ ] Error responses are handled (not just happy path)
- [ ] Pagination works for endpoints that return lists

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Code before reading API docs | Research first, code second |
| Put auth logic in services | Auth belongs in the client layer |
| Hardcode URLs or credentials | Use `BaseSettings` for all config |
| Ignore rate limits | Implement backoff in client layer |
| Skip AGENTS.md/SKILL.md | Doc the connector for future developers |
| Build full when lite suffices | Start lite, upgrade when complexity demands |

---

## See Also

- [api-design](../api-design/SKILL.md) — REST API design patterns (for the APIs you consume)
- [security-review](../security-review/SKILL.md) — Security considerations for API integrations
- [dependency-management](../dependency-management/SKILL.md) — Managing API client libraries
