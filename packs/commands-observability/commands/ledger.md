---
description: Inspect recent SQLite ledger records for governance and orchestration audits
surface: user
---

Show recent records from `{{LEDGER_DB_PATH}}`. $ARGUMENTS

Use this command to quickly inspect runtime governance decisions and guardian signatures.

## Usage

- `/ledger` -> show 20 recent `decision_records`
- `/ledger --limit 50` -> show more rows
- `/ledger --signatures` -> show recent `signature_records`
- `/ledger --event commander.escalation.decision` -> filter decisions by event type

## Steps

1. Ensure `{{LEDGER_DB_PATH}}` exists.
2. Run sqlite3 query for `decision_records` (or `signature_records` when requested).
3. Return a concise table with newest rows first.
4. If DB or table is missing, report the exact missing piece and suggested fix.

## Suggested Queries

```bash
# decisions
sqlite3 {{LEDGER_DB_PATH}} "
select id, time_created, event_type, substr(payload_json,1,180) as payload
from decision_records
order by id desc
limit 20;"

# signatures
sqlite3 {{LEDGER_DB_PATH}} "
select id, time_created, actor, target, tool, expires_at
from signature_records
order by id desc
limit 20;"
```
