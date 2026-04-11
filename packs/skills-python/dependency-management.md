---
skill: dependency-management
scope: python
profile: standard, full
tags: [dependencies, uv, security, supply-chain]
requires_bins: [python3, uv]
---

# Skill: Dependency Management

When and how to manage third-party dependencies. Every dependency is a liability -- it adds attack surface, maintenance burden, and coupling to external maintainers. This skill provides a decision framework and operational workflow using `uv` as the package manager.

---

## When to Use

- Before adding any new third-party package
- When updating or auditing existing dependencies
- During security review of the dependency tree
- When onboarding a new project and evaluating its dependency health

## Decision Framework -- When to Add a Dependency

Adding a dependency should be a deliberate decision, not a reflex. Work through these questions in order:

| Question | If Yes | Why |
|----------|--------|-----|
| Does the standard library solve it? | Use stdlib | Zero additional risk, always available |
| Could you write it in <100 lines? | Consider writing it | Avoids coupling for trivial functionality |
| Is it well-maintained? | Proceed to next check | Abandoned packages become your maintenance burden |
| Is the scope appropriate? | Proceed to next check | A 50k LOC library for one function is overkill |
| Is the license compatible? | Proceed to add | GPL contaminates; MIT/Apache-2.0 are safe |

### Maintenance Health Checks

Before adding a dependency, check these signals:

- **Recent commits**: Last commit within 6 months (for active libraries)
- **Issue response time**: Maintainers respond within weeks, not months
- **Bus factor**: More than one active maintainer
- **Download trends**: Stable or growing, not declining
- **Breaking change history**: Frequent major version bumps signal instability

## Adding Dependencies with uv

Always use `uv` to manage dependencies. Using `pip install` directly bypasses the project manifest and makes builds unreproducible.

```bash
# Runtime dependency
uv add httpx

# Dev-only dependency (testing, linting, type checking)
uv add --dev pytest ruff mypy

# Update the lockfile after manual pyproject.toml edits
uv lock
```

Always commit both `pyproject.toml` and `uv.lock`. The manifest declares intent; the lockfile guarantees reproducibility.

## Version Pinning Strategy

Different dependency types need different pinning strategies because they serve different purposes:

| Dep Type | Strategy | Example | Why |
|----------|----------|---------|-----|
| Direct runtime | Pin minimum compatible | `>=1.5,<2.0` | Allows patches, blocks breaking changes |
| Direct dev | Pin minimum compatible | `>=8.0` | More flexibility acceptable for dev tools |
| Transitive | Lockfile handles it | (uv.lock) | You don't control these directly |

Pinning exact versions in `pyproject.toml` (e.g., `==1.5.3`) is an anti-pattern -- it prevents receiving security patches and creates needless merge conflicts. That level of precision is what the lockfile provides.

## Updating Dependencies

### Routine Updates (Monthly)

```bash
# Update all deps within version constraints
uv lock --upgrade

# Run the full test suite
pytest

# Check for deprecation warnings
pytest -W error::DeprecationWarning
```

### Targeted Updates

```bash
# Update a specific package (e.g., after a security advisory)
uv lock --upgrade-package httpx

# Review what changed
uv tree | grep httpx
```

### Major Version Bumps

1. Read the changelog and migration guide
2. Update the version constraint in `pyproject.toml`
3. Run `uv lock`
4. Fix breaking changes
5. Run the full test suite
6. Commit as a dedicated change (not mixed with feature work)

## Dependency Audit Checklist

Run this quarterly, or before any major release:

1. **List the full tree**: `uv tree` -- understand what you actually depend on
2. **Check for unused deps**: compare imports across the codebase against `pyproject.toml`
3. **Check for outdated deps**: `uv lock --check` -- identifies constraint violations
4. **Scan for vulnerabilities**: `uv audit` or `pip-audit`
5. **Review transitive deps**: large transitive trees increase supply chain risk
6. **Verify lockfile is committed**: `git ls-files uv.lock` should return a result

## Security

- Check for known vulnerabilities before adding any new dependency
- Subscribe to security advisories for critical deps (GitHub watch, RSS)
- Have a process for emergency patching -- you should be able to update a single dep, test, and deploy within hours
- Prefer dependencies that publish signed releases or use trusted publishing

## Anti-Patterns

| Don't | Do Instead | Why |
|-------|------------|-----|
| `pip install <package>` | `uv add <package>` | pip doesn't track deps in the project manifest |
| Pin exact versions in pyproject.toml | Use compatible ranges | Lockfile handles exact pinning |
| Skip committing uv.lock | Always commit the lockfile | Without it, builds are not reproducible |
| Add a dep for trivial functionality | Write it yourself if <100 lines | Less coupling, less risk |
| Ignore deprecation warnings | Fix or plan to fix before the next major version | They become errors eventually |
| Use requirements.txt with pyproject.toml | Use pyproject.toml as the single source | Two manifests cause drift |
| Add deps without checking the license | Audit license before adding | GPL in a proprietary project is a legal problem |

---

## See Also

- [security-review](security-review.md) -- includes dependency vulnerability scanning as part of broader security review
