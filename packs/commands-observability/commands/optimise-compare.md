---
description: Compare the current optimisation window against the previous one
surface: user
---

Generate a comparison report for the target project. $ARGUMENTS

Use this when you want to know whether the framework is actually getting better, not just whether the latest snapshot looks bad.

## Defaults

- Directory: current working directory
- Window size: 7 days
- Comparison: last 7 days vs the 7 days before that
- Output: `{{AUDITS_DIR}}/opencode-optimise-compare-*.md`

## Step 1 - Resolve framework location

Run the toolkit report through the installed CLI instead of resolving package paths manually.

## Step 2 - Run the comparison

```bash
{{CLI_COMMAND}} report optimise-compare \
  --days 7 \
  --dir "$(pwd)"
```

If the user supplied overrides in $ARGUMENTS, apply them:

- `--days N`
- `--dir /absolute/path`
- `--out /absolute/path/to/report.md`

## Step 3 - Summarize the deltas

Read the generated report and summarize:

- Whether looping improved, worsened, or stayed flat
- Whether tool-call and compaction medians improved
- Whether the current repo is still blocked by verification/setup failures

## Step 4 - Recommend one next experiment

Recommend exactly one framework change that should improve the next comparison window.
