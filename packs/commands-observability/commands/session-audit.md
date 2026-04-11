---
description: Generate a multi-day audit report from OpenCode session history
surface: user
---

Generate a Markdown audit report from persisted host session history. $ARGUMENTS

This report is for spotting inefficiency and loops (compaction spam, repeated prompts, repeated assistant plan restarts) across recent sessions.

## Defaults

- Host: `opencode`
- Window: last 7 days
- Scope: current project directory only
- Output:
  - OpenCode: `{{AUDITS_DIR}}/opencode-audit-*.md`
  - Codex: `{{AUDITS_DIR}}/codex-audit-*.md`
  - Copilot: `{{AUDITS_DIR}}/copilot-audit-*.md`

## Step 1 - Resolve framework location

Run the toolkit report through the installed CLI instead of resolving package paths manually.

## Step 2 - Run the audit

Run the script (it is stdlib-only):

```bash
{{CLI_COMMAND}} report session-audit \
  --days 7 \
  --dir "$(pwd)"
```

For other hosts:

```bash
{{CLI_COMMAND}} report codex-session-audit \
  --days 7 \
  --dir "$(pwd)"

{{CLI_COMMAND}} report copilot-session-audit \
  --days 7 \
  --dir "$(pwd)"
```

If the user provided overrides in $ARGUMENTS, apply them:

- `--days N`
- `--dir /absolute/path`
- `--out /absolute/path/to/report.md`

## Step 3 - Summarize the report

Read the generated report and summarize:

- Number of sessions audited
- Top 3 highest loop-score sessions (title + session id)
- Common repeated prompt/prefix patterns

## Step 4 - Recommend one concrete framework change

Pick ONE targeted change based on the evidence (examples):

- Tighten a hook that is causing compaction spam
- Add a loop guard rail to an agent/command that repeats work
- Add a new diagnostic command or hook

Do not recommend broad refactors without clear evidence.
