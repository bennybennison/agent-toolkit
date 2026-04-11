---
description: Review and apply staged Shadow-Root files for a mission
surface: internal
---

Apply staged files from `{{STAGING_DIR}}/<mission-id>/` into the physical project root. $ARGUMENTS

## Usage

`/apply <mission-id>`

Executable helper:

`bun scripts/shadow-apply.ts <mission-id> [--yes]`

CLI helper:

`{{CLI_COMMAND}} apply <mission-id> [--yes]`

## Process

1. Read `{{SESSION_STATE_PATH}}` and confirm the mission id.
2. Inspect staged records for the mission from `{{LEDGER_DB_PATH}}`.
3. For each staged file:
   - Compare current physical hash to the baseline hash captured when staging started.
   - If they differ, flag a merge conflict and stop.
   - Generate a diff between physical and shadow versions.
   - Show the rationale from the staging record.
4. If there are no conflicts and the user approves, copy staged files into the physical root.
5. Mark staging records as applied and remove the staged copies.
6. Reset mission staging state if all staged files are applied.

## Conflict Rule

If the physical file changed after staging began, do not apply automatically. Report the conflicted files and stop.

## Suggested Commands

```bash
sqlite3 {{LEDGER_DB_PATH}} "
select id, original_path, shadow_path, baseline_hash, staged_hash, rationale, status
from staging_records
where mission_id='$ARGUMENTS'
order by id desc;"

git diff --no-index --no-color -- physical/path shadow/path
```
