---
name: "multi-perspective-analysis"
description: "Analyze code or decisions from multiple specialist viewpoints to catch blind spots."
pack: "skills-planning"
---

# Skill: Multi-Perspective Analysis

Analyze code or decisions from multiple specialist viewpoints to catch blind spots.

---

## When to Use

- Reviewing architecture decisions that affect multiple concerns
- Code review of security-sensitive or complex changes
- Evaluating a plan before implementation
- Post-incident analysis to understand what went wrong

## Why Single-Perspective Fails

A single reviewer optimizes for one concern and misses others:
- A performance reviewer might approve an insecure cache
- A security reviewer might reject an optimization that's actually safe
- A style reviewer might miss a logic bug

## Process

### 1. Select Perspectives

Choose 2-4 perspectives based on the situation. Don't always use all of them.

| Perspective | Focus | Use When |
|-------------|-------|----------|
| **Correctness** | Does it do what it claims? Logic bugs, edge cases, off-by-ones | Always |
| **Architecture** | Does it follow project patterns? Dependency direction, layer violations | Changes spanning multiple layers |
| **Security** | Injection, auth, data exposure, secrets | External input handling, auth flows |
| **Performance** | N+1 queries, unnecessary allocations, blocking calls | Data processing, API endpoints |
| **Maintainability** | Can future-you understand this? Naming, complexity, coupling | Large changes, new patterns |
| **Testing** | Is it testable? Are the right things tested? | New features, refactors |

### 2. Analyze Sequentially

For each selected perspective, do a focused review pass:

1. State the perspective you're reviewing from
2. Evaluate the code/decision through that lens only
3. Rate findings by confidence (high/medium/low)
4. Only report high-confidence issues

### 3. Synthesize

After all perspectives are reviewed:

- Identify conflicts between perspectives (e.g. security vs performance)
- For each conflict, recommend the safer default
- Prioritize findings: security > correctness > architecture > performance > maintainability
- Produce a single ranked list of actionable items

## Output Format

```
## Multi-Perspective Review: {Subject}

### Correctness
- {Finding with confidence level}

### Architecture
- {Finding with confidence level}

### {Other selected perspectives}
- {Finding with confidence level}

### Synthesis
**Conflicts:** {Any perspective conflicts and resolution}
**Priority Actions:**
1. {Highest priority action}
2. {Next priority action}
```

## Integration with Agents

This skill can be used with the existing agents:

- `@code-reviewer` — Handles correctness and maintainability
- `@architect` — Handles architecture perspective
- Manual review — Security and performance when automated tooling is insufficient

For critical changes, run `@code-reviewer` and `@architect` in sequence, then synthesize their outputs.

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Apply all 6 perspectives to every change | Select 2-4 relevant ones |
| Report low-confidence findings | Only report what you're confident about |
| Let one perspective dominate | Synthesize and prioritize across all |
| Skip the synthesis step | Conflicts between perspectives are the most valuable findings |
