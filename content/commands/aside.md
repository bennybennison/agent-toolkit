---
description: Answer a quick side question without losing context from the current task
---

# Aside Command

Answer a question mid-task without losing the current work context. The active task, files, and progress are preserved.

## Usage

`/aside <your question>`

## Process

### Step 1: Freeze Current State

Before answering, note:
- What task is active (file, feature, problem being worked on)
- What step was in progress
- What was about to happen next

Do NOT modify any files during the aside.

### Step 2: Answer Directly

- Lead with the answer, not the reasoning
- Keep it concise — offer to go deeper after the current task
- Reference file paths and line numbers when relevant
- Read files if needed, but read-only — never write

Format:

```
ASIDE: [restated question]

[Answer]

-- Back to task: [one-line description of what was being done]
```

### Step 3: Resume

Continue the active task from exactly where it was paused. Do not ask for permission to resume unless the aside revealed a blocker.

## Edge Cases

**No question provided:**
Ask what they want to know, then resume.

**Question reveals a problem with the current task:**
Flag it: "Note: this suggests [issue] with the current approach. Address now or continue?" Wait for decision.

**Question is actually a task redirect** (e.g., "actually, let's use Redis instead"):
Clarify: "That sounds like a direction change. (a) Answer as info only and keep current plan, or (b) pause and change approach?"

**Answer requires a code change:**
Note it but do not make it: "Worth fixing: [what]. I'll address this after the current task unless you want to handle it now."

$ARGUMENTS
