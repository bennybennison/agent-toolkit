---
name: "post-work-update"
description: "After completing any work, update docs so the project keeps learning."
pack: "skills-core"
---

# Skill: Post-Work Update

After completing any work, update docs so the project keeps learning.

**Profile:** Required for `standard` and `full`. Skip for `minimal`.

---

## Quick Version (3 Questions)

1. **Did I change what files exist?** -> Update AGENTS.md key files table
2. **Did I change what the package can do?** -> Update SKILL.md
3. **Did I complete spec work?** -> Check off in spec

---

## Full Checklist

### 1. Code Quality

- [ ] All new functions have type hints
- [ ] No file exceeds 300 lines
- [ ] No prohibited patterns used
- [ ] Tests written for new functionality

### 2. Package Docs

| Trigger | Action |
|---------|--------|
| Added/removed/renamed a file | Update AGENTS.md key files table |
| Changed a pattern | Update AGENTS.md patterns section |
| Added/changed a public method | Update SKILL.md |
| Found a gotcha | Update AGENTS.md gotchas section |

### 3. Specs (`full` profile only)

| Trigger | Action |
|---------|--------|
| Completed a task | Check off in spec |
| Changed scope/behaviour | Update spec |
| Made architecture decision | Create ADR |

### 4. Epic Board Updates (`full` profile only)

When specs use an Epic README Board (e.g., `plan/specs/README.md`):

| Trigger | Action |
|---------|--------|
| Spec status changed | Update the board table row |
| New spec created | Add row to the board |
| Spec deprecated/removed | Mark as deprecated on board, do NOT delete row |
| Epic completed | Update epic status in board header |

### 5. Navigation Index Updates

If the project has a navigation index or master spec (`00_MASTER_SPEC.md`):

- Add new files to the index
- Remove deleted files from the index
- Update descriptions if file purpose changed
- Cross-reference related files that were touched together

### 6. Learning

| Trigger | Action |
|---------|--------|
| Hit unexpected issue | Add to GOTCHAS.md |
| Friction (3+ file reads, retries) | Log to FRICTION_LOG.md |
| Found reusable pattern | Consider creating a skill |
| Applied method in narrow way | Broaden: does this method apply to related areas? |

### Method Broadening

After finishing work, ask: "Did I solve this too narrowly?" Common signs:
- Fixed one instance of a bug that exists in similar code elsewhere
- Added a pattern that could benefit other modules
- Wrote a helper that belongs in a shared utility

If yes, either fix it now (if small) or log it as a follow-up task.

---

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Skip docs "I'll do it later" | Do it now — 2 min saves 20 min later |
| Update only the code | Code + docs are one deliverable |
| Duplicate info across docs | Write once, cross-reference |
| Forget to log friction | Log immediately — context fades fast |
| Fix one instance of a pattern bug | Check for the same bug in related code |

---

## See Also

- [spec-lifecycle](../spec-lifecycle/SKILL.md) — Spec state transitions and format
- [document-ownership](../document-ownership/SKILL.md) — Which docs to update when
- [continuous-learning](../continuous-learning/SKILL.md) — How to capture and promote learnings
