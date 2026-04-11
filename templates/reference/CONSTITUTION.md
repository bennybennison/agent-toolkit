# Project Constitution

## Mission Statement

{2-3 sentences: what this project does, who it serves, and what it is not}

## Architecture Principles

### Simplicity First

Build the minimum needed now. Add complexity only when a clear pressure requires it.

### Layer Boundaries

```text
Interface
  ->
Application
  ->
Domain
  ->
Infrastructure
```

### Dependency Rule

Dependencies should point inward toward stable business concepts, not outward toward framework details.

## Technology Stack

| Technology | Choice | Notes |
|------------|--------|-------|
| Runtime | {Runtime Version} | |
| Package Manager | {Package Manager} | |
| Framework | {Framework Name} | |
| Database | {Database Engine} | |

## Coding Standards

| Rule | Detail |
|------|--------|
| Type hints | Strict |
| Imports | Absolute only, no star imports |
| Error handling | Expected failures are explicit; unexpected failures raise |
| Logging | Structured where practical |

## Prohibited Patterns

1. `Any` without comment
2. Hardcoded credentials
3. Business logic in thin interface adapters
4. Domain logic coupled to infrastructure details

## Testing Philosophy

1. Domain logic: focused unit tests
2. Use cases/services: unit tests around behavior
3. Adapters/integrations: integration tests where needed
4. End-to-end tests: critical paths only

## Documentation Rules

| File | Purpose | Required |
|------|---------|----------|
| `AGENTS.md` | How to work with package code | Every package |
| `SKILL.md` | Capability/API reference | Public packages |
| `GOTCHAS.md` | Lessons learned | Project root |
