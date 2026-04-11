---
name: "skill-creator"
description: "This is the meta-skill -- it teaches how to build skills that AI agents can"
pack: "skills-core"
---

# Skill: Creating New Skills for the Agent Framework

This is the meta-skill -- it teaches how to build skills that AI agents can
activate and follow. Use this whenever you need to capture a repeatable workflow
as a new skill file.

## When to Use

- You notice a pattern you keep repeating across projects or conversations.
- A team member asks "how should we do X?" and the answer is a multi-step workflow.
- An existing skill is too broad and needs to be split.
- You want to formalize tribal knowledge into agent-usable guidance.

## Lifecycle

Follow these phases in order. Each phase has a clear deliverable before moving on.

### 1. Capture Intent

Answer three questions before writing anything:

| Question | Why It Matters |
|----------|---------------|
| What problem does this skill solve? | Prevents skills that exist for their own sake |
| What triggers it? | Determines if an agent will activate it at the right time |
| Who benefits? | Scopes the audience (all agents, Python-only, etc.) |

### 2. Interview

Ask clarifying questions -- even if you are the author. Cover:

- **Scope**: global, python, typescript, react?
- **Profile level**: does this apply at `minimal`, or only `standard`+?
- **Related skills**: what already exists that overlaps?
- **Edge cases**: when should this skill explicitly NOT apply?

### 3. Research

- Check the existing `skills/` directory for overlap. Two skills covering the
  same concern leads to conflicting guidance.
- Read `CONTRIBUTING.md` for the skill contract (frontmatter, structure, limits).
- If a related skill exists, decide: extend it, split it, or cross-reference it.

### 4. Draft

Write the skill following the structural contract:

```yaml
---
skill: kebab-case-name
scope: universal | python | frontend
profile: minimal | standard | full
tags: [relevant, tags]
---
```

- H1 title prefixed with `Skill: `.
- Keep under 200 lines. If you exceed this, the skill is too broad -- split it.
- Explain "why" alongside every rule. Agents that understand intent make better
  judgment calls in ambiguous situations.
- Use tables for quick-reference data (flags, mappings, checklists).
- Write procedurally (step-by-step workflows), not just declaratively (lists of rules).

### 5. Test

Apply the skill to a real scenario:

- Pick a recent task where this skill would have helped.
- Follow the skill's instructions literally. Note where you get stuck or confused.
- If you deviate from the skill, that is a signal the skill is wrong or incomplete.

### 6. Evaluate

| Criterion | Pass? |
|-----------|-------|
| Solves the stated problem | |
| Clear to someone seeing it for the first time | |
| Right granularity (not too broad, not too narrow) | |
| No duplication with existing skills | |
| Anti-patterns section included | |
| "See also" references present | |

### 7. Iterate

Refine based on evaluation. Common fixes:

- Reword the trigger description so agents activate it correctly.
- Add an anti-pattern you discovered during testing.
- Split an overloaded section into its own skill.

### 8. Register

- Add the skill entry to `opencode.json`.
- Update `README.md` if it lists available skills.
- Run `{{CLI_COMMAND}} install` to propagate changes.

## Granularity Guide

Getting the size right is the hardest part of skill authoring.

| Signal | Diagnosis | Action |
|--------|-----------|--------|
| Skill covers 3+ unrelated workflows | Too broad | Split into separate skills |
| Skill is < 30 lines with one rule | Too narrow | Fold into a rule file instead |
| Skill addresses one workflow completely | Right size | Ship it |

**Example -- too broad**: "how to write good code" (covers naming, testing,
architecture, error handling). Split into focused skills.

**Example -- too narrow**: "how to name boolean variables" (one rule, not a
workflow). Add it to a coding-standards rule file.

## Triggering Accuracy

The skill name and description determine when agents activate it. Test this:

1. Describe a task where the skill should activate.
2. Ask: "Would an agent reading this skill's name and tags pick it up?"
3. If not, rename or redescribe. A skill that never triggers is useless.

## Anti-patterns

- **Duplicating rules as skills.** Skills are workflows; rules are constraints.
  If it is a single constraint ("never use `Any` without a comment"), it belongs
  in a rule file, not a skill.
- **Micro-managing.** Skills should guide decisions, not dictate every keystroke.
  Leave room for judgment.
- **Missing anti-patterns section.** People learn as much from bad examples as
  good ones. Always show what NOT to do.
- **Forgetting cross-references.** Skills rarely exist in isolation. Link to
  related skills so agents can load additional context when needed.
- **Write-once skills.** Skills should evolve. If you have never revised a skill,
  you probably have never tested it in practice.

## See also

- `continuous-learning` -- how insights from work feed back into skills
