---
skill: eval-driven-development
scope: universal
profile: standard, full
tags: [testing, evals, quality, validation]
---

# Skill: Eval-Driven Development

Validate agent behaviour changes by defining expected outcomes before making changes.

---

## When to Use

- Adding a new rule, skill, or agent to the framework
- Modifying an existing prompt or instruction
- After extracting a pattern via continuous learning
- When behaviour is inconsistent and you need to measure improvement

## Core Principle

Eval-driven development (EDD) is TDD for agent behaviour. Instead of testing code correctness, you test whether the agent's output matches desired patterns.

```
1. Define expected behaviour (the eval)
2. Verify current behaviour fails or is inconsistent
3. Make the change (new rule, skill, prompt)
4. Verify behaviour now matches expectations
5. Check for regressions in related areas
```

## Eval Types

### Capability Eval

"Can the agent do X?"

Test whether a new skill or rule enables the desired behaviour.

```markdown
## Eval: {Skill Name} Capability

**Input:** {Prompt or scenario that should trigger the new behaviour}
**Expected:** {What the agent should do or produce}
**Pass criteria:** At least 1 success in 3 attempts (pass@3)
```

### Regression Eval

"Does Y still work after the change?"

Test whether existing behaviour is preserved after adding something new.

```markdown
## Eval: {Area} Regression

**Input:** {Prompt that previously worked correctly}
**Expected:** {Same output as before the change}
**Pass criteria:** All 3 attempts must succeed (pass^3)
```

## Process

### 1. Write the Eval

Before making any change, define what "working" looks like:

- What prompt or scenario triggers the behaviour?
- What should the agent do or produce?
- What should the agent NOT do?
- How many attempts should succeed? (capability: pass@k, regression: pass^k)

### 2. Baseline

Run the eval against the current state to establish a baseline:

- If it already passes, the change may not be needed
- If it fails, you have a clear before/after comparison

### 3. Make the Change

Add the rule, skill, command, agent, or hook.

### 4. Verify

Run the eval again:

- Capability eval should now pass
- All regression evals should still pass

### 5. Document

Record the eval result in the commit message or PR description.

## Grading

| Method | Use When | Example |
|--------|----------|---------|
| **Structural** | Output must contain/exclude specific elements | "Response must include a type annotation for every function" |
| **Behavioural** | Agent must take or avoid specific actions | "Agent must read AGENTS.md before writing code" |
| **Qualitative** | Output quality matters, not just structure | "Code review must identify the security vulnerability" |

## Practical Application

For most framework changes, formal eval infrastructure is overkill. Instead:

1. **Manual spot-check:** After adding a new rule, give the agent a task that should trigger it. Does it follow the rule?
2. **Regression check:** Give the agent a task that previously worked. Does it still work?
3. **Document the check:** Note what you tested in the commit message.

This scales to formal eval suites if needed, but start simple.

## Checklist

- [ ] Expected behaviour is defined before making the change
- [ ] Baseline is established (current pass/fail state)
- [ ] Change is applied
- [ ] Capability eval passes
- [ ] Regression check passes for related areas
- [ ] Result is documented

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Skip evals "because it's a small change" | Even small rule changes can have unexpected effects |
| Only test the happy path | Test edge cases and the negative case (what should NOT happen) |
| Build a formal eval framework before you have 10+ evals | Start with manual spot-checks, formalize later |
| Eval style/formatting preferences | Let ruff handle style, eval behaviour and correctness |
