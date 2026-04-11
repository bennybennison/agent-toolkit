---
skill: python-verification-strategy
scope: python
profile: standard,full
tags: [verification, python, testing, linting]
---

# Python Verification Strategy

When verifying Python code changes, run these checks in order:

## 1. Linting
```bash
ruff check . --fix
```
If `ruff` is not available, fall back to `flake8 .` or `python -m py_compile`.

## 2. Type Checking
```bash
mypy . --ignore-missing-imports
```
If `mypy` is not available, skip type checking and note it in the verification report.

## 3. Tests
```bash
pytest -x -q
```
If `pytest` is not available, try `python -m unittest discover`.

## 4. Report
Summarize results as:
- **Lint**: pass/fail (N issues)
- **Types**: pass/fail/skipped (N errors)
- **Tests**: pass/fail (N passed, M failed)

If any step fails, stop and report the failure before proceeding.
