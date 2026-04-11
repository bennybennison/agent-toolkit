---
rule: python-tooling
scope: python
profile: all
tags: [python, ruff, mypy, uv, tooling]
---

# Python Tooling

## Package Management — uv

`uv` is the only package manager. Never use pip or poetry.

```bash
# Install dependencies
uv sync

# Add a dependency
uv add httpx
uv add --dev pytest

# Run with project deps
uv run python script.py
uv run pytest

# Create a new project
uv init my-project
```

## Linting & Formatting — ruff

`ruff` handles both linting and formatting. No separate black, isort, or flake8.

```bash
# Lint
ruff check .
ruff check --fix .

# Format
ruff format .
ruff format --check .
```

### Recommended ruff config

```toml
# pyproject.toml
[tool.ruff]
target-version = "py312"
line-length = 88

[tool.ruff.lint]
select = [
    "E",    # pycodestyle errors
    "W",    # pycodestyle warnings
    "F",    # pyflakes
    "I",    # isort
    "N",    # pep8-naming
    "UP",   # pyupgrade
    "S",    # security (replaces bandit)
    "B",    # bugbear
    "A",    # builtins shadowing
    "C4",   # comprehensions
    "DTZ",  # datetime
    "T20",  # print statements
    "RUF",  # ruff-specific
]
ignore = [
    "S101",  # assert in tests is fine
]

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["S101"]
"**/cli.py" = ["T20"]         # print() is expected in CLI entrypoints
"**/cli/**" = ["T20"]         # print() is expected in CLI modules
"**/commands/**" = ["T20"]    # print() is expected in command handlers
```

> **Note on T20:** The `T20` rule flags `print()` statements, which is correct for library code. However, CLI entrypoints and `minimal` profile projects use `print()` legitimately. Add per-file ignores for CLI modules as shown above. For `minimal` profile projects, consider disabling T20 entirely.

## Type Checking — mypy

`mypy` is the type checker. Not pyright.

```bash
mypy .
mypy src/domain/
```

### Recommended mypy config

```toml
# pyproject.toml
[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
```

## Testing — pytest

```bash
uv run pytest                    # all tests
uv run pytest tests/unit/        # subset
uv run pytest -x                 # stop on first failure
uv run pytest --cov=src          # coverage
uv run pytest -k "test_order"    # filter
```

### Recommended pytest config

```toml
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "-v --tb=short"
```

## Pre-Commit Checklist

Before committing Python code:

1. `ruff check .` — passes
2. `ruff format --check .` — passes
3. `mypy .` — passes (for `standard`+ projects)
4. `uv run pytest` — passes

## See Also

- `rules/python/type-hints.md` — type annotation standards and advanced patterns
- `rules/python/imports.md` — import ordering and Clean Architecture boundaries
- `rules/python/class-structure.md` — naming conventions and dataclass patterns
- `skills/dependency-management.md` — deep dive on uv workflows
- `skills/python-testing.md` — pytest patterns and testing by layer
