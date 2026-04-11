---
name: "logging-standards"
description: "Standardizes how Python applications produce output using a three-level"
pack: "skills-python"
---

# Skill: Three-Level Logging Model

Standardizes how Python applications produce output using a three-level
verbosity model. This keeps log output predictable across tools and gives users
a consistent way to control how much they see.

## When to Use

- Setting up logging in a new application or library.
- Reviewing logging practices in existing code.
- Integrating with CLI tools that accept `-v` / `-q` flags.

## Three Verbosity Levels

Every tool should support exactly three levels. More than three adds complexity
without proportional value.

| Level | Flag | What to Show | Audience |
|-------|------|-------------|----------|
| Quiet | `-q` | Errors and final result only | Scripts, CI pipelines |
| Standard | (default) | Progress milestones, warnings, results | Developers during normal use |
| Verbose | `-v` | Debug details, timing, intermediate state | Debugging and troubleshooting |

## Mapping to Python Logging

| Verbosity | `logging` Level | Numeric Value |
|-----------|-----------------|---------------|
| Quiet | `WARNING` | 30 |
| Standard | `INFO` | 20 |
| Verbose | `DEBUG` | 10 |

## Setup Pattern

Wire verbosity to logging levels at application startup. The `verbosity`
parameter maps to the CLI flags: `-q` = -1, default = 0, `-v` = 1.

```python
import logging


def configure_logging(verbosity: int = 0) -> None:
    """Configure root logger based on CLI verbosity flag.

    Args:
        verbosity: -1 for quiet, 0 for standard, 1+ for verbose.
    """
    level = {-1: logging.WARNING, 0: logging.INFO, 1: logging.DEBUG}.get(
        verbosity, logging.DEBUG
    )
    logging.basicConfig(
        level=level,
        format="%(levelname)s: %(message)s",
    )
```

Why a dict lookup instead of arithmetic: it is explicit about the mapping and
handles edge cases (like `-vvv`) by falling through to `DEBUG`.

## Logger per Module

```python
logger = logging.getLogger(__name__)
```

Always use `__name__`. This produces loggers like `myapp.processing.pipeline`,
which lets you:

- Filter logs by module: `logging.getLogger("myapp.processing").setLevel(DEBUG)`
- Trace where a log message originated without searching the codebase.
- Silence noisy modules without affecting the rest of the application.

## Progress Logging

For operations that process a known number of items, log at regular intervals
rather than every item. Logging every item floods the output and hides
meaningful progress.

```python
def process_batch(items: list[Item]) -> None:
    total = len(items)
    log_interval = max(1, total // 10)  # Log ~10 times

    for i, item in enumerate(items, 1):
        process(item)
        if i % log_interval == 0 or i == total:
            logger.info("Processing %d/%d (%.0f%%)", i, total, i / total * 100)
```

## Log Message Guidelines

| Guideline | Reason | Example |
|-----------|--------|---------|
| Start with a verb | Scannable in log output | `"Processing order %s"` |
| Include identifiers | Makes logs searchable | `"Skipping user %s: inactive"` |
| Add structured context | Enables machine parsing | `logger.info("Found %d items", count, extra={"source": src})` |
| Let the formatter add timestamps | Avoids duplicate timestamps | Do not write `f"{datetime.now()} Processing..."` |

## Error Message Guidelines

Good error messages answer three questions:

1. **What went wrong**: "Failed to connect to database at localhost:5432"
2. **What was expected**: "Expected PostgreSQL 14+"
3. **What to do about it**: "Check DATABASE_URL in .env"

```python
logger.error(
    "Failed to connect to database at %s. Expected PostgreSQL %s+. "
    "Check DATABASE_URL in .env",
    db_host,
    min_pg_version,
)
```

Why all three parts: an error that says "connection failed" forces the user to
investigate. An error that says what to do saves that investigation time.

## What NOT to Log

Some data must never appear in logs, regardless of verbosity level.

| Data Type | Level Restriction | Why |
|-----------|-------------------|-----|
| Passwords, tokens, API keys | Never log | Security breach if logs are exposed |
| PII (emails, phone numbers) | DEBUG only | Compliance (GDPR, CCPA) |
| Full request/response bodies | DEBUG only | Size -- these flood log aggregators |

Even partial secrets (like `sk-...abc`) can be exploited. When you need to
confirm a credential is loaded, log its presence, not its value:
`logger.debug("API key configured: %s", bool(api_key))`.

## `print()` vs `logging`

| Context | Use | Why |
|---------|-----|-----|
| Library code | `logging` | Callers need control over output |
| CLI entrypoints | `print()` is acceptable | Direct user interaction |
| `minimal` profile projects | `print()` is acceptable | Low ceremony is the point |
| Everything else (`standard`+) | `logging` | Consistency and control |

## Anti-patterns

- **`print()` in library code.** Libraries should not write directly to
  stdout/stderr. Use `logging` so the calling application can control output.
- **Logger without `__name__`.** Using `logging.getLogger("mylogger")` or bare
  `logging.info()` makes it impossible to filter by module.
- **Redundant level prefixes.** Writing `logger.error("ERROR: something failed")`
  produces `ERROR: ERROR: something failed` in output. The formatter already
  adds the level.
- **Catch-log-silence.** Catching an exception, logging it, and then continuing
  as if nothing happened hides bugs. If you log an exception, either re-raise
  it or handle it meaningfully.
- **Logging at the wrong level.** A successful operation logged at WARNING
  trains users to ignore warnings. Reserve WARNING for things that need
  attention.

## See also

- `cli-conventions` -- how `-v` and `-q` flags are defined and parsed
- `terminal-execution` -- safe patterns for subprocess output handling
