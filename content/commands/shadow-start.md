---
description: Start Shadow-Root staging for a mission id
surface: internal
---

Enable staging mode for a mission so file writes are redirected into `{{STAGING_DIR}}/<mission-id>/`. $ARGUMENTS

## Usage

`/shadow-start <mission-id>`

CLI helper: `{{CLI_COMMAND}} shadow-start <mission-id>`

## Process

1. Validate a non-empty mission id.
2. Update `{{SESSION_STATE_PATH}}`:
   - `shadowMode: "staging"`
   - `activeMissionId: "<mission-id>"`
3. Ensure `{{STAGING_DIR}}/<mission-id>/` exists.
4. Report that reads will prefer staged files when present and writes/edits will be redirected.

## Suggested State Patch

```json
{
  "shadowMode": "staging",
  "activeMissionId": "<mission-id>"
}
```
