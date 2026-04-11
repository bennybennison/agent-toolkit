---
rule: documentation
scope: universal
profile: standard, full
tags: [documentation, agents-md, skill-md, governance]
---

# Documentation Standards

## Documentation Is Source Of Truth

Documentation defines what the system should do. Code implements it. When they disagree, update the one that is wrong instead of leaving them diverged.

## Hierarchy Of Truth

1. Specs define what is being built
2. ADRs explain why decisions were made
3. `AGENTS.md` explains how to work with the code
4. Code implements the chosen design

## Required Files

### All Profiles

| File | Location | Purpose |
|------|----------|---------|
| `AGENTS.md` | Package or area root | How to work with this code |

### Standard+ Profiles

| File | Location | Purpose |
|------|----------|---------|
| `GOTCHAS.md` | Project docs area | Lessons learned and non-obvious failures |

### Full Profile

| File | Location | Purpose |
|------|----------|---------|
| `CONSTITUTION.md` | Project docs area | Architecture principles and project philosophy |
| `FRICTION_LOG.md` | Project docs area | Process friction signals |
| `SKILL.md` | Package root | Capability/API reference for public packages |

## AGENTS.md vs SKILL.md

| | AGENTS.md | SKILL.md |
|---|-----------|----------|
| Question | How do I work here? | What can I call here? |
| Required | Every package or area | Packages with a public API |
| Contains | Purpose, files, patterns, gotchas, references | Capabilities, signatures, examples, config |
| Audience | Developer modifying the package | Developer consuming the package |

## Naming Convention

Use `SKILL.md` rather than `SKILLS.md`.

## AGENTS.md Template Shape

```markdown
# {Package Name}

> **Last Verified:** YYYY-MM-DD

## Purpose
{1-2 sentences}

## Key Files
| File | Responsibility |
|------|----------------|

## Dependencies
**Internal:** ...
**External:** ...

## Patterns
### Adding a New {Thing}
1. Step one
2. Step two

## Gotchas
- {Non-obvious behaviour}

## References
- [Spec](path/to/spec.md)
```

## Friction Log Triggers

Log to `FRICTION_LOG.md` when:

| Trigger | When |
|---------|------|
| `terminal-error` | A command exits non-zero |
| `file-search` | 3+ file reads were needed to find the target |
| `retry` | 2+ attempts were needed for the same operation |
| `schema-error` | SQL or data-contract assumptions were wrong |
| `debug-script` | A temporary debug script was created and discarded |
| `workaround` | An indirect workaround was required |

Do not log user requirement changes, intentional exploration, immediate typo fixes, or external service failures that are outside the project.

## Update Triggers

| Event | Update |
|-------|--------|
| Files added or removed | AGENTS.md key files section |
| Pattern changed | AGENTS.md patterns section |
| Public API changed | SKILL.md |
| Non-obvious issue found | GOTCHAS.md |
| Architecture decision | ADR |
| Friction event | FRICTION_LOG.md |
