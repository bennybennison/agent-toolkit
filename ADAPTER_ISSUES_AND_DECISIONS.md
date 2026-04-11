# Adapter Issues And Decisions

## Purpose

This document records adapter-specific issues, options, recommendations, and
decision anchors for the host generators in `agent-toolkit`.

It complements the broader toolkit audit by isolating adapter behavior from:
- broader product positioning
- runtime-only framework behavior
- pack or audit-planner philosophy outside host generation

## Status Legend

- `open` — observed issue, no final direction yet
- `proposed` — recommendation exists, but not locked
- `decided` — direction chosen
- `deferred` — intentionally postponed

## Issue Metadata Model

- `Type`:
  - `bug`
  - `feature-gap`
  - `docs-gap`
  - `ux-gap`
  - `workflow-gap`
  - `ownership-gap`
  - `cleanup-gap`
  - `decision-gap`
- `Priority`:
  `P1`, `P2`, or `P3`
- `Blocked by`:
  issue IDs or `—`
- `Subtasks`:
  issue IDs or `—`

## Consolidated Priorities

- `P1` existing-state reconciliation:
  OpenCode and VS Code are most fragile when re-run against existing config, not on first install.
- `P1` ownership and lifecycle clarity:
  Copilot shared-surface writes and Codex global cleanup still need a clearer operating contract.
- `P2` host expectation-setting:
  Copilot, Codex, and VS Code each need their "first useful action" or "what this host actually provides" story to stay visible.

## Issue Index By Adapter

### Copilot

- AD-001 Copilot adapter lacks a clear adoption model for existing `.github/` content
- AD-002 Copilot file writes are direct and ownership-sensitive
- AD-003 Copilot first human action still depends on host knowledge

### Codex

- AD-004 Codex adapter host story is clearer, but still incomplete as a lifecycle
- AD-005 Codex uses a plugin workflow that differs from agent-based host expectations
- AD-006 Codex cleanup remains under-specified outside direct upsert behavior

### OpenCode

- AD-007 OpenCode existing-config reconciliation is incomplete
- AD-008 Existing `opencode.json` without `instructions` is not normalized
- AD-009 Existing `opencode.json` does not refresh agent model values on update
- AD-010 OpenCode adapter source-of-truth is blurred by an unused template file
- AD-014 OpenCode can miss real instruction changes when list length stays the same

### VS Code

- AD-011 VS Code adapter change management is incomplete over time
- AD-012 VS Code merge is additive and does not reconcile toolkit drift
- AD-013 VS Code has no adapter-owned human onboarding surface
- AD-015 VS Code write counts can over-report unchanged files

## AD-001 Copilot adapter lacks a clear adoption model for existing `.github/` content

- Status:
  open
- Type:
  workflow-gap
- Priority:
  P1
- Blocked by:
  —
- Subtasks:
  AD-002, AD-003
- Adapter:
  copilot
- Scenarios:
  A-001, A-002
- Expected:
  The adapter should make it clear how toolkit-owned Copilot files coexist with existing `.github/` files.
- Actual:
  The generator copies template files directly into `.github/` without an adapter-owned ownership protocol.
- Why it matters:
  Adoption into an existing repo can feel unsafe even when the write technically succeeds.
- Options:
  - A:
    Add explicit ownership and overwrite policy docs for Copilot surfaces.
  - B:
    Add adapter-side collision detection before writing.
- Recommendation:
  Start with explicit policy and then decide whether collision detection is still needed.
- Decision:
  —
- Evidence:
  `adapters/copilot/generate.ts`

## AD-002 Copilot file writes are direct and ownership-sensitive

- Status:
  open
- Type:
  ownership-gap
- Priority:
  P1
- Blocked by:
  —
- Subtasks:
  —
- Adapter:
  copilot
- Scenarios:
  A-001, A-002
- Expected:
  Re-running the adapter should have a clearly documented contract for user-edited Copilot files.
- Actual:
  The adapter writes rendered files directly into `.github/`.
- Why it matters:
  User-edited prompts, agents, or instructions can be hard to distinguish from toolkit-managed ones.
- Options:
  - A:
    Treat Copilot files as toolkit-owned unless explicitly forked.
  - B:
    Introduce a safer merge or marker strategy.
- Recommendation:
  Document the ownership contract first.
- Decision:
  —
- Evidence:
  `adapters/copilot/generate.ts`

## AD-003 Copilot first human action still depends on host knowledge

- Status:
  open
- Type:
  ux-gap
- Priority:
  P2
- Blocked by:
  —
- Subtasks:
  —
- Adapter:
  copilot
- Scenarios:
  A-001
- Expected:
  A new user should know how to start from generated prompts or agents.
- Actual:
  This has improved through quickstart guidance, but still depends on the user understanding Copilot Chat conventions.
- Why it matters:
  The adapter can be technically correct and still feel inert.
- Options:
  - A:
    Keep improving generated quickstart cues.
  - B:
    Add a stronger first-run prompt strategy.
- Recommendation:
  Keep the quickstart path, then re-evaluate after more usage.
- Decision:
  —
- Evidence:
  `adapters/copilot/templates/copilot-instructions.md`

