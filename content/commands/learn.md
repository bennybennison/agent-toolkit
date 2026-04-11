---
description: Extract lessons and reusable patterns from the current session
---

Review the current session and extract lessons and reusable patterns.

Follow the process in `the `continuous-learning` skill`:

**Step 1 — Extract lessons for GOTCHAS.md:**

Look for:
1. **Non-obvious issues** — Things that broke in unexpected ways
2. **Workarounds** — Indirect approaches that were needed
3. **API gotchas** — Undocumented behaviour, parameter quirks
4. **Tool issues** — Terminal encoding problems, package conflicts
5. **Architecture insights** — Patterns that worked well or poorly

For each lesson found, format it as a GOTCHAS.md entry:

```
### {Short title}

**Discovered:** {today's date}
**Severity:** low / medium / high
**Area:** {module or system area}

**Problem:** What goes wrong
**Solution:** How to avoid or fix it
```

Append entries to `{{GOTCHAS_PATH}}` (create it if it doesn't exist).

**Step 2 — Check for reusable patterns to promote:**

For each lesson, ask: Is this reusable across projects? Classify using the pattern type table in `the `continuous-learning` skill`:
- Constraint ("always/never") -> Rule
- Workflow ("how to do X") -> Skill
- Shortcut -> Command
- Automation -> Hook

Only propose framework additions for patterns at medium+ confidence (seen 2+ times or across 2+ projects).

**Step 3 — Write session memory entry:**

Write a structured memory entry to `{{MEMORY_DIR}}/` so the framework can auto-inject it in future sessions:

1. Create `{{MEMORY_DIR}}/` if it doesn't exist
2. Write a JSON file named `{ISO-timestamp}.json` with this structure:
```json
{
  "timestamp": "ISO timestamp",
  "goal": "session goal or task description",
  "phase": "final session phase",
  "filesRead": ["key files touched"],
  "blockedReason": null,
  "nextAction": "what should be done next",
  "activeCommand": null
}
```

This is automatically loaded on the first tool call of future sessions.

**Step 4 — Log friction events:**

Check if any friction events should be logged to `{{FRICTION_LOG_PATH}}`:
- 3+ file reads to find something
- 2+ retries on the same operation
- Terminal errors
- Workarounds used

$ARGUMENTS
