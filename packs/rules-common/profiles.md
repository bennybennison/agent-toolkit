---
rule: profiles
scope: universal
profile: all
tags: [modularity, profiles, project-setup]
---

# Project Profiles And Pattern Packs

The toolkit is modular. Projects should declare a governance profile and then activate only the packs they need.

## Profiles

Profiles set the baseline governance level. Higher profiles include the expectations of lower ones.

### `light`

For scripts, prototypes, and disposable experiments.

Includes:

- basic type safety expectations
- lint/format discipline
- minimal structure

Does not assume:

- heavy architecture ceremony
- specs, ADRs, or constitutions
- full package-by-package documentation

### `standard`

For real applications, internal tools, and maintained services.

Includes:

- package-level working docs
- stronger module boundaries
- file size caps
- stronger review and testing expectations

### `full`

For long-lived, multi-system, or high-stakes projects.

Includes:

- constitutions and ADRs
- richer specs and planning artifacts
- friction tracking
- stronger documentation and verification discipline

## Pattern Packs

Use packs to activate domain- or workflow-specific behavior such as:

- Python rules and verification
- TypeScript or frontend rules
- MCP categories
- outside-in or UI-first design workflows
- discovery, planning, or review packs

## Rule

Do not force every project to carry every pattern. Prefer a small active set of packs that matches the repo’s actual shape.