## AD-004 Codex adapter host story is clearer, but still incomplete as a lifecycle

- Status:
  open
- Type:
  workflow-gap
- Priority:
  P1
- Blocked by:
  —
- Subtasks:
  AD-005, AD-006
- Adapter:
  codex
- Scenarios:
  A-003, A-004
- Expected:
  The adapter should support a clear install, discovery, and cleanup story for Codex.
- Actual:
  Local and global plugin generation are clearer now, but cleanup and stale-state handling remain mostly indirect.
- Why it matters:
  Plugin-based hosts accumulate trust debt when lifecycle edges are unclear.
- Options:
  - A:
    Keep Codex adapter support lightweight and document cleanup clearly.
  - B:
    Add explicit cleanup and stale-entry handling as part of the adapter story.
- Recommendation:
  Clarify lifecycle expectations first, then decide whether stronger cleanup automation is needed.
- Decision:
  —
- Evidence:
  `adapters/codex/generate.ts`

## AD-005 Codex uses a plugin workflow that differs from agent-based host expectations

- Status:
  open
- Type:
  ux-gap
- Priority:
  P2
- Blocked by:
  —
- Subtasks:
  —
- Adapter:
  codex
- Scenarios:
  A-003
- Expected:
  Users should understand that Codex gets a plugin workflow, not a visible toolkit-owned agent picker.
- Actual:
  The adapter now exposes prompts and skills, but host expectations can still be borrowed from Copilot or OpenCode.
- Why it matters:
  Misread mental models make successful installs look broken.
- Options:
  - A:
    Lean into prompts/skills and document that difference.
  - B:
    Try to emulate agent-list behavior where possible.
- Recommendation:
  Keep the plugin-native model and make it more explicit.
- Decision:
  —
- Evidence:
  `adapters/codex/templates/plugin.json`
  `adapters/codex/templates/skills/review-issues/SKILL.md`

## AD-006 Codex cleanup remains under-specified outside direct upsert behavior

- Status:
  open
- Type:
  cleanup-gap
- Priority:
  P1
- Blocked by:
  —
- Subtasks:
  —
- Adapter:
  codex
- Scenarios:
  A-004
- Expected:
  Global Codex installs should have a clear story for removing stale plugin state.
- Actual:
  The generator upserts the named plugin entry, but stale sibling entries can persist if created earlier or differently.
- Why it matters:
  Home-level plugin clutter undermines trust in lifecycle safety.
- Options:
  - A:
    Add explicit Codex cleanup guidance.
  - B:
    Add a dedicated cleanup command or prune path.
- Recommendation:
  Document the cleanup model first, then automate where churn is common.
- Decision:
  —
- Evidence:
  `adapters/codex/generate.ts`

## AD-007 OpenCode existing-config reconciliation is incomplete

- Status:
  open
- Type:
  workflow-gap
- Priority:
  P1
- Blocked by:
  —
- Subtasks:
  AD-008, AD-009, AD-014
- Adapter:
  opencode
- Scenarios:
  A-005, A-006
- Expected:
  Re-running the adapter on an existing `opencode.json` should reconcile it toward current toolkit expectations.
- Actual:
  The update path is much narrower than the create path.
- Why it matters:
  Existing repos can silently drift while still appearing adapter-compatible.
- Options:
  - A:
    Expand update behavior to normalize more of the file.
  - B:
    Keep the light-touch update path, but document its limits clearly.
- Recommendation:
  Tighten normalization for core fields the toolkit owns.
- Decision:
  —
- Evidence:
  `adapters/opencode/generate.ts`

## AD-008 Existing `opencode.json` without `instructions` is not normalized

- Status:
  open
- Type:
  bug
- Priority:
  P1
- Blocked by:
  —
- Subtasks:
  —
- Adapter:
  opencode
- Scenarios:
  A-006
- Expected:
  If `instructions` is missing, the adapter should create it.
- Actual:
  The update path only acts when `config.instructions` already exists.
- Why it matters:
  A valid but incomplete existing config can bypass the intended project rule path entirely.
- Options:
  - A:
    Always ensure an `instructions` array exists on update.
  - B:
    Fail loudly when `instructions` is missing instead of silently doing less.
- Recommendation:
  Normalize the field rather than silently skipping it.
- Decision:
  —
- Evidence:
  `adapters/opencode/generate.ts`

## AD-009 Existing `opencode.json` does not refresh agent model values on update

- Status:
  open
- Type:
  bug
- Priority:
  P1
- Blocked by:
  —
- Subtasks:
  —
- Adapter:
  opencode
- Scenarios:
  A-006
- Expected:
  Attach or sync should keep toolkit-owned model slots aligned with current routing inputs.
- Actual:
  The update path does not reconcile `agent.build.model` or `agent.plan.model` once the file already exists.
- Why it matters:
  Existing repos can keep stale or divergent model selections even when the generator is re-run.
- Options:
  - A:
    Reconcile toolkit-owned model slots on update.
  - B:
    Treat model fields as user-owned once the file exists and document that clearly.
- Recommendation:
  Clarify ownership first, then align the update path accordingly.
- Decision:
  —
