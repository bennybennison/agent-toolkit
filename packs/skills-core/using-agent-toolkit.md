---
skill: using-agent-toolkit
scope: universal
profile: standard, full
tags: [meta, workflow, orientation, routing]
---

# Skill: Using Agent Toolkit

Use this when starting work in an agent-toolkit-enabled repo, when choosing the right top-level workflow, or when you are unsure which shared skill, command, or role should guide the task.

---

## What This Skill Is For

This skill helps you orient without forcing ceremony.

It exists to answer:

- what kind of task is this
- what top-level workflow should I use
- should I stay lightweight or switch into a more structured flow
- which shared skills are worth loading next

It does **not** require skill invocation before every reply, and it does **not** override clear user instructions.

## Core Rule

Prefer the lightest workflow that keeps the work clear and safe.

Use more structure when:

- the task is ambiguous
- the change is risky
- the work spans multiple subsystems
- the user explicitly wants rigor, planning, or checkpoints

Stay lighter when:

- the task is small and direct
- the user asked a straightforward question
- the next step is obviously a quick read, explanation, or narrow edit

## First Classification

Classify the request into one of these top-level workflows:

| Workflow | Use when | Typical next step |
|----------|----------|------------------|
| `session` | The user wants status, resume, closeout, loose-end review, or next steps | Use `Session-Manager` style behavior |
| `map` | The user wants repo fit, feasibility, placement, or existing-pattern discovery | Load mapping or exploration skills |
| `plan` | The user wants a structured implementation plan or strategy choice | Load planning-oriented skills |
| `build` | The user wants code changed now | Start with the smallest sufficient implementation flow |
| `repair` | The user has a bug, failure, inconsistency, or broken behavior | Load diagnosis-first skills |
| `review` | The user wants critique, risks, findings, or approval guidance | Use review-oriented skills |
| `wireframe` | The user wants outside-in, mock-data, or UI-first design work | Use outside-in or product-design skills |

If the request does not cleanly fit, pick the closest workflow and say why.

## Role Selection

The visible top-level roles are intentionally small:

- `Session-Manager`
  Use for start, resume, status, closeout, tidy-up, and next-step handoff.
- `Orchestrator`
  Use for broad task execution across `map`, `plan`, `build`, `repair`, `review`, and `wireframe`.

Hidden specialists may still exist, but they are implementation machinery, not the main thing to expose to the user.

## Choosing Shared Skills

Only load additional shared skills when they genuinely improve the task.

Good examples:

- `search-first`
  before building when existing solutions may already exist
- `idea-exploration`
  when the user has a rough idea, not a settled request
- `debugging-methodology`
  when the user has a bug or uncertain failure mode
- `verification-loop`
  when implementation is complete or a fix needs proof
- `progressive-disclosure`
  when context is large and you need to stay lean

Do not treat skill loading as ritual. Load a skill because it improves the task, not because you need to satisfy a ceremony.

## Interaction Style

Match the level of structure to the user's needs.

Use tighter confirmation when:

- the task is risky
- the plan is non-obvious
- edits would be expensive to undo
- the user wants active checkpoints

Use a lighter flow when:

- the task is narrow
- the user is clearly asking for direct action
- a brief answer or small change is enough

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Force a full planning ceremony for every small task | Use the lightest workflow that still keeps the task clear |
| Treat skill invocation as mandatory ritual | Load a skill when it materially improves the work |
| Expose a large roster of specialist roles first | Start with `Session-Manager` or `Orchestrator` |
| Ignore structure entirely on risky tasks | Add planning, repair, review, or checkpoint discipline when needed |
| Restate the entire system every time | Give a compact orientation and move into the task |

## Output

When this skill is actively used, produce a compact orientation:

- chosen top-level workflow
- whether `Session-Manager` or `Orchestrator` fits best
- any additional shared skill worth loading next
- whether the task should stay lightweight or use more structure

Then continue with the work.

---

## See Also

- [search-first](search-first.md)
- [progressive-disclosure](progressive-disclosure.md)
- [debugging-methodology](debugging-methodology.md)
- [verification-loop](verification-loop.md)
