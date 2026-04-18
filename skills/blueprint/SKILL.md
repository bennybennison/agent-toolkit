---
name: "blueprint"
description: "Turn a one-line objective into a step-by-step construction plan where every step has a self-contained context brief. Designed for work that spans multiple sessions or agents."
pack: "skills-planning"
---

# Skill: Blueprint — Multi-Session Planning

Turn a one-line objective into a step-by-step construction plan where every step has a self-contained context brief. Designed for work that spans multiple sessions or agents.

## When to Use

- Features that will take more than one session to implement
- Work that needs to survive context compaction
- Tasks that will be executed by different agents or in different sessions
- Complex refactors with multiple dependent steps

## Pipeline

### Phase 1: Research

Explore the codebase to understand:
- Current architecture and patterns
- Existing code that relates to the objective
- Dependencies and constraints
- What already exists vs what needs to be built

### Phase 2: Design

Break the objective into ordered steps with:
- Dependencies between steps (what must be done first)
- Parallel steps (what can be done simultaneously)
- Risk assessment per step (what could go wrong)

### Phase 3: Draft the Blueprint

Use the `plan` contract as the durable structure:

- contract definition: `contracts/plan/CONTRACT.md`
- writing scaffold: `contracts/plan/TEMPLATE.md`

Create a blueprint document with cold-start briefs:

```markdown
## Blueprint: {Objective}

Created: {date}
Profile: {minimal|standard|full}
Estimated steps: {N}

### Step 1: {Title}

**Brief:** Self-contained description that a fresh agent session
can execute without any prior context. Include:
- What to do
- Which files to read first
- Which patterns to follow
- What "done" looks like

**Depends on:** none
**Parallel with:** Step 2
**Risk:** {low|medium|high} — {why}
**Verification:** How to confirm this step is complete

### Step 2: {Title}
...
```

### Phase 4: Adversarial Review

Before executing, review the blueprint for:
- Missing steps (what did we forget?)
- Wrong ordering (dependency violations)
- Steps that are too large (should be split)
- Steps that are too vague (would a fresh agent know what to do?)
- Missing verification criteria

### Phase 5: Register

Save the blueprint to `{{BLUEPRINTS_DIR}}/{name}.md` or `plan/blueprints/{name}.md`.

## Cold-Start Execution

The key insight: **every step must be executable by a fresh agent session with zero prior context.**

Each step brief must contain:
1. What to do (the task)
2. What to read first (files for context)
3. What patterns to follow (link to AGENTS.md or skills)
4. What "done" looks like (verification)

If a step brief says "continue from where we left off," it is not self-contained. Rewrite it.

## Plan Mutation

Blueprints are living documents. During execution, steps may need to change:

- **Split** — step is too large, break it into sub-steps
- **Insert** — discovered a missing step during execution
- **Skip** — step is no longer needed
- **Reorder** — dependencies changed
- **Abandon** — objective changed

Log all mutations with rationale in the blueprint.

## Anti-Patterns

- Steps that depend on session context ("remember what we discussed")
- Steps without verification criteria
- Blueprints with no adversarial review
- Steps that are too granular (10-line changes don't need blueprints)
- Blueprints for work that fits in a single session

---

## See Also

- [spec-lifecycle](../spec-lifecycle/SKILL.md) — Spec management through lifecycle states
