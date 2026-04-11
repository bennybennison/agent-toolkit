---
name: "repo-mapping"
description: "Create a practical understanding of a repository or a large area before detailed work begins."
pack: "skills-discovery"
---

# Skill: Repo Mapping

Create a practical understanding of a repository or a large area before detailed work begins.

## Goal

Produce a `ProjectMap` that explains:

- the main areas of the repo
- how they relate
- key entrypoints and boundaries
- likely working set for the current task
- stale, unclear, or risky areas worth extra care

Use the template in `templates/workflows/PROJECT_MAP.md` when creating the artifact.

## Process

1. Identify the top-level areas and their responsibilities
2. Find the main entrypoints, interfaces, and shared layers
3. Trace the most relevant dependencies for the current task
4. Narrow the working set to the minimum useful area
5. Flag stale or confusing regions explicitly

## Output

Capture:

- repo shape
- area summaries
- key relationships
- narrowed working set
- stale or unclear zones

## Anti-Patterns

- Producing a directory dump with no interpretation
- Mapping the whole repo when only one task slice matters
- Confusing "files found" with "understanding achieved"
