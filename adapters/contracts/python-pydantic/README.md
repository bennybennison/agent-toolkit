# Python Pydantic Contract Projection

This directory is the optional Python-oriented projection layer for toolkit
contracts.

It exists for Python-heavy repos that want typed validation or typed handoff
objects without making Pydantic the authored source of truth.

## Boundary

Canonical ownership remains in:

```text
contracts/<contract-id>/
  CONTRACT.md
  schema.json
  TEMPLATE.md
```

This adapter layer may project those contracts into:

- Pydantic `BaseModel` classes
- Python validation helpers
- Python-facing handoff parsers

## Rules

- Do not author canonical contracts here
- Do not let Pydantic models diverge semantically from the contract package
- Treat this layer as removable
- If removed, the toolkit should lose Python convenience, not architecture

## Typical Use

This layer is a good fit when:

- a Python orchestrator wants typed handoff objects
- a `Contractor` specialist needs a Python projection target
- downstream Python tooling wants stronger validation than Markdown alone

## Current State

This layer can now be populated by generation from canonical contract schemas:

```bash
agent-toolkit contracts emit-pydantic <contract-id>
agent-toolkit contracts emit-pydantic <contract-id> --out adapters/contracts/python-pydantic/generated/<contract-id>.py
```

Generation is intentionally conservative. It aims to create removable typed
projections for current toolkit contracts, not to become a full JSON Schema
compiler or a new authored source of truth.

See also:

- `../../../../CONTRACTOR_SPECIALIST_DESIGN.md`
- `../../../contracts/README.md`
- `../../../skills/contract-workflow/SKILL.md`
