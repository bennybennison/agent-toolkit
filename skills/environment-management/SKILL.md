---
name: "environment-management"
description: "Configuration and environment management patterns for applications. Covers how to structure configuration across environments using `pydantic-settings` for typed parsing and `dotenvx` for encrypted secrets — so misconfiguration fails fast and secrets stay out of source control."
pack: "skills-ops"
---

# Skill: Environment Management

Configuration and environment management patterns for applications. Covers how to structure configuration across environments using `pydantic-settings` for typed parsing and `dotenvx` for encrypted secrets — so misconfiguration fails fast and secrets stay out of source control.

---

## Configuration Hierarchy

Settings are resolved top-down. The first source that provides a value wins.

| Priority | Source | Example |
|----------|--------|---------|
| 1 (highest) | Command-line arguments | `--debug`, `--log-level=DEBUG` |
| 2 | Environment variables | `APP_DEBUG=true` |
| 3 | `.env` file (local) / `.env.vault` (deployed) | Developer overrides / encrypted secrets |
| 4 | Config file | `pyproject.toml`, `settings.yaml` |
| 5 (lowest) | Application defaults | Hardcoded in the settings class |

Why this order: CLI args are explicit and intentional, so they override everything. Environment variables are the standard mechanism for deployment config. `.env` files provide convenience during local development. Config files hold shared defaults. Application defaults are the fallback of last resort.

---

## The Two-Tool System: dotenvx + pydantic-settings

These tools are complementary, not competing:

| Layer | Tool | Responsibility |
|-------|------|----------------|
| Shell / Runtime | `dotenvx` | Encrypts `.env` files, decrypts at runtime, injects env vars into process |
| Python / Application | `BaseSettings` | Reads env vars, validates types, provides typed config objects |

Python code never imports or calls dotenvx. It just reads the environment variables that dotenvx injected. This means your Python code works identically whether env vars come from dotenvx, Docker, CI/CD, or a plain `.env` file.

---

## dotenvx — Encrypted Environment Management

### Why dotenvx

Plaintext `.env` files cannot be committed to git, which creates problems: new developers need secrets shared via Slack/email, CI/CD needs manual secret configuration, and there is no version history of config changes. dotenvx solves this by encrypting `.env` files into `.env.vault` files that CAN be committed.

### Setup

```bash
# Install dotenvx
brew install dotenvx/brew/dotenvx
# or: curl -sfS https://dotenvx.sh | sh

# Encrypt your .env file
dotenvx encrypt
# Creates: .env.vault (encrypted, safe to commit)
# Creates: .env.keys (decryption keys, NEVER commit)
```

### Running Applications

```bash
# Local development — uses .env directly
dotenvx run -- python app.py
dotenvx run -- uv run pytest

# With a specific environment
dotenvx run -f .env.staging -- python app.py
dotenvx run -f .env.production -- python app.py
```

### Per-Environment Encryption

```bash
# Create environment-specific .env files
dotenvx encrypt -f .env.staging
dotenvx encrypt -f .env.production

# Each gets its own entry in .env.vault and .env.keys
```

### File Safety Rules

| File | Contains | Commit? | `.gitignore`? |
|------|----------|---------|---------------|
| `.env` | Plaintext secrets (local dev) | NO | YES |
| `.env.example` | Template with dummy values | YES | NO |
| `.env.vault` | Encrypted secrets | YES | NO |
| `.env.keys` | Decryption keys | **NEVER** | **YES** |

### CI/CD Integration

Set the `DOTENV_KEY` environment variable in your CI/CD pipeline. dotenvx uses this key to decrypt `.env.vault` at runtime — no plaintext secrets needed in the pipeline.

```bash
# In CI/CD: set DOTENV_KEY from your secret store
export DOTENV_KEY="dotenv://:key_abc123@dotenvx.com/vault/.env.vault?environment=production"

# Then run normally — dotenvx decrypts automatically
dotenvx run -- python app.py
```

