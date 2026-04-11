---
skill: screen-flow-design
scope: universal
profile: standard, full
tags: [product-design, ui, workflow, screens]
---

# Skill: Screen Flow Design

Turn a workflow into concrete screens, actions, states, and transitions.

## Goal

Produce:

- one `ScreenFlowSpec`
- one or more `ScreenSpec` documents

## For Each Screen

Define:

- screen purpose
- primary user actions
- visible fields and summaries
- entry conditions
- exit paths
- error or empty states

## Design Rule

Every visible field should justify itself:

- why the user sees it
- what decision it supports
- what action it enables

If a field does not support a decision or action, it probably does not belong in version one.

## Minimum Questions

1. What screen does the user land on first?
2. What is the main action on this screen?
3. What data must be visible for that action?
4. What can go wrong here?
5. Where does the user go next?

## Anti-Patterns

- Designing components before defining the workflow path
- Listing data fields without tying them to user actions
- Ignoring empty, loading, error, and exception states
