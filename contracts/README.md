# Contracts

This directory is the toolkit-owned authored source for portable artifact and
handover contracts.

Contracts sit between:

- `recipes/`, which decide what workflow is running
- `skills/`, which may direct the agent to the right artifact or template
- `runtime/`, which may later validate that required artifacts exist and match
  the expected shape

They should feel skill-led in use, but they are not owned by any one skill
folder.

## Contract Layout

Each contract lives in its own directory:

```text
contracts/
  <contract-id>/
    CONTRACT.md
    schema.json
    TEMPLATE.md
```

## File Responsibilities

### `CONTRACT.md`

Human-readable meaning and boundaries:

- what the artifact is for
- when it should be used
- required sections or fields
- how it relates to other contracts

### `schema.json`

Machine-readable validation source:

- required properties
- enums
- basic nested object structure
- array shape

This should stay host-neutral.

### `TEMPLATE.md`

Writing scaffold for agents and humans.

This is the practical output skeleton a skill or recipe can point to when an
artifact must be produced.

## Portability Rule

Contracts should be authored in a host-neutral way.

That means:

- do not make Python or Pydantic the canonical source of truth
- do not make runtime internals the authored contract source
- do allow later projections into runtime validators such as Pydantic models

## Artifact Storage Convention

When a contract-backed workflow produces durable Markdown artifacts, the
default repo-local storage convention is:

```text
.agent-artifacts/
  context-bundles/
  handoffs/
  plans/
  verification/
  decisions/
```

Rules:

- artifacts should be durable across sessions
- artifacts should be inspectable without runtime state
- artifacts should normally be written from `TEMPLATE.md`
- recipes may choose a more specific default `artifact_root`

You can scaffold a Markdown artifact directly from a contract template with:

```bash
agent-toolkit contracts scaffold <contract-id> [name]
agent-toolkit contracts scaffold <contract-id> --out .agent-artifacts/<folder>/<file>.md
```

You can validate a Markdown artifact structurally with:

```bash
agent-toolkit contracts validate <contract-id> <artifact-path>
```

Current validation is intentionally pragmatic:

- checks required Markdown sections from `CONTRACT.md`
- checks for unresolved template tokens
- warns about blank scaffold fields

It does not yet coerce Markdown into the full JSON object model described by
`schema.json`.

For Python-heavy repos, you can also emit an optional Pydantic projection from
the canonical schema:

```bash
agent-toolkit contracts emit-pydantic <contract-id>
agent-toolkit contracts emit-pydantic <contract-id> --out .agent-artifacts/python-pydantic/<contract-id>.py
```

The shared `contract-workflow` skill should teach when and how to use this
convention, but canonical contract definitions remain here in `contracts/`.

## Initial Contracts

The first toolkit-owned contracts are:

- `task-brief`
- `plan`
- `map-report`
- `build-proposal`
- `audit-report`
- `verification-report`
- `context-bundle`
- `decision-note`
- `change-summary`
- `diagnosis-note`
- `recommendation-set`
- `session-summary`
- `next-step-brief`
- `wireframe-plan`
- `api-contract-set`
- `mock-data-plan`
