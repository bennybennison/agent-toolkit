---
description: Run the Session-Manager workflow to start, resume, inspect, or close a work session
surface: user-agent
agent: session-manager
---

Run the Session-Manager workflow for: $ARGUMENTS

Use this as the primary lifecycle command when you need to:

- start a session
- resume prior work
- inspect current status
- close with a clear next step

## Responsibilities

The Session-Manager should:

1. inspect session and repo state
2. identify unfinished work or missing next steps
3. call out cleanup or tidy-up concerns
4. recommend the right interaction policy for the next Orchestrator run
5. produce a compact summary of what matters now

For status-oriented requests, summarize the current repo truth and next action. Do not fall back to replaying the whole original project goal unless it is necessary to explain a decision.

## Typical outcomes

- `start` — minimal context and a recommended next action
- `resume` — prior state summary plus divergence notes
- `status` — concise operational snapshot plus recommended interaction policy
- `close` — loose ends, tidy-up notes, recommended interaction policy, and exact next step

Keep product execution separate from this flow. When implementation or deeper analysis is needed, hand off to the Orchestrator workflow.
