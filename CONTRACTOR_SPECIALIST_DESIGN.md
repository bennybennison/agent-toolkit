# Contractor Specialist Design

## Purpose

`Contractor` is an optional hidden specialist for contract-aware workflows.

It exists to make contract use more operative without making runtime or
language-specific types the conceptual center of the toolkit.

## Why It Exists

The toolkit now has:

- first-class contracts in `contracts/`
- skill-led contract usage in `skills/contract-workflow/`
- recipe metadata for `contract_mode` and `artifact_root`
- a file-first durable artifact convention under `.agent-artifacts/`

The missing piece is a specialist that can interpret those pieces on behalf of
the orchestrator when stronger structure is useful.

## Responsibilities

`Contractor` may:

- resolve contract IDs to canonical toolkit paths
- summarize contract expectations for downstream specialists
- point workers at `CONTRACT.md`, `schema.json`, and `TEMPLATE.md`
- prepare artifact instructions using the recipe's `artifact_root`
- check whether required artifacts exist
- perform lightweight shape validation where practical
- hand off normalized contract context to language-specific adapters

## Non-Responsibilities

`Contractor` must not:

- become the source of truth for contract definitions
- replace recipes as the workflow chooser
- replace shared skills as the usage guide
- force every task into structured artifact production
- make Python or Pydantic the shape of the toolkit core

## Invocation Guidance

Use `Contractor` when at least one is true:

- recipe `contract_mode` is `required`
- recipe `contract_mode` is `validated`
- another specialist needs explicit contract-backed handoff structure
- the artifact will be consumed across sessions or by another agent
- the task is high-stakes enough that loose prose is risky

Avoid `Contractor` when:

- the task is tiny and conversational
- no durable artifact is needed
- the structure overhead would outweigh the benefit

## Expected Inputs

The orchestrator should provide:

- recipe ID
- contract IDs
- `contract_mode`
- `artifact_root`
- task intent
- any existing artifact paths or artifact payloads

## Expected Outputs

`Contractor` should usually return:

- resolved contract metadata
- expected artifact path guidance
- compact instructions for the next specialist
- any validation warnings or missing sections

Example output shape:

```text
Contract package:
- contract: plan
- definition: contracts/plan/CONTRACT.md
- schema: contracts/plan/schema.json
- template: contracts/plan/TEMPLATE.md
- artifact_root: .agent-artifacts/plans/
- expectation: required
- notes: include assumptions, sequencing, and verification sections
```

## Relationship To Python/Pydantic

If a Python-specific adapter exists, `Contractor` may hand the contract payload
to that adapter for optional typed projection or validation.

That projection remains:

- removable
- adapter-specific
- downstream of the canonical contract layer

## Implementation Bias

Start small.

The first implementation should be mostly interpretive:

- path resolution
- artifact routing
- lightweight validation

Do not start with:

- deep runtime object graphs
- mandatory structured serialization everywhere
- hard dependency on one model or one host
