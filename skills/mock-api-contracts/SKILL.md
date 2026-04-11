---
name: "mock-api-contracts"
description: "Define UI-facing contracts early and prove the screen flow against mock endpoints before designing the full backend."
pack: "skills-outside-in"
---

# Skill: Mock API Contracts

Define UI-facing contracts early and prove the screen flow against mock endpoints before designing the full backend.

## Goal

Produce:

- one or more `ApiContract` artifacts
- a mocked or stubbed FastAPI surface where useful
- a `ValidatedAppSlice` showing that the UI flow works conceptually

## Focus

Design contracts from the screen outward:

- what the screen needs to display
- what action the user takes
- what response the screen needs next

Prefer UI-facing request/response shapes over internal service objects in the first pass.

## Minimum Contract Questions

1. What action on the screen triggers this endpoint?
2. What input does the UI need to send?
3. What response shape does the UI need back?
4. What error cases must the UI handle?
5. Can the UI be proven against a mock of this contract?

## Anti-Patterns

- Designing backend service contracts before UI contracts
- Leaking internal storage models directly into API shapes
- Creating large generic APIs before validating a single workflow slice
