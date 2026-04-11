---
name: "explore-ideas"
description: "Explore a rough idea before turning it into a spec or implementation plan. Use when the user wants use cases, open questions, risks, alternatives, or a proceed/defer recommendation."
starter: true
---

# Explore Ideas

Use this skill as the Codex-facing entrypoint for early discovery work in Agent Toolkit.

This plugin does not create a separate agent picker inside Codex. Instead, Codex should use this skill when the user is still shaping an idea and needs structured exploration rather than implementation.

## When To Use It

Use this skill when the user asks to:

- tease apart a rough idea
- identify use cases or user value
- surface risks, edge cases, or unknowns
- compare possible directions
- decide whether to proceed yet

## Workflow

1. Restate the core idea in one sentence.
2. Identify the user or operator who benefits.
3. Capture the most relevant use cases and jobs-to-be-done.
4. List open questions, risks, and edge cases.
5. Compare the most plausible directions.
6. End with a recommendation:
   - proceed to mapping
   - proceed to specification
   - defer
   - reject for now

## Output Shape

- Start with the clearest summary of the idea.
- Then list use cases, unknowns, risks, and alternatives.
- End with a concrete recommendation and the best next step.
