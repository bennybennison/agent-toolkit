---
name: "agent-orchestration"
description: "Patterns for chaining agents into structured workflows with handoff documents between stages."
pack: "skills-planning"
---

# Skill: Agent Orchestration

Patterns for chaining agents into structured workflows with handoff documents between stages.

## When to Use

- Multi-step work that benefits from specialised agents at each stage
- Features, bug fixes, or refactors that need planning, implementation, AND review
- Work where author-bias elimination matters (reviewer should not be the implementer)

## Pipeline Types

### Feature Pipeline

```
@audit-planner --> implement --> @cleanup --> @code-reviewer
```

1. **@audit-planner** — break down the feature, identify risks, define acceptance criteria
2. **Implement** — write the code (primary agent)
3. **@cleanup** — de-sloppify pass (remove debug code, dead imports, over-defensive checks)
4. **@code-reviewer** — review for quality, security, architecture compliance

### Bug Fix Pipeline

```
reproduce --> diagnose --> fix --> @code-reviewer
```

1. **Reproduce** — confirm the bug exists with a failing test or reproduction
2. **Diagnose** — find root cause (not just symptoms)
3. **Fix** — minimal change to fix the bug + regression test
4. **@code-reviewer** — verify fix is correct and complete

### Refactor Pipeline

```
@architect --> implement --> @cleanup --> @code-reviewer --> /verify
```

1. **@architect** — evaluate the refactoring approach, identify risks
2. **Implement** — make the changes
3. **@cleanup** — remove dead code, fix imports
4. **@code-reviewer** — verify no behaviour changes
5. **/verify** — full verification loop (build, types, lint, tests)

## Handoff Document

When passing work between agents, create a structured handoff:

```markdown
## Handoff: {From Agent} -> {To Agent}

### Context
What was done and why.

### Files Changed
- `path/to/file.py` — description of change

### Decisions Made
- Decision 1 and rationale
- Decision 2 and rationale

### Open Questions
- Question 1
- Question 2

### Next Steps
What the receiving agent should do.
```

When the receiving agent does not have direct repo-read tools, attach a compact evidence bundle alongside the handoff:

- Relevant file paths
- Targeted excerpts or diffs with line numbers when available
- Applicable tests and current failures
- AGENTS.md / GOTCHAS.md / CONSTITUTION.md snippets that define constraints
- Explicit scope boundaries and open questions

## Key Principles

1. **Author-bias elimination** — the agent that wrote code should not review it. Use separate agent invocations (separate context windows) for implementation and review.
2. **Structured handoffs** — never assume the next agent has context. Always pass a handoff document.
3. **Bundle the evidence** — if a specialist is tool-limited, include the exact code, docs, and file references it needs instead of asking it to explore blindly.
4. **Fail-fast** — if any stage fails, stop the pipeline. Do not proceed with broken state.
5. **Minimal scope** — each agent does one thing well. Do not ask the reviewer to also fix things.

## Anti-Patterns

- Running all stages in a single agent context (defeats author-bias elimination)
- Skipping the cleanup pass ("I'll clean up later" — you will not)
- Vague handoffs ("see the code changes" is not a handoff)
- Expecting a tool-limited specialist to discover missing code context on its own
- Continuing the pipeline after a stage fails

---

## See Also

- [autonomous-loops](../autonomous-loops/SKILL.md) — Single-agent self-directed work