- Evidence:
  `adapters/opencode/generate.ts`

## AD-010 OpenCode adapter source-of-truth is blurred by an unused template file

- Status:
  open
- Type:
  decision-gap
- Priority:
  P3
- Blocked by:
  —
- Subtasks:
  —
- Adapter:
  opencode
- Scenarios:
  A-006
- Expected:
  The adapter should have one obvious source of truth for emitted `opencode.json` structure.
- Actual:
  The repo still contains an OpenCode template file while the generator writes JSON directly.
- Why it matters:
  Dead or unused template assets create ambiguity during maintenance.
- Options:
  - A:
    Remove the unused template.
  - B:
    Refactor the generator to use the template consistently.
- Recommendation:
  Pick one source of truth and delete the other.
- Decision:
  —
- Evidence:
  `adapters/opencode/generate.ts`
  `adapters/opencode/templates/opencode.json`

## AD-014 OpenCode can miss real instruction changes when list length stays the same

- Status:
  open
- Type:
  bug
- Priority:
  P1
- Blocked by:
  —
- Subtasks:
  —
- Adapter:
  opencode
- Scenarios:
  A-006
- Expected:
  If the adapter removes a legacy instruction and adds the current instruction, it should persist that change.
- Actual:
  The update path only writes when `config.instructions.length !== original`, so a one-for-one replacement can be missed.
- Why it matters:
  A repo can appear to have been normalized while still retaining stale instruction paths.
- Options:
  - A:
    Detect content changes directly rather than using list length as the write condition.
  - B:
    Always rewrite the file after update-path normalization.
- Recommendation:
  Track actual content change, not just array length.
- Decision:
  —
- Evidence:
  `adapters/opencode/generate.ts`

## AD-011 VS Code adapter change management is incomplete over time

- Status:
  open
- Type:
  workflow-gap
- Priority:
  P1
- Blocked by:
  —
- Subtasks:
  AD-012, AD-013
- Adapter:
  vscode
- Scenarios:
  A-007, A-008
- Expected:
  Re-running the adapter should keep generated VS Code config aligned with toolkit intent while staying safe around user edits.
- Actual:
  The adapter chooses additive safety, but not full reconciliation.
- Why it matters:
  Safe-once behavior becomes stale-once behavior if adapter outputs evolve.
- Options:
  - A:
    Keep additive merge and document the refresh limits.
  - B:
    Add a richer reconciliation or ownership model.
- Recommendation:
  Document the current contract clearly, then decide if stronger reconciliation is worth the complexity.
- Decision:
  —
- Evidence:
  `adapters/vscode/generate.ts`

## AD-012 VS Code merge is additive and does not reconcile toolkit drift

- Status:
  open
- Type:
  workflow-gap
- Priority:
  P1
- Blocked by:
  —
- Subtasks:
  —
- Adapter:
  vscode
- Scenarios:
  A-008
- Expected:
  Template updates and generated MCP changes should have a clear path to reach existing configs.
- Actual:
  Missing keys and servers are added, but changed values are not reconciled and stale generated values are not removed.
- Why it matters:
  Users can reasonably assume "re-run the adapter" means "refresh toolkit defaults," when that is only partly true.
- Options:
  - A:
    Keep additive semantics and explain them more directly.
  - B:
    Track toolkit-owned VS Code entries more explicitly for later updates.
- Recommendation:
  Make the merge contract explicit before making it smarter.
- Decision:
  —
- Evidence:
  `adapters/vscode/generate.ts`

## AD-013 VS Code has no adapter-owned human onboarding surface

- Status:
  open
- Type:
  docs-gap
- Priority:
  P2
- Blocked by:
  —
- Subtasks:
  —
- Adapter:
  vscode
- Scenarios:
  A-007
- Expected:
  A VS Code-oriented user should know the first useful step after generation.
- Actual:
  The adapter writes editor config and MCP wiring, but no explicit user-facing quickstart surface of its own.
- Why it matters:
  Users can mistake a shell adapter for a workflow surface.
- Options:
  - A:
    Keep onboarding responsibility with Copilot or higher-level docs.
  - B:
    Add a light VS Code-specific onboarding hint somewhere in generated config or docs.
- Recommendation:
  Keep VS Code lightweight, but document its role as shell rather than workflow surface.
- Decision:
  —
- Evidence:
  `adapters/vscode/generate.ts`

## AD-015 VS Code write counts can over-report unchanged files

- Status:
  open
- Type:
  bug
- Priority:
  P2
- Blocked by:
  —
- Subtasks:
  —
- Adapter:
  vscode
- Scenarios:
  A-008
- Expected:
  The adapter summary should report files written only when the adapter actually created or changed them.
- Actual:
  `generateVSCodeSurface()` increments `filesWritten` and records the path whenever the file already exists, even if no merge change was made.
- Why it matters:
  CLI output and audit expectations can claim refresh work that never happened.
- Options:
  - A:
    Count only created or changed files.
  - B:
    Rename the metric to something broader such as touched-or-managed files.
- Recommendation:
  Keep the existing metric name and make the counting truthful.
- Decision:
  —
- Evidence:
  `adapters/vscode/generate.ts`
