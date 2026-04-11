---
rule: git-workflow
scope: universal
profile: all
tags: [git, commits, branching]
---

# Git Workflow

## Commit Messages

Use imperative mood. Explain why the change matters, not just that files changed.

```text
Add inventory sync retry logic for rate-limited responses
Fix order status not updating after partial fulfillment
Refactor connector auth to share token refresh across channels
```

Avoid vague messages such as `Updated files`, `Changes`, or `Fix bug`.

## Commit Scope

- One logical change per commit
- Split refactoring from behavior changes when possible
- If one change spans many files across different concerns, consider multiple commits

## Branch Naming

```text
feature/inventory-sync-retry
fix/order-status-partial-fulfillment
refactor/connector-auth-shared-token
docs/update-agents-md-for-pricing
chore/upgrade-pydantic-v2
```

## Never Commit

Do not commit secrets, local env files, generated dependency directories, local editor settings, or transient databases unless the repo explicitly requires them.

## Pre-Commit Checks

Before committing, verify the checks that matter for the stack in this repo:

1. Lint passes
2. Formatting is correct
3. Type checks pass where applicable
4. Relevant tests pass
5. No credentials or env files are staged

## Pull Requests

- Use a clear title
- Explain the why
- Link to the relevant spec, issue, or discussion
- Review the diff before requesting review
