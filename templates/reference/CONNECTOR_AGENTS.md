# {Connector Name} Connector

> {One-sentence description of what this connector integrates with.}

## Before Working On This Code

1. Read this entire `AGENTS.md`
2. Read the `SKILL.md` in this directory if one exists
3. Check root `GOTCHAS.md` for known issues
4. Review the connector spec or ADRs if they exist

## Architecture

This connector follows the 4-tier pattern:

| Tier | File | Purpose |
|------|------|---------|
| Brain | `{connector}_brain.py` | Orchestration logic |
| Plumbing | `{connector}_plumbing.py` | HTTP calls, retries, rate limiting |
| Translator | `{connector}_translator.py` | Data transformation |
| Settings | `{connector}_settings.py` | Configuration and credentials |

### Data Flow

```text
External API -> Plumbing -> Translator -> Brain
```

## Key Files

| File | Purpose |
|------|---------|
| `{connector}_brain.py` | {What it orchestrates} |
| `{connector}_plumbing.py` | {What API calls it makes} |
| `{connector}_translator.py` | {What data it transforms} |
| `{connector}_settings.py` | {What config it needs} |
| `models.py` | {Domain models for this connector} |

## API Integration

| Aspect | Detail |
|--------|--------|
| Base URL | `{API Base URL}` |
| Auth method | {API key / OAuth / Token} |
| Rate limits | {Requests per second/minute} |
| Sandbox | {Yes/No} |

## Constraints

- {Constraint 1}
- {Constraint 2}
- {Constraint 3}

## Testing

- Unit tests mock the plumbing layer
- Integration tests use a sandbox or test environment
- Test files: `tests/unit/test_{connector}_*.py`

## Common Tasks

### Adding A New API Endpoint

1. Add the HTTP call in Plumbing
2. Add request/response models in Translator
3. Add orchestration logic in Brain
4. Add any new settings in Settings
5. Update `SKILL.md` with the new capability
