---
rule: security
scope: universal
profile: all
tags: [security, credentials, secrets]
---

# Security Rules

## Secrets Management

- Never hardcode credentials, API keys, tokens, or passwords
- Use typed configuration objects or settings layers instead of scattered env lookups
- Keep plaintext local env files out of version control
- Prefer encrypted or managed secrets workflows for shared or deployed environments

## File Safety

| File | Commit? |
|------|---------|
| `.env` | No |
| `.env.example` | Yes |
| encrypted secret bundle | Yes, if the workflow supports it safely |
| decryption keys | Never |

## Prohibited

- Secrets in source code, comments, examples, or docs
- Direct unchecked environment lookups scattered through business logic
- Committing plaintext secret files
- Treating local development shortcuts as production-safe patterns

## Input Validation

- Validate external input at boundaries
- Use parameterized queries for database access
- Sanitize file paths
- Validate URL schemes and remote targets

## Dependencies

- Review new dependencies before adding them
- Prefer pinned or bounded versions in serious projects
- Keep security linting and checks in the normal verification path
