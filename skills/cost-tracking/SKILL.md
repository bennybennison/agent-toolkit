---
name: "cost-tracking"
description: "Awareness of token usage and cost to make informed decisions about model selection, context management, and when to compact."
pack: "skills-core"
---

# Skill: Cost Tracking

Awareness of token usage and cost to make informed decisions about model selection, context management, and when to compact.

## Principles

1. **Track per-session** — know roughly how many tokens you've used and how much the session costs
2. **Model routing** — use the cheapest model that can handle the task (see `skills/model-routing.md`)
3. **Prompt caching** — system prompts and instruction files are cached; avoid unnecessary modifications
4. **Fail-fast on budget** — if a task is consuming disproportionate tokens, stop and re-evaluate approach

## Cost Awareness Rules

### When to Compact

- Context is filling up and the current work is well-defined
- You're about to start a new, unrelated task
- Research phase is complete and implementation is starting
- See `skills/strategic-compact.md` for what to preserve

### When to Use Subagents

- Exploratory research that may consume many tokens
- Tasks that don't need the full conversation context
- Parallel independent subtasks

### When to Stop and Re-Evaluate

- Same error has been attempted 3+ times (token waste)
- Exploring broad codebase without narrowing (use targeted search instead)
- Generating large amounts of code that will need to be rewritten

## Relative Model Costs (GitHub Copilot Pro+)

| Tier | Multiplier | Models | Use For |
|------|------------|--------|---------|
| Free | 0.33x | Gemini 3 Flash, Claude Haiku 4.5 | Simple lookups, formatting, verification, cleanup |
| Standard | 1x | Claude Sonnet 4.6, GPT-4.1 | Most development tasks (~90% of work) |
| Premium | 3x | Claude Opus 4.6 | Architecture decisions, complex debugging, adversarial review |
| Ultra | 30x | Claude Opus 4.5 | Manual selection only -- exceptional cases |

See `skills/model-routing.md` for the full decision framework.

## Token-Efficient Patterns

1. **Targeted reads** — read specific files/sections, not entire directories
2. **Grep before read** — find the right file first, then read it
3. **Batch operations** — make multiple independent tool calls in parallel
4. **Avoid re-reading** — reference files already in context instead of reading again
5. **Concise output** — shorter responses use fewer output tokens

## Anti-Patterns

- Reading every file in a directory "just in case"
- Repeatedly reading the same file across multiple tool calls
- Using premium models for simple tasks
- Generating verbose explanations when the user asked for code
- Re-exploring codebase context that was already gathered

---

## See Also

- [model-routing](../model-routing/SKILL.md) — Model selection with cost awareness
