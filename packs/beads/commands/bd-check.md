---
description: Check whether Beads is available for this session
surface: user
---

Run a one-shot Beads availability check for the current project. $ARGUMENTS

Use this at session start if the project uses Beads and you want to know whether `bd` is usable in the current sandbox.

## Execution

1. Run `bd ready --json` once.
2. If it succeeds, report `Beads available`.
3. If it fails with Dolt server startup/connect errors, retry the same command outside the sandbox once.
4. If the retry succeeds, report `Beads available (required escalation)`.
5. If the retry still fails due to sandbox/server issues, report `sandbox blocked`.
6. If `.beads/` is missing, report `Beads not initialized`.
7. If `bd` is missing, report `bd not installed`.

Keep the output short and explicit. Do not create or modify tasks in this command.
