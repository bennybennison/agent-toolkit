---
description: Create or refresh a compact repo-level project brief
---

Create or update a concise project brief for the current repository. $ARGUMENTS

Use this when initializing a project, clarifying overall purpose, or capturing strategic context that should inform future planning without bloating area docs.

## Goal

Produce a compact repo-level brief that explains:

- what the repo is for
- who it serves
- the main areas/apps it contains or is expected to contain
- likely future directions that should influence current design
- important constraints

## Process

0. Claim command ownership immediately by treating this as the active command: `project-brief`
1. Read root `AGENTS.md`, `CONSTITUTION.md`, and any existing project-brief or portfolio docs
2. Determine whether these fields are explicit from the repo docs:
   - repo purpose
   - who it serves
   - current main areas/apps
   - likely future direction
   - major constraints
3. If two or more of those fields are missing or ambiguous, ask concise plain-text questions before writing anything substantial.
4. Ask at most 5 short questions, focused on the missing fields only.
5. If questions are required, STOP and wait for the user's response. Treat the task as awaiting user input. Do not continue exploring, reread the same files, or call subagents for more strategic guesses.
6. If no questions are required, move immediately to writing `{{PROJECT_BRIEF_PATH}}`. Do not do further exploration, re-reading, directory listing, or summarization before the write step.
7. Once the missing context is answered, or once you confirm no questions are needed, write or update `{{PROJECT_BRIEF_PATH}}` using the framework template.
8. Keep it short, structured, and high-signal.

## Hard Session State

At the start of this command, create or update `{{SESSION_STATE_PATH}}` with:

- `activeCommand: "project-brief"`
- `goal: "Create or update {{PROJECT_BRIEF_PATH}}"`
- `phase: "discovering"` or `"awaiting_user"` or `"executing"`
- `filesRead: []`
- `outputPath: "{{PROJECT_BRIEF_PATH}}"`
- `nextAction: "read AGENTS.md and {{CONSTITUTION_PATH}}"` initially, then `"write {{PROJECT_BRIEF_PATH}}"` once enough context exists
- `blockedReason: null` unless a real blocker exists

Treat this file as authoritative session state. Do not let unrelated recovery or task-triage flows override it while this command is active.

## Strategic Fast-Path

This command is a fast-path strategic write, not a general research session.

- Do not create TodoWrite items unless the user explicitly asked for task tracking.
- Do not run Beads commands, optimisation commands, or status commands during this flow.
- Do not inspect unrelated directories once the required source files are read.
- Expected shape: 1-3 reads, then either one question batch or one write.

## Constraints

- Do not duplicate detailed feature plans
- Do not turn this into a long narrative
- Prefer bullets and tables over prose blocks
- Keep it readable enough that an agent can load it before deeper docs
- Do not loop by re-reading the same strategic files repeatedly if required context is still missing
- Do not guess the business or future roadmap from weak signals like TODO lists alone
- Atomic write: once the decision to write is made, prioritize the file-write tool call over summarization, compaction, directory listing, or any further reads

## Required Question Style

If questions are needed:

- ask them in one concise batch
- prefer plain language over framework jargon
- ask only for the missing information

Good examples:

- What is the main purpose of this repo?
- Which apps or areas should be treated as first-class parts of the repo?
- What future capabilities are likely enough that they should influence design now?
- What constraints matter most: business, technical, or operational?

## Output

Report:

- whether the brief was created or updated
- the saved path
- the most important strategic assumptions captured
