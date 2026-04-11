# Project Constitution

## Mission Statement

{2-3 sentences: what this project does, who it serves, what it is NOT}

---

## Architecture Principles

### Simplicity First (YAGNI)

Build the minimum needed now. Add complexity only when required.

1. **Minimal Models** -- Don't create entities until you need them
2. **Start Simple** -- Direct approach first, abstract when patterns emerge
3. **Modular for Growth** -- Structure so complexity CAN be added, but don't add it now

**When to add complexity:**
- You need to enforce business rules on the data
- Multiple places need the same transformation
- Tests are becoming hard to write without a model
- You're copying the same logic repeatedly

### Clean Architecture

1. **Dependency Rule** -- Dependencies point inward only
2. **Entity Independence** -- Domain entities never import from infrastructure
3. **Use Case Isolation** -- Each use case is a single class with one public `execute()` method
4. **Interface Segregation** -- Ports live in domain; adapters implement them
5. **Framework Independence** -- Framework is an adapter detail, not a core concern

### Layer Boundaries

```
Interface (API, CLI, Webhooks)     <-- Framework adapters
Application (Use Cases, Commands)  <-- Business operations
Domain (Entities, Value Objects)   <-- Pure business logic
Infrastructure (DB, Connectors)    <-- External adapters
```

---

## Technology Stack

| Technology | Choice | Notes |
|------------|--------|-------|
| Runtime | {Runtime Version} | |
| Package Manager | {Package Manager} | |
| Framework | {Framework Name} | |
| Database | {Database Engine} | |
| Type Hints | Strict | All functions annotated |

---

## Coding Standards

| Rule | Detail |
|------|--------|
| Type hints | Strict -- all functions annotated |
| Imports | Absolute only, no star imports |
| Domain entities | `@dataclass`, no framework deps |
| Ports | `Protocol` classes in domain layer |
| Use cases | Single `execute()` method |
| Error handling | Result types for expected, exceptions for unexpected |

---

## Prohibited Patterns

1. `Any` without comment
2. Business logic in routes
3. Direct DB access outside repositories
4. Hardcoded credentials
5. `print()` in library code
6. Domain importing from infrastructure

---

## Testing Philosophy

1. **Domain layer**: Unit tests, no mocks needed
2. **Use cases**: Unit tests with mocked ports
3. **Adapters**: Integration tests
4. **E2E**: Critical paths only

### Test Naming

```
test_{method}_{scenario}_{expected_outcome}
```

---

## Documentation Rules

| File | Purpose | Required |
|------|---------|----------|
| `AGENTS.md` | How to work with package code | Every package |
| `SKILL.md` | What the package can do | Packages with public APIs |
| `GOTCHAS.md` | Lessons learned | Project root |

---

## External Systems

| System | Role | Sync Direction |
|--------|------|----------------|
| {System Name} | {Role} | {Direction} |
