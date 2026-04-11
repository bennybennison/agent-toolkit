---
skill: wireframe-planning
scope: universal
profile: standard, full
tags: [ui, wireframes, screens, workflow]
---

# Skill: Wireframe Planning

Turn a workflow into a set of wireframes or mocked screens that can be reviewed without backend implementation.

## Goal

Produce:

- one `ScreenFlowSpec`
- one or more `ScreenSpec` documents
- one `WireframeSpec`

## For Each Screen

Define:

- screen purpose
- primary action
- visible fields
- important states
- transitions to other screens

## Wireframe Rule

The wireframe should be specific enough that another process can understand:

- what the screen is for
- what the user can do
- what data must appear
- what states need to exist

It does not need production-level visual polish.

## Anti-Patterns

- Building a real backend to support a concept screen
- Filling screens with placeholder gibberish instead of realistic fake data
- Leaving states like empty/error/loading undefined
