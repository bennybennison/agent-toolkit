---
description: Capture rough ideas into a durable backlog for deferred fleshing and later specification
---

Capture this rough backlog input: $ARGUMENTS

Use this for stream-of-consciousness idea dumps, rough feature lists, and unstructured notes that are not yet implementation-ready.

## Goal

Turn rough input into durable backlog entries without forcing immediate specification work.

## Workflow

1. Parse rough input into candidate backlog items
2. Normalize each item to:
   - title
   - short intent
   - optional tags (`feature`, `bug`, `chore`, `research`)
   - confidence (`high`, `medium`, `low`) based on clarity
3. Persist entries using the active task source:
   - If `.beads/` exists: create Beads tasks via `bd create`
   - Otherwise: append to `{{BACKLOG_PATH}}` under `## Inbox`
4. Mark ambiguous items for later fleshing

## Output Contract

Return:

- number of items captured
- where they were saved (Beads ids or backlog file entries)
- top 3 items recommended for fleshing next
- recommended next command (`/explore` for idea shaping, `/feature` for fleshing, `/plan` for direct implementation planning)

## Hard Session State

At the start, update `{{SESSION_STATE_PATH}}` with:

- `activeCommand: "capture"`
- `goal: "Capture rough ideas into durable backlog entries"`
- `phase: "executing"`
- `outputPath: "{{BACKLOG_PATH}}"` when using file backlog
- `nextAction`: current concrete step
- `blockedReason: null` unless blocked

## Constraints

- Do not auto-start implementation
- Keep entries compact and actionable
- Preserve user wording when possible, but normalize for later retrieval
