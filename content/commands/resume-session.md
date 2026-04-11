---
description: Resume a previously saved session
---

# Resume Session Command

Treat this as a Session-Manager resume alias.

Load a previously saved session and continue from where it left off.

## Usage

`/resume-session [name]`

## Process

1. **Find session** — look in `{{SESSIONS_DIR}}/` for the named session file
2. **Load context** — read the session file and present a summary:

```
RESUMING SESSION: {name}
=======================
Saved: {date}
Branch: {branch}

Done so far:
- [completed items]

Next step:
[exact next step from the saved session]

Blockers: [any blockers]
```

3. **Verify state** — check that the current branch, files, and build state match expectations
4. **Continue** — execute the "Exact Next Step" from the saved session

## If State Has Diverged

If the current state doesn't match the saved session (different branch, files changed by others):
- Report the discrepancies
- Ask whether to proceed anyway or re-assess

## Listing Sessions

If no name is provided, list all saved sessions from `{{SESSIONS_DIR}}/`:

```
SAVED SESSIONS
==============
1. feature-auth (2024-01-15) — branch: feature/auth
2. refactor-db (2024-01-14) — branch: refactor/database
3. bugfix-login (2024-01-13) — branch: fix/login-redirect
```

$ARGUMENTS
