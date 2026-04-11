---
description: Export one consolidated review of how the framework has been working in this repo
surface: user
---

Create a single review document from the latest framework audit files for the current repo. $ARGUMENTS

Use this when you want one exportable summary instead of manually reading `/optimise`, `/optimise-compare`, and `/session-audit` separately.

## Step 1 - Make sure source reports exist

Run these first if recent reports do not already exist:

1. `/optimise --days 7`
2. `/optimise-compare --days 7`
3. `/session-audit --days 7`

## Step 2 - Resolve framework location

Run the toolkit report through the installed CLI instead of resolving package paths manually.

## Step 3 - Generate the consolidated review

```bash
{{CLI_COMMAND}} report review-framework \
  --dir "$(pwd)"
```

If the user supplied overrides in $ARGUMENTS, apply them:

- `--dir /absolute/path`
- `--out /absolute/path/to/review.md`

## Step 4 - Summarize the result

Read the generated review and summarize:

- whether the framework appears to be improving or regressing
- the main remaining loop or visibility problems
- one framework change to try next

Keep the output concise and evidence-based.
