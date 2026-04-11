---
skill: prompt-optimizer
scope: universal
profile: standard, full
tags: [meta, authoring, prompt-engineering, quality]
---

# Skill: Optimizing Prompts for Agent Instructions

Modern LLMs respond better to reasoning and context than rigid commands. A prompt
that explains WHY a rule exists is more reliably followed than one that demands
compliance through capitalization and threats. Use this skill when writing or
refining any agent-facing text: skills, rules, AGENTS.md, or system prompts.

---

## When to Use

- Writing new skills or rules for the framework
- Refining existing skills that agents follow inconsistently
- Debugging why an agent keeps ignoring a specific instruction
- Reviewing framework files for quality before shipping

## The Optimization Process

Follow these steps in order. Skipping steps 1-2 is the most common cause of
prompts that agents ignore.

### 1. Identify the Intent

Be specific about what behavior you want. "Write good code" is not an intent --
"use logging instead of print in library modules" is.

| Vague Intent | Specific Intent |
|--------------|-----------------|
| Handle errors properly | Return Result types for expected failures, raise exceptions for unexpected ones |
| Write clear tests | Name tests `test_{method}_{scenario}_{expected}` with one assertion per test |
| Use the right model | Route mechanical tasks to fast tier, complex reasoning to premium tier |

### 2. Explain the Reasoning

This is the single highest-leverage improvement you can make. Agents that
understand WHY a rule exists make better judgment calls in ambiguous situations
where the rule doesn't perfectly apply.

### 3. Show Examples

Concrete examples beat abstract descriptions every time. Show both the good and
the bad, so the agent can pattern-match against real situations.

### 4. Add Decision Trees

When multiple approaches are valid, guide the choice. Agents perform poorly when
told "use your judgment" without any criteria for that judgment.

### 5. Test with Edge Cases

Run the prompt against ambiguous situations. Does it produce the right behavior
when the situation is not clear-cut? If not, add guidance for the gray areas.

### 6. Measure Compliance

Track when the agent follows vs ignores the instruction. Low compliance usually
means the prompt is unclear, buried, or conflicting with something else --
not that the agent is "refusing."

## Prompt Writing Patterns

### Pattern 1 -- Reasoning Over Commands

Commands without reasoning are brittle. The agent follows them literally in
common cases but breaks in edge cases because it has no understanding of intent.

```markdown
<!-- Brittle -->
NEVER use print() in library code.

<!-- Resilient -->
Use logging.getLogger(__name__) instead of print() in library code --
logging supports levels, filtering, and structured output that print()
cannot provide. print() is fine in CLI entrypoints where direct console
output is the intended interface.
```

### Pattern 2 -- Decision Trees Over Blanket Rules

When a rule has exceptions, encode the decision logic explicitly:

```markdown
<!-- Ambiguous -->
Use the right model for the task.

<!-- Clear -->
Task routing:
- Mechanical tasks (formatting, renaming, boilerplate) -> Fast tier
- Standard development (features, bug fixes, tests) -> Standard tier
- Architecture, debugging complex issues, security review -> Premium tier
```

### Pattern 3 -- Examples Over Descriptions

People learn syntax from examples, not from grammar specifications. Agents
work the same way.

```markdown
<!-- Abstract -->
Write clear, imperative commit messages that explain the change.

<!-- Concrete -->
Good: "Add cursor-based pagination to /orders endpoint"
Bad: "fix stuff", "update code", "changes"
```

### Pattern 4 -- Progressive Disclosure

Put the most important information first. Details and edge cases come later.
Agents may not retain instructions at the end of a very long prompt --
especially after compaction. Front-load what matters most.

## Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|--------------|-------------|-----|
| ALL CAPS for emphasis | Signals panic, not importance; models don't weight caps more heavily | Use **bold** or concrete examples |
| Double negatives ("NEVER don't forget...") | Ambiguous parsing for both humans and models | State the positive: "Always do X" |
| Contradictory instructions across files | Agent picks one arbitrarily or freezes | Resolve conflicts using document hierarchy |
| Wall of text without structure | Key instructions get lost in noise | Add headings, tables, and lists |
| Threatening tone ("you WILL be penalized") | Models don't respond to threats; it just wastes tokens | State the desired behavior and why it matters |
| Extremely long instructions (500+ lines) | Exceeds effective attention; tail content is ignored | Split into multiple focused documents |

## Compliance Debugging

If an agent is not following a rule, work through this checklist before
rewriting the prompt:

1. **Is the rule in the active context?** Check instruction loading -- the rule
   may not be in the files the agent actually reads for this task.
2. **Does it conflict with another rule?** Search all loaded instructions for
   contradictions. Conflicts cause unpredictable behavior.
3. **Is it too abstract?** Add a concrete example of the desired behavior.
   Abstract rules produce abstract compliance.
4. **Is it buried?** Move the rule higher in the document, or give it its own
   heading. Instructions at the bottom of long files are the first to be
   forgotten after compaction.
5. **Does the agent understand WHY?** Add reasoning. An agent that understands
   the purpose of a rule will follow it even in situations the rule author
   did not anticipate.

## Quality Checklist

Before shipping a new prompt, skill, or rule:

- [ ] Every rule includes reasoning (the "why")
- [ ] Abstract rules are paired with concrete examples
- [ ] No ALL CAPS used for emphasis
- [ ] No contradictions with other loaded instructions
- [ ] Most important instructions appear in the first half
- [ ] Decision trees used where multiple approaches are valid
- [ ] Total length under 200 lines

## See also

- `skill-creator` -- the workflow for creating new skills (this skill helps write better ones)
- `progressive-disclosure` -- the layered context loading model that determines what agents read
