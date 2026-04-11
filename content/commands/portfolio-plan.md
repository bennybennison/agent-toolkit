---
description: Create or refresh a compact portfolio plan for a monorepo or multi-area repo
---

Create or update a portfolio plan for the current repository. $ARGUMENTS

Use this when you want a visible repo-level roadmap covering multiple apps or areas, current priorities, and future features that should influence design.

## Goal

Produce a compact planning document that captures:

- the current set of repo areas/apps
- the purpose and status of each
- the next major features by area
- what is deferred
- repo-wide architectural notes

## Process

0. Claim command ownership immediately by treating this as the active command: `portfolio-plan`
1. Read the root `AGENTS.md`, `{{PROJECT_BRIEF_PATH}}` if it exists, and any existing portfolio plan
2. Use the monorepo map as the source of truth for areas when present
3. Determine whether these fields are explicit:
   - area/app list
   - purpose of each area
   - current status of each area
   - next major feature by area
   - deferred or paused areas
4. If those fields are incomplete or ambiguous, ask concise plain-text questions before writing the portfolio plan.
5. Ask at most 5 short questions and only for missing portfolio information.
6. If questions are required, STOP and wait for the user's response. Treat the task as awaiting user input. Do not keep exploring, reread the same files, or call subagents for more strategic guesses.
7. If no questions are required, move immediately to writing `{{PORTFOLIO_PATH}}`. Do not do further exploration, re-reading, directory listing, or summarization before the write step.
8. Write or update `{{PORTFOLIO_PATH}}` using the framework template.
9. Keep it compact enough to be a planning surface, not a spec dump.

## Hard Session State

At the start of this command, create or update `{{SESSION_STATE_PATH}}` with:

- `activeCommand: "portfolio-plan"`
- `goal: "Create or update {{PORTFOLIO_PATH}}"`
- `phase: "discovering"` or `"awaiting_user"` or `"executing"`
- `filesRead: []`
- `outputPath: "{{PORTFOLIO_PATH}}"`
- `nextAction: "read AGENTS.md and portfolio context"` initially, then `"write {{PORTFOLIO_PATH}}"` once enough context exists
- `blockedReason: null` unless a real blocker exists

Treat this file as authoritative session state. Do not let unrelated recovery or task-triage flows override it while this command is active.

## Strategic Fast-Path

This command is a fast-path strategic write, not a general research session.

- Do not create TodoWrite items unless the user explicitly asked for task tracking.
- Do not run Beads commands, optimisation commands, or status commands during this flow.
- Do not inspect unrelated directories once the required source files are read.
- Expected shape: 1-3 reads, then either one question batch or one write.

## Constraints

- Prefer one row per area and one row per major feature
- Mark things as `planned`, `active`, `paused`, `blocked`, or `done`
- If the repo is not actually multi-area, say so and keep the document minimal
- Do not infer area status or future features from weak evidence if the user has not clarified them
- Atomic write: once the decision to write is made, prioritize the file-write tool call over summarization, compaction, directory listing, or any further reads

## Output

Report:

- whether the portfolio plan was created or updated
- the saved path
- the highest-priority active or planned areas
