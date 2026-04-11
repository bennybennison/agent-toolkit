---
name: "feasibility-and-placement"
description: "Assess whether an idea fits the current codebase, where it belongs, and what constraints shape the implementation."
pack: "skills-discovery"
---

# Skill: Feasibility And Placement

Assess whether an idea fits the current codebase, where it belongs, and what constraints shape the implementation.

## Goal

Produce a `MapReport` that captures:

- relevant files and modules
- existing patterns to follow
- candidate placement options
- dependencies and constraints
- risks and feasibility notes

Use the template in `templates/workflows/MAP_REPORT.md` when creating the artifact.

## Process

1. Search for similar behavior, names, or adjacent concepts
2. Identify the most relevant files, modules, and ownership boundaries
3. Note existing patterns that should be reused
4. Propose one or more candidate placement options
5. Call out constraints:
   - architecture boundaries
   - dependencies
   - migrations or data impacts
   - host/runtime implications
6. Conclude with feasibility guidance

## Output

Capture:

- relevant areas
- existing patterns
- candidate placement
- risks
- feasibility notes
- a recommendation on whether to proceed and where

## Anti-Patterns

- Saying "it seems easy" without locating the actual area of change
- Suggesting a new module when an existing pattern already fits
- Treating repo search as enough without placement reasoning
