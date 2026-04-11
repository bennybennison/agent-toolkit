---
name: "strategic-compact"
description: "What to preserve and what to discard when context gets large."
pack: "skills-core"
---

# Skill: Strategic Compaction

What to preserve and what to discard when context gets large.

---

## When to Compact

- Context window is getting full (agent signals this)
- Session has accumulated many file reads that are no longer relevant
- You've completed a major subtask and are moving to a new one

## What Must Survive Compaction

### Always Preserve

1. **Active task list** — current todos and their status
2. **Key decisions made** — architecture choices, user preferences
3. **Files modified** — list of files changed in this session
4. **Current working context** — what you're doing right now
5. **User constraints** — things the user explicitly said to do or not do
6. **Gotchas discovered** — non-obvious issues found during the session

### Safe to Discard

1. **Full file contents** that have been read — you can re-read them
2. **Search results** from exploration — you can re-search
3. **Tool output** from completed subtasks
4. **Intermediate reasoning** for decisions already made
5. **Error messages** from issues already fixed

## Compaction Strategy

### Before Compacting

1. Write a summary of what's been accomplished
2. List all files modified with one-line descriptions
3. Note any open issues or blockers
4. Record the current task and next steps

### Format

```markdown
## Session State

### Accomplished
- Implemented X in `path/to/file.py`
- Fixed Y in `path/to/other.py`

### Files Modified
- `src/domain/order.py` — added validate_total method
- `tests/test_order.py` — added 3 tests for validation

### Key Decisions
- Chose to extend existing OrderService rather than creating new class
- User wants MySQL, not PostgreSQL for this project

### Current Task
Working on: [description]
Next step: [what to do next]

### Open Issues
- Rate limiting not yet handled in connector
```

## Trigger-Table Lazy Loading

For large projects, don't load everything at session start. Use this priority:

| Priority | Load When |
|----------|-----------|
| **Immediate** | AGENTS.md for the target package |
| **On demand** | SKILL.md when you need to call a method |
| **On demand** | CONSTITUTION.md when making architecture decisions |
| **On demand** | GOTCHAS.md when you hit a confusing issue |
| **Never preload** | Specs, ADRs, friction logs — search when needed |

---

## See Also

- [progressive-disclosure](../progressive-disclosure/SKILL.md) — Tiered information structure
