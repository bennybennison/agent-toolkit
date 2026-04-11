---
description: Orchestrate specialist pipeline with schema-first handoffs and explicit approval gates
surface: user
---

Run a multi-agent pipeline for: $ARGUMENTS

Treat this as the explicit Orchestrator pipeline workflow.

Follow the orchestration patterns in `the `agent-orchestration` skill`.
Use handoff objects from `lib/contracts/handoff.ts`.

**Step 1 — Build TaskBrief and select style**

Construct a compact `TaskBrief` with scope, constraints, operation style, strategy, and Commander policy fields.

- Default to interactive style unless user requests autonomous execution.
- Include strategy when it is already known from planning or can be selected confidently.
- Respect Commander mode policy for escalation and mutation gates.

**Step 1.5 — Gather the evidence bundle**

Before invoking a specialist, decide whether it has the read access needed for the task. If not, gather a compact evidence bundle with targeted reads or `@researcher` and attach it to the stage payload.

The bundle should include only what the next stage needs:
- relevant file paths
- targeted excerpts or diffs with line numbers when available
- tests or failures that define expected behavior
- governance snippets (AGENTS.md / GOTCHAS.md / CONSTITUTION.md) when they constrain the work
- explicit scope boundaries and open questions

**Step 2 — Select the specialist pipeline**

Based on the task description, select the appropriate specialist route:

| Task Type | Pipeline |
|-----------|----------|
| New feature | `@mapper -> @builder -> @auditor -> @verifier` |
| Bug fix | `@mapper -> @builder -> @auditor -> @verifier` |
| Refactor | `@mapper -> @builder -> @auditor -> @verifier` |
| TDD feature | `@mapper -> @tdd-runner -> @auditor -> @verifier` |

If the task does not fit a preset pipeline, construct one from: `@mapper`, `@builder`, `@auditor`, `@verifier`, with optional supporting agents such as `@audit-planner`, `@architect`, `@build-fixer`, `@cleanup`, `@code-reviewer`, and `@tdd-runner`.

**Step 3 — Execute stages with schema handoffs**

For each stage in the pipeline:

1. Run the stage (delegate to the agent or execute the command) with the stage payload and any required evidence bundle
2. Emit the stage payload object:

```json
{
  "missionId": "{id}",
  "payloadType": "TaskBrief|MapReport|BuildProposal|AuditReport|VerificationReport",
  "payload": { "...": "schema fields from lib/contracts/handoff.ts" }
}
```

3. If any stage FAILS, stop the pipeline immediately — do not proceed with broken state
4. If low confidence triggers Commander escalation, apply mode policy (`stop-and-ask` or `downshift`) before continuing

**Step 4 — Final report**

After all stages complete:

```
PIPELINE COMPLETE
=================
Pipeline: {pipeline type}
Stages:   {N} of {N} completed
Status:   {DONE | FAILED at stage N}
Operation Style: {interactive | autonomous}

Stage Results:
  1. {stage name}: {status} — {summary}
  2. {stage name}: {status} — {summary}
  ...

Files Modified: {list}
Tests: {pass/fail}
Build: {pass/fail}
Decision Gate: {approved | rejected | requires-clarification}
```

**Key principles:**
- Author-bias elimination — the agent that wrote code must not review it (use separate agent invocations)
- Schema-first handoffs — pass compact typed payloads, not narrative context dumps
- Evidence-bundle discipline — do not expect tool-limited specialists to explore the repo without the code context they need
- Fail-fast — stop on first failure
- Minimal scope — each agent does one thing well
