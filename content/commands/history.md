---
description: Show OpenCode session history for the current project (detect loops and repeated prompts)
---

Inspect OpenCode's persisted session history for the current working directory. $ARGUMENTS

Use this when the agent appears stuck in a loop, repeatedly restating the same goal, or re-answering the original question.

## Step 1 - Locate the history database

OpenCode stores sessions in:

- `~/.local/share/opencode/opencode.db`

## Step 2 - List recent sessions for this directory

Run a query scoped to the current directory (prefer last 30-60 minutes):

```bash
DB="$HOME/.local/share/opencode/opencode.db"
DIR="$(pwd)"

sqlite3 -header -column "$DB" "
select id, title, slug,
  datetime(time_created/1000,'unixepoch','localtime') as created,
  datetime(time_updated/1000,'unixepoch','localtime') as updated
from session
where directory='$DIR'
order by time_updated desc
limit 15;"
```

## Step 3 - Pick the most recent session and summarize its flow

For the chosen `SESSION_ID`:

1. Count message/part types (compaction spam is a red flag)
2. Show the last ~30 text messages (user/assistant)
3. Detect repeated user prompts and repeated assistant prefixes

```bash
SESSION_ID="..."

sqlite3 -header -column "$DB" "
select json_extract(data,'$.type') as part_type, count(*) as n
from part
where session_id='$SESSION_ID'
group by part_type
order by n desc;"

sqlite3 -header -column "$DB" "
select
  datetime(m.time_created/1000,'unixepoch','localtime') as t,
  json_extract(m.data,'$.role') as role,
  json_extract(m.data,'$.agent') as agent,
  substr(json_extract(p.data,'$.text'),1,140) as text
from message m
join part p on p.message_id=m.id
where m.session_id='$SESSION_ID'
  and json_extract(p.data,'$.type')='text'
order by m.time_created desc
limit 35;"

sqlite3 -header -column "$DB" "
select count(*) as occurrences, substr(json_extract(p.data,'$.text'),1,80) as text_prefix
from message m
join part p on p.message_id=m.id
where m.session_id='$SESSION_ID'
  and json_extract(p.data,'$.type')='text'
  and json_extract(m.data,'$.role')='user'
group by text_prefix
having occurrences>1
order by occurrences desc
limit 20;"
```

## Step 4 - Diagnose the likely loop cause

Classify into one of these:

- **Repeated user prompt**: user text repeats verbatim; agent treats it as a new instruction each time
- **Compaction loop**: many `compaction` parts; assistant restarts the same goal/plan after compaction
- **Tool failure loop**: tool calls error/abort; agent never observes progress and keeps restarting

If you see tool errors/aborts, also check runtime logs:

- `~/Library/Logs/ai.opencode.desktop/`
- `~/.local/share/opencode/log/`

## Output

Produce:

```
HISTORY REPORT
==============
Directory:   {dir}
Session:     {id} ({title})
Window:      {start} -> {end}

Signals:
- Compactions: {n}
- Repeated user prompts: {top repeats}
- Repeated assistant prefixes: {top repeats}

Diagnosis: {one of the 3 causes above}
Next action: {one concrete fix or one targeted question}
```
