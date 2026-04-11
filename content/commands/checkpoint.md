---
description: Create, verify, or list named checkpoints tied to git state
---

# Checkpoint Command

Create or verify a checkpoint in your workflow. Checkpoints are named snapshots of your progress that let you compare state before and after changes.

## Usage

`/checkpoint [create|verify|list] [name]`

## Process

### Create

1. Run a quick verification (build + tests pass)
2. Create a git commit or note the current SHA
3. Log the checkpoint:

```bash
mkdir -p {{PROJECT_STATE_DIR}}
echo "$(date +%Y-%m-%d-%H:%M) | $1 | $(git rev-parse --short HEAD)" >> {{CHECKPOINTS_LOG_PATH}}
```

4. Report: checkpoint name, SHA, timestamp

### Verify

Compare current state against a named checkpoint:

1. Find the checkpoint SHA from `{{CHECKPOINTS_LOG_PATH}}`
2. Compare:
   - Files changed since checkpoint: `git diff --stat <sha>`
   - Test results now vs then
   - Build status now vs then

3. Report:

```
CHECKPOINT: {Name}
==================
SHA:     {sha} -> {current sha}
Files:   {N} changed
Tests:   +{passed} / -{failed}
Build:   [PASS/FAIL]
```

### List

Show all checkpoints from `{{CHECKPOINTS_LOG_PATH}}` with name, timestamp, and SHA.

## Typical Flow

```
/checkpoint create feature-start
  ... implement core logic ...
/checkpoint create core-done
  ... add tests ...
/checkpoint verify core-done
  ... refactor ...
/checkpoint create refactor-done
  ... final review ...
/checkpoint verify feature-start    # compare full journey
```

$ARGUMENTS
