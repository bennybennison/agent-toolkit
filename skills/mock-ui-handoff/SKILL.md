---
name: "mock-ui-handoff"
description: "Package a mocked frontend concept so another process can take over cleanly."
pack: "skills-ui-first"
---

# Skill: Mock UI Handoff

Package a mocked frontend concept so another process can take over cleanly.

## Goal

Produce a `UiMockHandoff` that explains:

- what branch contains the mock UI
- what workflow was validated
- which screens exist
- what fake data assumptions were used
- what remains intentionally undefined
- what the next process should do

## Include

- branch name
- artifact paths
- workflow scope
- screen list
- assumptions
- exclusions
- recommended next owner or next process

## Rule

Make the stop point explicit.

This handoff should say, in effect:

- the mocked UI is complete for this phase
- backend and infrastructure are intentionally out of scope

## Anti-Patterns

- Handing off a mock UI as if it were implementation-ready
- Omitting fake-data assumptions
- Letting the next team infer the scope boundary from screenshots alone
