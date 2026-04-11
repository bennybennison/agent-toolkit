---
description: Quick Beads task operations — create, list ready, close, or show status
surface: user
---

# Beads Task Management

Run Beads (`bd`) operations for persistent task tracking. Requires `bd` to be installed and `bd init` to have been run in the project.

Sandbox rule:

- If the project is using Dolt-backed Beads mode, treat `bd ready --json` and similar state-reading commands as potentially requiring escalation outside the sandbox.
- If `bd ready --json` fails with Dolt server startup/connect errors, retry the same command outside the sandbox before concluding Beads is unavailable.

## Parse Arguments

`$ARGUMENTS` determines the operation:

- **No arguments or "status"**: Run `bd ready --json` to show tasks ready to work on, then `bd list --status in_progress --json` to show in-progress tasks.
- **"create [title]"**: Run `bd create "[title]" -p 1` to create a new task. If the title suggests a bug, add `-t bug`.
- **"close [id] [reason]"**: Run `bd close [id] --reason "[reason]"` to close a completed task.
- **"show [id]"**: Run `bd show [id] --json` to display task details.
- **"plan [description]"**: First run `/plan [description]`, then convert the resulting task breakdown into Beads issues with dependencies using `bd create` and `bd dep add`.
- **"init"**: Run `bd init` to initialize Beads in the current project.
- **"prime"**: Run `bd prime` to load context summary for the session.

## Execution

1. Run the appropriate `bd` command(s) via bash
2. If a Dolt-backed `bd ready --json` or `bd list --status in_progress --json` call fails with Dolt startup/connect errors, retry outside the sandbox once
3. Parse the JSON output
4. Present a clean summary to the user

## Error Handling

- If `bd` is not found: Tell the user to install it with `curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash`
- If `.beads/` doesn't exist: Suggest running `/bd init` first
- If `bd ready --json` fails with Dolt startup/connect errors inside the sandbox: retry outside the sandbox once, then report whether Beads is available or sandbox-blocked
- If no tasks are ready: Report that all tasks are either blocked or completed
