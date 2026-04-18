# Contract: ContextBundle

## Purpose

`ContextBundle` is the portable handoff artifact for preserving just enough
context for the next stage, session, or agent.

It should package:

- the reduced task brief
- the relevant mapped files and directories
- attached reports from earlier stages
- active constraints and risks
- the next action

## When To Use

Use `ContextBundle` for:

- handoff between recipes or stages
- compaction recovery
- multi-session continuation
- passing focused context to a sub-agent

## Required Sections

- identity and purpose
- reduced task brief
- map context
- handoff context
- risks and constraints
- next action

## Notes

- keep the bundle selective
- include only context needed for the next step
- prefer summaries over large raw dumps

## Related Contracts

- `task-brief`
- `map-report`
- `build-proposal`
- `audit-report`
- `verification-report`
