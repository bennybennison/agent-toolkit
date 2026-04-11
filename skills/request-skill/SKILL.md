---
name: "request-skill"
description: "Meta-skill for recognizing when a new skill is needed and initiating its creation. This is the \"demand side\" -- it identifies gaps and articulates the need. The \"supply side\" is [skill-creator](../skill-creator/SKILL.md), which handles the actual authoring. Without a deliberate demand process, skill creation is reactive and ad hoc, leading to gaps in common workflows and over-investment in rare ones."
pack: "skills-core"
---

# Skill: Requesting a New Skill

Meta-skill for recognizing when a new skill is needed and initiating its creation. This is the "demand side" -- it identifies gaps and articulates the need. The "supply side" is [skill-creator](../skill-creator/SKILL.md), which handles the actual authoring. Without a deliberate demand process, skill creation is reactive and ad hoc, leading to gaps in common workflows and over-investment in rare ones.

---

## When to Use

- You have done the same multi-step workflow 3+ times manually
- You have made the same mistake twice and no skill exists to prevent it
- A friction log entry keeps recurring
- An existing skill is too broad and needs splitting
- You find yourself writing the same GOTCHAS.md entry across multiple projects

## Gap Identification Process

Follow these steps in order. The goal is to distinguish between genuine skill gaps, one-off annoyances, and problems better solved by other mechanisms.

### 1. Notice the Friction

Something is harder than it should be, takes too many steps, or you keep making the same mistake. The key signal is repetition -- a one-time annoyance is not a skill gap.

### 2. Check Existing Skills

Before requesting a new skill, verify the gap is real:

```bash
# Search skill names and tags
rg "skill:.*keyword" skills/
rg "tags:.*keyword" skills/

# Read potentially related skills fully
cat skills/related-skill.md
```

If a skill already covers the topic but misses your specific case, the right action is enrichment (adding to the existing skill), not creating a new one.

### 3. Check Existing Rules

Not everything should be a skill. Use this distinction:

| Mechanism | Purpose | Example |
|-----------|---------|---------|
| **Rule** (in AGENTS.md) | A single constraint or prohibition | "Never use `Any` without a comment" |
| **GOTCHAS.md entry** | A one-off lesson learned | "The X API returns 200 on auth failure" |
| **Skill** | A multi-step repeatable workflow | "How to audit dependencies" |

If the gap is a single rule, add it to the appropriate AGENTS.md. If it is a one-off lesson, add it to GOTCHAS.md. Skills are for workflows.

### 4. Define the Scope

Answer these questions to shape the potential skill:

- **What would trigger it?** (Be specific -- vague triggers mean agents never activate it)
- **What steps would it contain?**
- **What would be out of scope?**
- **What existing skills are adjacent?**

### 5. Assess Value

Not every skill gap justifies immediate creation. Prioritize based on frequency and scope:

| Frequency | Scope | Priority | Action |
|-----------|-------|----------|--------|
| Daily | All projects | Critical | Create immediately |
| Weekly | All projects | High | Create soon |
| Daily | One project | Medium | Project-level AGENTS.md rule |
| Rarely | All projects | Low | Add to backlog |
| Rarely | One project | Minimal | GOTCHAS.md entry |

## Friction Log Workflow

When you notice friction but do not have time to create a skill, capture it so it is not lost.

1. **Add entry to `FRICTION_LOG.md`** with date and description
2. **Tag with category**: `[tooling]`, `[workflow]`, `[knowledge]`, `[architecture]`
3. **Include "ideal behavior"** -- describe what SHOULD have happened, not just what went wrong
4. **Review friction log monthly** -- patterns of repeated entries become skill candidates

Example entry:

```markdown
## 2025-01-15 [workflow]

**Friction**: Spent 20 minutes figuring out the right uv commands to audit
dependencies for the third time this month.

**Ideal behavior**: A skill should walk me through the full audit workflow
with the exact commands and what to look for in the output.

**Related**: security-review skill covers vulnerability scanning but not
the broader dependency health audit.
```

## Backlog to Skill Pipeline

Skill requests move through a pipeline. Each stage filters out noise so only valuable skills get created:

```
1. Friction log entry       -- raw observation, unvalidated
2. Backlog item             -- confirmed pattern (not a one-off)
3. Skill request            -- defined scope, trigger, and value assessment
4. Skill creation           -- using skill-creator skill
5. Registration and testing -- added to opencode.json, tested against real scenario
```

## Request Template

When a gap passes the value assessment, file it using this template:

```
Skill Request: {name}
Problem:  What keeps going wrong or taking too long?
Trigger:  When should this skill activate?
Scope:    What would it cover? What is out of scope?
Related:  Existing skills that are adjacent
Value:    How often would it be used? Across how many projects?
```

## Anti-Patterns

| Don't | Why | Do Instead |
|-------|-----|------------|
| Create a skill for a one-time task | Skills are for repeatable workflows | Use GOTCHAS.md for one-off lessons |
| Request a skill when a GOTCHAS.md entry suffices | Over-engineering the knowledge system | Match the mechanism to the problem |
| Let friction accumulate without documenting it | Patterns become invisible if not recorded | Log friction immediately, review monthly |
| Create skills preemptively before experiencing friction | Speculative skills are often wrong about what matters | Wait for real friction, then generalize |
| Request a skill without checking existing ones | Leads to duplication and conflicting guidance | Always search skills/ first |

---

## See Also

- [skill-creator](../skill-creator/SKILL.md) -- the supply side: how to actually author a new skill
- [continuous-learning](../continuous-learning/SKILL.md) -- broader system for capturing and applying lessons
- [document-ownership](../document-ownership/SKILL.md) -- who maintains which governance documents
