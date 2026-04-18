---
name: "contract-workflow"
description: "Use contracts, templates, and durable markdown artifacts consistently when a workflow needs handoffs, plans, context bundles, decisions, or verification evidence."
pack: "skills-core"
---

# Skill: Contract Workflow

Use contracts, templates, and durable Markdown artifacts consistently when a
workflow needs structured outputs that should survive beyond the current chat
or runtime state.

## When to Use

- A recipe declares one or more contracts
- Work will span multiple sessions or multiple agents
- A handoff should be durable and inspectable later
- A plan, context bundle, decision note, or verification report should be left
  behind as a real artifact
- The task would benefit from explicit structure instead of informal prose

## Core Rule

Contracts are **authored canonically** under `contracts/`.

Skills teach how to use them.

Do not move canonical contract definitions into a skill folder.

## Workflow

### 1. Identify the Contract

Start from the workflow or recipe:

- check which contract IDs are required or suggested
- open the contract definition in `contracts/<contract-id>/CONTRACT.md`
- open `TEMPLATE.md` when the artifact should actually be written

If the task only needs a lightweight explanation and no durable handoff, do not
force a contract-backed artifact.

### 2. Choose the Output Location

Default durable artifact convention:

```text
.agent-artifacts/
  context-bundles/
  handoffs/
  plans/
  verification/
  decisions/
```

Use the recipe's `artifact_root` when one is declared.

If no recipe is active, choose the smallest fitting folder:

- `plans/` for implementation or exploration plans
- `context-bundles/` for stitched handoff context
- `handoffs/` for summaries another agent or session should consume
- `verification/` for evidence and validation results
- `decisions/` for hold/confirm/escalation notes

### 3. Write From the Template

Use the template as the writing scaffold:

- keep the contract shape recognizable
- fill only the fields or sections needed for the task
- prefer Markdown artifacts unless a language-specific projection is explicitly
  required

If you want a fast file-first starting point, scaffold from the toolkit:

```bash
agent-toolkit contracts scaffold <contract-id> [name]
```

Use `--out` when the recipe or repo expects a specific path.

Then validate the artifact structure with:

```bash
agent-toolkit contracts validate <contract-id> <artifact-path>
```

Treat this as structure validation first, not a replacement for domain review.

If a Python host needs typed contract objects, generate an optional projection:

```bash
agent-toolkit contracts emit-pydantic <contract-id>
```

Keep that layer removable.

### 4. Keep Contracts File-First

Bias toward:

- durable files over hidden runtime memory
- inspectable Markdown over opaque internal objects
- host-neutral structure over tool-specific serialization

Typed validation may be useful, but it should remain a projection of the
contract, not the authored source of truth.

### 5. Escalate Only When Needed

Stronger validation is appropriate when:

- the recipe's contract mode is `validated`
- the artifact will drive downstream execution
- another agent will consume it mechanically
- the workflow is high-stakes enough that structure drift would hurt

In those cases, a contract-aware specialist or backend can validate the output.

If the workflow exposes a hidden `Contractor` specialist, use it to:

- resolve canonical contract paths
- prepare downstream artifact instructions
- flag missing or weak structure

If the host is Python-heavy, `Contractor` may hand off to an optional
Pydantic-based projection layer without changing the canonical contract source.

## Storage Rules

- Treat `.agent-artifacts/` as durable working output, not scratch space
- Prefer one artifact per meaningful handoff or evidence object
- Use clear filenames tied to the task or date when needed
- Avoid burying contract-backed outputs in chat-only summaries

## Anti-Patterns

- Hiding canonical contract definitions inside `.agents/skills/...`
- Treating Pydantic or runtime types as the contract source of truth
- Writing durable handoffs only as casual prose in chat
- Creating heavy structured artifacts for trivial tasks
- Letting artifact storage become a second task tracker

## References

- `contracts/README.md`
- `recipes/README.md`
- `references/artifact-storage.md`
- `../../CONTRACTOR_SPECIALIST_DESIGN.md`
