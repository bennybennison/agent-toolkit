---
description: Generate a combined optimisation report for the current project
surface: user
---

Generate an optimisation report for the target project. $ARGUMENTS

This combines three views:

1. OpenCode session behaviour over recent days
2. Current quality-gate status (`ruff`, `mypy`, `pytest` when available)
3. Maintainability risks such as oversized source files

## Defaults

- Directory: current working directory
- Window: last 7 days
- Output: `{{AUDITS_DIR}}/opencode-optimise-*.md`

## Step 1 - Resolve framework location

Run the toolkit report through the installed CLI instead of resolving package paths manually.

## Step 2 - Run the report

```bash
{{CLI_COMMAND}} report optimise \
  --days 7 \
  --dir "$(pwd)"
```

If the user supplied overrides in $ARGUMENTS, apply them:

- `--days N`
- `--dir /absolute/path`
- `--out /absolute/path/to/report.md`

## Step 3 - Summarize the result

Read the generated report and summarize:

- How many sessions were audited
- Which session(s) had the highest loop score
- Which quality checks failed or were skipped
- Which file-size risks stand out

## Step 4 - Recommend targeted changes

Produce exactly two recommendations:

- One framework/agent-system change
- One project/application change

Keep both recommendations narrow and evidence-based. Prefer one next change that can be validated by rerunning this report.
