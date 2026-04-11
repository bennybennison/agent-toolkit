# {Connector Name} Connector

> {One-sentence description of what this connector integrates with.}

## BEFORE WORKING ON THIS CODE

1. Read this entire AGENTS.md first
2. Read the SKILL.md in this directory for the API reference
3. Check GOTCHAS.md at the project root for known issues with this connector
4. Review the connector spec if one exists in `.opencode/plans/specs/`

## Architecture

This connector follows the **4-tier pattern** (see CONSTITUTION.md):

| Tier | File | Purpose |
|------|------|---------|
| **Brain** | `{connector}_brain.py` | Orchestration logic, decides what to do |
| **Plumbing** | `{connector}_plumbing.py` | HTTP calls, retries, rate limiting |
| **Translator** | `{connector}_translator.py` | Data transformation between API and domain models |
| **Settings** | `{connector}_settings.py` | Configuration, credentials, feature flags |

### Data Flow

```
External API → Plumbing (raw response) → Translator (domain model) → Brain (business logic)
```

## Key Files

| File | Purpose |
|------|---------|
| `{connector}_brain.py` | {What the brain orchestrates} |
| `{connector}_plumbing.py` | {What API calls it makes} |
| `{connector}_translator.py` | {What data it transforms} |
| `{connector}_settings.py` | {What configuration it needs} |
| `models.py` | {Domain models for this connector} |

## API Integration

| Aspect | Detail |
|--------|--------|
| Base URL | `{API Base URL}` |
| Auth method | {API key / OAuth / Token} |
| Rate limits | {Requests per second/minute} |
| Sandbox | {Yes/No — sandbox URL if yes} |

## Dependencies

- **Internal:** {What other packages this connector imports from}
- **External:** {Third-party libraries — httpx, etc.}

## Constraints

- {Constraint 1 — e.g. "API rate limit is 30 requests/minute, plumbing handles throttling"}
- {Constraint 2 — e.g. "All API responses must be validated before passing to translator"}
- {Constraint 3 — e.g. "Settings must never contain hardcoded credentials"}

## Testing

- Unit tests mock the Plumbing layer (no real API calls)
- Integration tests use the sandbox/test environment
- Test files: `tests/unit/test_{connector}_*.py`

## Common Tasks

### Adding a new API endpoint
1. Add the HTTP call in Plumbing
2. Add response/request models in Translator
3. Add orchestration logic in Brain
4. Add any new settings to Settings
5. Update SKILL.md with the new capability

### Debugging API issues
1. Check Settings for correct credentials
2. Check Plumbing for raw request/response logging
3. Check Translator for data mapping issues
4. Check GOTCHAS.md for known API quirks
