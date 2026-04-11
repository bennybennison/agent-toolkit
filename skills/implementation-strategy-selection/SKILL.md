---
name: "implementation-strategy-selection"
description: "Choose how work should be approached before turning it into an implementation plan."
pack: "skills-discovery"
---

# Skill: Implementation Strategy Selection

Choose how work should be approached before turning it into an implementation plan.

## Goal

Select the strategy that best matches the request and record:

- primary strategy
- alternatives considered
- why the chosen strategy fits
- what verification bias the strategy implies

The chosen strategy should appear in the final `Plan`.

## Core Strategies

| Strategy | Use When | Avoid When |
|----------|----------|------------|
| `outside-in` | Workflow, UI, and user-visible behavior should lead the design | The backend shape is already well understood and stable |
| `ui-first` | A mocked frontend concept is the deliverable | Real backend work is required immediately |
| `inside-out` | Domain or backend internals are the real driver | The user workflow is still unclear |
| `frontend-first` | Frontend behavior and states are the main risk | Backend or integration constraints dominate |
| `backend-first` | Domain rules, APIs, or data shape dominate | The UI/workflow is still speculative |
| `infra-first` | Environment, deployment, permissions, or platform constraints lead | Product behavior is still undefined |
| `full-stack-staged` | Several layers matter and the work should move in slices | One layer clearly dominates |
| `repair-first` | The task is a bug, drift, or unstable behavior | It is a greenfield feature |

## Selection Questions

1. What is the main uncertainty?
2. Which layer creates the highest risk first?
3. Is the deliverable conceptual, incremental, or production-ready?
4. What kind of verification will prove progress fastest?
5. Would a different strategy reduce rework?

## Output

For the selected strategy, state:

- chosen strategy
- why it fits
- what it changes about sequencing
- what should be verified first
- what tempting alternative was rejected and why

## Anti-Patterns

- Defaulting every task to the same strategy
- Confusing "preferred technology" with implementation strategy
- Picking infra-first because infrastructure is interesting rather than necessary
