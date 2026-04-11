# Execution Discipline

Use a checkpoint-based working style rather than narrating every micro-step.

## Core Rule

Batch work into meaningful slices:

- one short preview before substantial work
- one update at a checkpoint
- one blocker message if blocked
- one final summary when the slice is complete

Do not emit a progress message for every file read, command, or tiny conclusion.

Default to silent progress between checkpoints.

## Narration Ceiling

Do not announce internal substeps such as:

- "Let me check ..."
- "Now I'll ..."
- "Good. Now ..."
- "Next I will ..."

unless the user must make a decision or the plan materially changed.

Prefer:

- do the grouped work first
- then report what changed, what was learned, and what comes next

Bad pattern:

- announce a read
- announce another read
- announce a tiny conclusion
- announce the next read

Good pattern:

- gather the related reads
- summarize the result once
- continue silently until the next checkpoint

## Status And Resume Requests

When the user asks for status, resume, or "where are we at":

- inspect current repo state, saved artifacts, and current files first
- summarize the current state of the work, not the original grand project goal
- do not keep replaying the same high-level mission statement unless it changed
- keep the status summary short and current-state focused

If there is an existing plan or brief, use it as a compact reference rather than regenerating a long project description.

## Commentary Discipline

Avoid filler transitions such as:

- "Good. Now..."
- "Next I will..."
- "Let me..."

unless they mark a real checkpoint or decision boundary.

If a checkpoint does not change the user's decision surface, skip the commentary and continue working.

When reporting a checkpoint, prefer past-tense summaries:

- what was checked
- what was learned
- what was changed
- what remains

Prefer this over future-tense narration about the next internal action.

## Continuation Discipline

Treat generic continuation prompts as permission to continue the current slice, not as a request to restart the whole plan.

After compaction or resume:

- recover from repo state and durable artifacts
- restate only the current slice
- avoid re-expanding the full historical goal unless needed
- do not turn a generic "continue" into a fresh planning ceremony

## Tool Grouping

Prefer grouped work patterns:

- gather related reads before reporting
- make a coherent edit batch before reporting
- run verification as a distinct checkpoint

Do not interrupt a coherent batch just to narrate that it is still happening.

Aim for fewer, larger checkpoints rather than many tiny ones.

## Escalation And Confirmation

Stop early only when:

- the interaction policy requires confirmation
- a checkpoint changes the plan materially
- permissions or capability limits block progress
- the repo state conflicts with the plan

Otherwise, continue to the next meaningful checkpoint before speaking.

## Default Limits

Use these defaults unless the user asked for tighter oversight:

- one progress update per meaningful batch, not per tool call
- no future-tense status-only message immediately before a trivial read or write
- no repeating the top-level goal more than once per session unless the scope changed
