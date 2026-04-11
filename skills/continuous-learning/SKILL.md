---
name: "continuous-learning"
description: "Extract reusable patterns from sessions and codify them as framework additions."
pack: "skills-planning"
---

# Skill: Continuous Learning

Extract reusable patterns from sessions and codify them as framework additions.

---

## When to Use

- After resolving a non-obvious bug or issue
- When you discover a pattern the agent keeps getting wrong
- When a user correction reveals a reusable rule
- At the end of a significant session (triggered by `/learn`)

## Signal Types

Watch for these signals during a session:

| Signal | Example | What to Extract |
|--------|---------|-----------------|
| **User correction** | "No, use `uv` not `pip`" | Toolchain rule |
| **Error-then-fix** | mypy error -> fixed type annotation | Type safety pattern |
| **Repeated workflow** | Same 5 steps done 3+ times | Skill or command |
| **Explicit preference** | "Always use httpx" | Prohibited pattern |
| **Gotcha discovered** | API returns 200 on error | GOTCHAS.md entry |

## Process

### 1. Identify the Pattern

Ask: Is this a one-off fix or a reusable pattern? Criteria for reusable:

- Would this help in a different project?
- Would a new session benefit from knowing this?
- Has this come up more than once?

If no to all three, log it in GOTCHAS.md and stop. Don't over-extract.

### 2. Classify the Pattern

| Pattern Type | Goes Into | Example |
|-------------|-----------|---------|
| Constraint ("always/never") | Rule file in `rules/` | "Never use `requests`, use `httpx`" |
| Workflow ("how to do X") | Skill file in `skills/` | "How to split a large file" |
| Shortcut ("run X quickly") | Command in `commands/` | "Run all quality checks" |
| Persona ("act as X") | Agent in `agents/` | "Review code as a security expert" |
| Automation ("do X on event") | Hook in `hooks/` | "Auto-lint on file save" |
| Lesson ("X broke because Y") | GOTCHAS.md | "API returns 200 on auth failure" |

### 3. Check for Conflicts

Before adding a new pattern:

- Search existing rules/skills for overlap
- Check if an existing pattern contradicts the new one
- If conflict exists, the more specific pattern wins (package > project > global)

### 4. Create the Addition

Follow the contract in CONTRIBUTING.md for the target category:

- Use the stub template for the category
- Fill in all required frontmatter fields
- Follow the naming conventions
- Run the checklist for the category

### 5. Validate

- [ ] New file follows the contract in CONTRIBUTING.md
- [ ] No duplicate identifiers across the framework
- [ ] No contradictions with existing patterns
- [ ] Registered in `opencode.json` if it's a command or agent
- [ ] Registered via `{{CLI_COMMAND}} install` if it should be global

## Confidence Scoring

Not all patterns are equally proven. Use this scale when deciding whether to promote a pattern:

| Confidence | Criteria | Action |
|------------|----------|--------|
| Low (seen once) | Single occurrence, single project | Log in GOTCHAS.md only |
| Medium (seen 2-3x) | Repeated in one project, or seen in 2 projects | Create as project-level rule/skill |
| High (proven) | Seen in 3+ projects, or validated by testing | Promote to framework |

## Project Scoping

Instincts and patterns are scoped to prevent cross-project contamination. A React pattern from one project should not influence a CLI script in another.

### Scope Levels

| Scope | Stored In | Applies To |
|-------|-----------|------------|
| **Project** | Project's GOTCHAS.md or AGENTS.md | Only this project |
| **Global** | Framework's `rules/` or `skills/` | All projects |

### Promotion Criteria

A project-scoped pattern can be promoted to global when:
- Same pattern observed in 2+ projects
- Average confidence is High (proven)
- Pattern is not technology-specific (unless it's a language rule)

### "Do It Twice" Heuristic

1. **First time** — do it manually, move on
2. **Second time** — document it in the project's AGENTS.md or GOTCHAS.md
3. **Third time** — extract to a framework skill/rule with proper frontmatter

## Instinct Evolution

Patterns evolve through increasing confidence: `Observation → GOTCHAS.md → Project rule → Framework skill/rule`

**Evolution triggers:** Pattern reaches High confidence (3+ contexts), multiple related patterns can cluster into a single skill, or a workflow becomes complex enough for a command.

**Process:** Identify candidates → classify target category → extract and generalise → follow CONTRIBUTING.md contract → remove original project-level entries.

## Friction-to-Fix Loop

Turn the friction log from a passive record into an active improvement driver:

1. **Log** — when friction occurs, add to FRICTION_LOG.md
2. **Categorise** — tag each entry:
   - Quick Win (< 30 min to fix)
   - Medium Effort (1-4 hours)
   - Larger Refactor (> 4 hours)
3. **Review cadence:**
   - Weekly: fix Quick Wins
   - Monthly: address Medium Effort items
   - Quarterly: evaluate Larger Refactors

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Extract every user correction as a rule | Only extract patterns that are reusable across projects |
| Create rules for style preferences ruff handles | Let ruff handle formatting/style |
| Add a skill for a one-step operation | Use a command instead, or just document in AGENTS.md |
| Duplicate existing patterns with different wording | Extend or modify the existing pattern |
| Create hooks for things that should be manual | Only automate high-frequency, low-risk operations |
| Apply patterns from project A to project B blindly | Check project scoping before applying |
| Promote patterns to global too early | Wait for High confidence across multiple projects |
| Dump all session context into subagent prompts | Filter to relevant wisdom only |
| Skip capture because "I'll remember" | Write it down — compaction and new sessions won't |

---

## Session Wisdom — Subagent Handoff

When dispatching subagents, pass relevant session learnings to prevent repeated mistakes.

### Wisdom Categories

| Category | Example | Priority |
|----------|---------|----------|
| **Gotcha** | "API returns 200 on auth failure — check response body" | High |
| **Constraint** | "This project uses `uv`, not `pip`" | High |
| **Pattern** | "All connectors follow the 4-tier pattern" | Medium |
| **Decision** | "User chose SQLite over Postgres for this project" | Medium |
| **Preference** | "User prefers explicit imports over barrel files" | Low |
| **Discovery** | "The `process_order` function also handles refunds" | Medium |

### Handoff Template

When starting a new subagent that should inherit session wisdom:

```markdown
## Inherited Wisdom
### Must Know
- [Critical gotchas and constraints]
### Good to Know
- [Patterns and decisions]
### FYI
- [Preferences and discoveries]
```

### Filtering — Not Everything is Wisdom

Before passing a learning forward, ask:
1. Is it non-obvious? ("Python uses indentation" is not wisdom)
2. Would it prevent a mistake?
3. Is it specific enough to act on? ("Be careful with the API" is too vague)
4. Is it still true? (Code may have changed since the learning was captured)

---

## See Also

- [post-work-update](../post-work-update/SKILL.md) — Triggers learning capture at end of work
- [skill-creator](../skill-creator/SKILL.md) — How to create new skills when patterns are extracted
- [request-skill](../request-skill/SKILL.md) — How to identify when a new skill is needed
