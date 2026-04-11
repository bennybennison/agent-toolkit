---
description: Review code for quality, patterns, and potential issues
surface: user-agent
agent: code-reviewer
subtask: true
---

Before delegating to `@code-reviewer`, gather a compact evidence bundle for the target scope: the requested files or diff, relevant tests, and any AGENTS.md / GOTCHAS.md / CONSTITUTION.md excerpts that define expectations.

Treat this as the Orchestrator's `review`-mode alias.

If the review scope is ambiguous, ask the user to narrow it before continuing.

Review the following code for quality issues: $ARGUMENTS

Check for:

1. **Type safety** — Missing annotations, unnecessary `Any`, bare `dict`/`list`
2. **Architecture violations** — Domain importing infrastructure, business logic in routes, direct DB access outside repos
3. **Prohibited patterns** — Check against the prohibited patterns list in AGENTS.md
4. **Error handling** — Unhandled exceptions, bare `except`, missing error context
5. **Testing gaps** — Untested public methods, missing edge cases
6. **Documentation** — Missing docstrings on public APIs, outdated AGENTS.md
7. **File size** — Any files over 300 lines
8. **Security** — Hardcoded credentials, unsanitised input, SQL injection risks

For each issue found, report:
- **Severity**: critical / warning / suggestion
- **Location**: file[:line]
- **Issue**: What's wrong
- **Fix**: How to fix it

Only report issues you are confident about. Do not flag style preferences that ruff would handle. If the evidence bundle is too thin to support a confident finding, stop and request more context instead of guessing.
