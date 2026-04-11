---
description: Save current session state for resuming later
---

# Save Session Command

Treat this as a Session-Manager close-and-capture alias.

Save the current session's state so it can be resumed in a future session with full context.

## Usage

`/save-session [name]`

## Process

1. **Capture state** — gather the following into a structured document:

```markdown
## Session: {Name}
Date: {date}
Branch: {current branch}
SHA: {current commit}

### What Was Done
- [completed task 1]
- [completed task 2]

### What Worked (with evidence)
- [approach that worked] — verified by [test/build/manual check]

### What Didn't Work (and why)
- [failed approach] — failed because [reason]

### What Hasn't Been Tried
- [alternative approach not yet explored]

### Decisions Made
- [decision] — rationale: [why]

### Current State
- Files modified: [list]
- Tests: [passing/failing count]
- Build: [status]

### Blockers
- [blocker, if any]

### Exact Next Step
[Specific, actionable next step a fresh session can execute immediately]
```

2. **Save** — write to `{{SESSIONS_DIR}}/{name}.md`
3. **Report** — confirm save with session name and path

## Key Principle

The "Exact Next Step" must be cold-start executable — a fresh session with zero context should be able to pick up from this point by reading only this file.

$ARGUMENTS
