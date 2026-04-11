---
description: Stop Shadow-Root staging for the active mission
surface: internal
---

Disable staging mode and clear active mission state.

## Usage

`/shadow-stop`

CLI helper: `{{CLI_COMMAND}} shadow-stop`

## Process

1. Read `{{SESSION_STATE_PATH}}`.
2. Set:
   - `shadowMode: "inactive"`
   - `activeMissionId: null`
3. Keep staged files intact under `{{STAGING_DIR}}/<mission-id>/` for later review/apply.
4. Report which mission was deactivated.
