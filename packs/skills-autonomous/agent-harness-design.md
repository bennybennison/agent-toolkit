---
skill: agent-harness-design
scope: universal
profile: full
tags: [agents, architecture, tools]
---

# Skill: Agent Harness Design

Principles for designing systems, tools, and APIs that agents can work with effectively.

## Core Model

An agent system has four components:
1. **Action space** — tools the agent can invoke
2. **Observation** — structured responses from tool invocations
3. **Recovery** — how errors are communicated and resolved
4. **Context budget** — how much context is available and how to use it

## Tool Design Principles

### Granularity

| Level | When to Use | Example |
|-------|-------------|---------|
| **Micro** | High-risk operations, need confirmation | `delete_record(id)` |
| **Medium** | Common operations, most tools | `edit_file(path, old, new)` |
| **Macro** | High-overhead setup, batch operations | `run_test_suite()` |

### Naming

- Use stable, descriptive names (verbs): `read`, `write`, `edit`, `search`
- Do not rename tools between versions
- Group related tools by prefix: `git_status`, `git_commit`, `git_diff`

### Input Design

- Schema-first: every input has a type and description
- Required vs optional is explicit
- Defaults are sensible and documented
- No ambiguous string parsing — use structured inputs

### Output Design

Every tool response should include:
- **Status** — success/failure/partial
- **Summary** — one-line human-readable result
- **Data** — the actual payload
- **Next actions** — what the agent can do next (implicit guidance)

## Error Recovery Contract

When a tool fails, the response must provide:
1. **Root cause hint** — what went wrong and why
2. **Safe retry instruction** — whether and how to retry
3. **Explicit stop condition** — when to give up and escalate

Bad: `Error: operation failed`
Good: `Error: file not found at src/foo.py. Check the path and try again. If the file was recently renamed, use Glob to find it.`

## Context Budgeting

- **Front-load critical context** — put the most important information in system prompts and early messages
- **Lazy-load details** — read AGENTS.md first, then SKILL.md, then source code
- **Summarise before passing** — when handing off between agents, summarise; do not pass raw context
- **Prune aggressively** — remove exploration results that led nowhere

## Anti-Patterns

- Tools that require multi-step setup before doing useful work
- Error messages without recovery hints
- Tools that return unbounded output (always paginate or truncate)
- Undocumented side effects (a "read" tool that modifies state)
- Tools that require implicit context ("use the same file as before")