---

## Python Pattern — Pydantic BaseSettings

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_file=".env",
        env_file_encoding="utf-8",
    )

    database_url: str
    debug: bool = False
    log_level: str = "INFO"
    secret_key: str  # No default — forces explicit configuration
```

Why BaseSettings over python-dotenv:

| Capability | BaseSettings | python-dotenv |
|-----------|-------------|---------------|
| Type validation at startup | Yes — fails fast on wrong types | No — everything is a string |
| Env var prefix scoping | `APP_DATABASE_URL` automatic | Manual |
| Default values | Typed and documented in the class | Scattered across code |
| Nested settings | `env_nested_delimiter` support | Manual parsing |
| IDE support | Full autocomplete and type checking | `os.getenv()` returns `str | None` |

### Workflow: Adding a New Config Variable

1. Add the field to the `Settings` class with a type annotation
2. Give it a sensible default if one exists — leave it without a default if it must be explicitly set
3. Add it to `.env.example` with a comment and example value
4. Add it to `.env` locally and re-run `dotenvx encrypt` if using dotenvx
5. If it is a secret, add it to the secret manager for staging/production
6. Run the application to verify the new field loads correctly

---

## Environment Validation

Validate all required configuration at application startup. If something is wrong, the application should fail immediately with a clear error message rather than crashing later in an obscure way.

```python
def create_app() -> App:
    try:
        settings = Settings()
    except ValidationError as e:
        # Prints exactly which fields are missing or have wrong types
        print(f"Configuration error:\n{e}", file=sys.stderr)
        sys.exit(1)

    # Log which sources were used, but NOT secret values
    logger.info("Config loaded", extra={
        "debug": settings.debug,
        "log_level": settings.log_level,
        "database_host": urlparse(settings.database_url).hostname,
    })
```

Why fail fast: A missing database URL that silently becomes `None` will cause a confusing `TypeError` deep in the connection pool. Catching it at startup with a validation error saves debugging time.

---

## Secret Management by Environment

| Environment | Secret Storage | Why |
|-------------|----------------|-----|
| Local dev | `.env` file (plaintext) | Convenient, no infrastructure needed |
| CI/CD | `DOTENV_KEY` + `.env.vault` | Encrypted, version-controlled, no manual secret setup |
| Staging | dotenvx `.env.vault` or secret manager | Auditable, rotatable |
| Production | dotenvx `.env.vault` or secret manager | Same, with stricter access policies |

Key practices:

- Never commit secrets, even "test" secrets — they tend to become real secrets over time
- Rotate secrets on a schedule and after any team member departure
- Use different secrets per environment — a leaked staging secret should not compromise production
- Log that a secret was loaded, but never log its value

---

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Hardcoded config in source code | Cannot change without redeployment | Move to settings class with env var override |
| `python-dotenv` / `load_dotenv()` | No validation, manual typing | Use `pydantic-settings` `BaseSettings` |
| `os.environ["KEY"]` / `os.getenv()` | No validation, scattered across codebase | Centralize in a single `Settings` class |
| Sharing `.env` via Slack/email | Secrets in chat history, no access control | Use dotenvx `.env.vault` or 1Password |
| Plaintext `.env` in production | Secrets exposed in filesystem | Use `dotenvx encrypt` |
| Production secrets in development | Dev mistakes can affect production systems | Separate credentials per environment |
| Silent config failure (returns `None`) | Crashes later with misleading error | Use required fields without defaults |
| Missing `.env.example` | New developers cannot onboard | Maintain `.env.example` alongside `.env` |

---

## See Also

- `rules/common/security.md` — secrets management rules, dotenvx file safety, prohibited patterns
- [security-review](../security-review/SKILL.md) — secrets management checklist and scanning patterns
- [deployment-patterns](../deployment-patterns/SKILL.md) — how config flows through deployment pipelines
- [cli-conventions](../cli-conventions/SKILL.md) — command-line arguments as the highest-priority config source
