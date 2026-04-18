---
name: "beads-workflow"
description: "Use Beads (`bd`) as the durable task-management system for work that needs priorities, dependencies, status tracking, and cross-session continuity."
pack: "skills-autonomous"
---

# Skill: Using Beads

Use Beads (`bd`) as the durable task-management system for work that needs to survive session boundaries, compaction, and multi-agent handoffs. Beads stores tasks in a Dolt database (`.beads/`) with priorities, dependencies, status, and audit trails.

Use this skill when the user mentions:

- `Beads`
- `bd`
- durable task tracking
- backlog management across sessions
- dependency-aware work planning
- resuming tracked work after compaction or handoff

Do not use this skill for a tiny one-shot checklist that can be handled entirely in the current session.

## When to Use Beads vs Other Tools

| Situation | Use This |
|-----------|----------|
| Tracking what to do next | `bd ready` |
| Multi-step implementation plan | `bd create` for each task with dependencies |
| Quick in-session task list | OpenCode TodoWrite (ephemeral, fine for single sessions) |
| Architecture/design planning | `/plan` command + `bd create` for resulting tasks |
| Multi-session work | `bd` (persists) + `/save-session` (context snapshot) |
| Bug tracking / follow-up | `bd create -t bug` |
| Cross-agent coordination | `bd update --claim` (atomic assignment) |

**Rule of thumb:** If the work might span compaction or multiple sessions, use `bd`. If it's a quick checklist for the next 10 minutes, TodoWrite is fine.

## Session Start

At the start of every session on a project with Beads initialized:

```bash
# Check what's ready to work on (no open blockers)
bd ready --json

# If resuming, check what was in progress
bd list --status in_progress --json
```

Read the output. If there are in-progress tasks, resume them. If not, pick the highest-priority ready task.

### Sandbox / Dolt-Backed Mode

Beads commonly uses Dolt-backed local state. In sandboxed agent sessions:

- Treat `bd ready --json` as a command that may need escalation.
- If `bd ready --json` fails with Dolt server startup/connect errors, retry the same command outside the sandbox once.
- Distinguish `sandbox blocked` from `Beads unavailable`:
  - `sandbox blocked` means retry outside the sandbox is needed or still fails for environment reasons
  - `Beads unavailable` means `bd` is not installed or `.beads/` is not initialized
- Do not assume Beads is broken after one sandbox failure.

## Creating Tasks

Create tasks from plans, user requests, or discovered work:

```bash
# Basic task
bd create "Implement user authentication" -p 1

# With type (task, bug, epic, message)
bd create "Fix login redirect loop" -t bug -p 0

# Epic with sub-tasks
bd create "Add export feature" -t epic -p 1
# Returns bd-xxxx
bd create "Design export API schema" -p 1 --parent bd-xxxx
bd create "Implement CSV export" -p 2 --parent bd-xxxx
bd create "Implement JSON export" -p 2 --parent bd-xxxx
bd create "Add export UI button" -p 2 --parent bd-xxxx
```

### Monorepo Labeling

In multi-app or multi-business repos, do not leave feature-sized work as unlabeled flat tasks.

Preferred structure:

- parent epic or feature task for the app feature
- child tasks for implementation slices
- labels or naming that preserve:
  - app
  - feature
  - type
  - business only when the repo explicitly spans multiple businesses

Examples:

- `app:listing-helper`
- `feature:bulk-editor`
- `type:feature`
- `business:spiffing-prints`

If `bv` is part of the workflow, these labels should be treated as visibility keys, not optional decoration. Without app/feature labels, portfolio views will degrade into unmapped backlog summaries.
If app / feature / type metadata is missing at planning time, ask the user before creating the Beads structure.

### Priority Levels

| Priority | When |
|----------|------|
| P0 | Blocking all progress, security issues, broken builds |
| P1 | Must be done this session / sprint |
| P2 | Should be done soon, not blocking |
| P3 | Nice to have, backlog |

## Working on Tasks

```bash
# Claim a task (atomic — sets assignee + in_progress)
bd update bd-xxxx --claim

# Add dependencies (child is blocked by parent)
bd dep add bd-child bd-parent

# Add design notes
bd update bd-xxxx --design "Using repository pattern with async adapter"

# Close when done
bd close bd-xxxx --reason "Implemented and tested"
```

## Integrating with /plan

When `/plan` produces an implementation plan, convert it to Beads tasks:

1. Run `/plan [description]` — produces approach, task breakdown, risks
2. Create an epic: `bd create "[feature name]" -t epic -p 1`
3. Create tasks for each step in the plan, with dependencies
4. Start working: `bd ready --json` to see what's unblocked

## Integrating with /orchestrate

When running multi-agent pipelines:

1. Create tasks for each pipeline stage before starting
2. Each agent claims its task via `bd update --claim`
3. Agent closes its task when its stage is done
4. Handoff document references the Beads issue ID

## Session End ("Landing the Plane")

Before ending a session:

```bash
# Close completed work
bd close bd-xxxx --reason "Completed"

# File issues for remaining work
bd create "Follow-up: add edge case tests" -p 2

# Check what's left
bd ready --json

# Save session context (our framework command)
/save-session [name]
```

## Compaction Survival

Beads state survives compaction automatically (it's on disk). After compaction:

```bash
# Reload task context
bd ready --json
bd list --status in_progress --json
```

The session-memory hook should include a reminder to check `bd ready` after compaction.
If `bd ready --json` fails with Dolt startup/connect errors during recovery, retry outside the sandbox before giving up.

## Key Commands Reference

| Command | Purpose |
|---------|---------|
| `bd init` | Initialize Beads in a project |
| `bd ready` | List tasks with no open blockers |
| `bd create "Title" -p N` | Create a task |
| `bd update ID --claim` | Atomically claim a task |
| `bd close ID` | Close a completed task |
| `bd show ID` | View task details |
| `bd list` | List all tasks |
| `bd dep add child parent` | Add dependency |
| `bd prime` | Load context summary for the agent |

Always use `--json` flag when parsing output programmatically.

## Anti-Patterns

- **Don't duplicate TodoWrite and Beads.** Use one or the other for a given piece of work.
- **Don't create tasks for trivial work.** A one-line fix doesn't need a Beads issue.
- **Don't forget to close tasks.** Orphaned open tasks cause confusion across sessions.
- **Don't skip `bd ready`.** It handles dependency resolution — don't manually pick tasks.
- **Don't treat Dolt startup/connect failures as a product failure immediately.** Retry outside the sandbox first.

## See Also

- [blueprint](../blueprint/SKILL.md)
- [portfolio-management](../portfolio-management/SKILL.md)
- [strategic-compact](../strategic-compact/SKILL.md)
- [using-agent-toolkit](../using-agent-toolkit/SKILL.md)
