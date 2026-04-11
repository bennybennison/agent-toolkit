---
description: Show active Shadow-Root mission and staged file count
surface: internal
---

Display the current staging mission and a summary of staged records.

## Usage

`/shadow-status`

CLI helper: `{{CLI_COMMAND}} shadow-status [mission-id]`

## Process

1. Read `{{SESSION_STATE_PATH}}`.
2. If `shadowMode` is `inactive`, report no active mission.
3. If active, query `{{LEDGER_DB_PATH}}` for staged records with `status='staged'` and matching mission id.
4. Print mission id, staged file count, and latest staged paths.

## Suggested Command

```bash
sqlite3 {{LEDGER_DB_PATH}} "
select id, original_path, status, time_created
from staging_records
where mission_id='<mission-id>' and status='staged'
order by id desc
limit 20;"
```
