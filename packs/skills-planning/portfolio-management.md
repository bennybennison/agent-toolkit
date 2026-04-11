---
skill: portfolio-management
scope: universal
profile: standard, full
tags: [portfolio, monorepo, planning, visibility, beads]
---

# Skill: Portfolio Management

Manage monorepo work as visible portfolio, app, feature, and task layers instead of a flat stream of chat requests.

---

## When to Use

Use this skill when:

- a repo contains multiple apps, services, or business capabilities
- the user wants better human visibility over features and tasks
- Beads is being used but work still feels too abstract
- the agent needs to decide whether a request is portfolio, app, feature, or task scope

## The Four Layers

### 1. Portfolio

Use for:

- prioritizing across apps
- sequencing initiatives
- deciding what not to work on yet

Artifacts:

- portfolio status
- roadmap or initiative list
- cross-app priorities

### 2. App / Area

Use for:

- ownership boundaries
- architecture decisions inside one app
- focused working context

Artifacts:

- monorepo map
- area `AGENTS.md`
- `/focus <area>`

### 3. Feature

Use for:

- user-visible capability
- work that spans multiple files
- changes that need planning before implementation

Artifacts:

- `/plan`
- parent Beads task or epic
- checkpoints

### 4. Task

Use for:

- concrete implementation step
- bug fix
- test addition
- refactor slice

Artifacts:

- child Beads task
- TodoWrite for short-lived in-session steps

## Workflow

### 1. Classify the Request

Before acting, decide which level the work belongs to:

- Portfolio: "Which app should we build next?"
- App: "How should print-assistant be structured?"
- Feature: "Add listing bulk edit support"
- Task: "Fix date parsing in the Shopify connector"

If the request mixes levels, separate them before implementing.

### 2. Select the Area

For monorepo work:

1. Read the monorepo map
2. Pick the target area
3. Use `/focus <area>` if applicable
4. Name any additional affected areas explicitly

If the request touches more than one area, say so before making changes.

### 3. Plan Before Feature Work

If the work is feature-sized or cross-area:

1. Run `/plan`
2. Save the plan
3. Wait for approval unless the user explicitly asked you to proceed autonomously

Do not collapse plan and implementation into one step by default.

### 4. Create Visible Tasks

When using Beads, create tasks that encode structure:

```bash
bd create "Add listing bulk editor" -t epic -p 1
bd create "Build channel sync adapter" -p 1
bd create "Add listing edit UI" -p 1
```

Recommended labels:

- `app:{name}`
- `feature:{name}`
- `type:feature|bug|chore`
- `business:{name}` only when the repo explicitly spans multiple businesses

If labels are supported in your Beads workflow, apply them consistently.
If `bv` is available, treat these labels as the primary grouping keys for human visibility.

Before locking the plan, ask for any missing metadata that a human would need to recognize the work later:

- target area
- feature name
- work type
- whether to stop after planning for approval

### 5. Maintain Human Visibility

Use these surfaces regularly:

- `/bd status` for ready and in-progress tasks
- `/bd-view triage` for backlog visibility
- `/bd-view portfolio` for app/feature grouping when labels are present
- `/status` for current operational state
- `/portfolio-status` for app-by-app overview
- `/optimise` and `/optimise-compare` for framework effectiveness

## Decision Rules

| Situation | Do This |
|-----------|---------|
| New feature in one app | `/focus` -> `/plan` -> Beads tasks -> implement |
| Cross-app feature | name affected areas -> `/plan` -> approval -> implement |
| Portfolio reprioritization | `/portfolio-status` first, then update priorities |
| Small bug in one file | task-level work; plan may be unnecessary |
| User wants visibility | prefer `bv`, `/bd-view`, `/status`, `/portfolio-status` |

## Checklist

- [ ] Request classified as portfolio, app, feature, or task
- [ ] Target area identified
- [ ] Planning gate used for feature-sized work
- [ ] Tasks are visible in Beads with meaningful structure
- [ ] Human visibility surface used before major execution

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Treat the whole monorepo as one backlog | Group work by app and feature |
| Start feature implementation immediately | Plan first and wait for approval |
| Hide structure in chat only | Persist it in Beads, plans, and status commands |
| Let agents roam across apps silently | Name the target area and affected boundaries |
