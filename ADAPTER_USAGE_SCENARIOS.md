# Adapter Usage Scenarios

## Purpose

This document reviews the host adapters in `agent-toolkit` as adapters, not as
the broader product.

It focuses on:
- what each adapter actually generates or mutates
- what a user is likely to expect from that adapter
- where the adapter behavior is clear, incomplete, or risky
- which adapter issues and decision anchors each scenario relates to

This is an audit artifact, not polished user-facing documentation.

## Adapters In Scope

- `copilot`
- `codex`
- `opencode`
- `vscode`

## Review Method

Use the audit-planner philosophy for adapter review:
- inspect the implemented generator, not only docs
- compare intended host shape with actual generated artifacts
- consolidate similar observations
- classify each resulting issue by type
- prioritize what should be fixed first
- link scenarios to issue-level decision anchors

## Consolidated Themes

- Toolkit-owned files are clearest when the adapter writes into an obviously owned surface such as a Codex plugin folder; they are riskiest when they land directly in shared repo surfaces like `.github/`.
- Re-run behavior is the sharpest quality divider across adapters. Clean-install paths are mostly understandable; existing-config reconciliation is where the real bugs and drift show up.
- Hosts differ meaningfully in what "working" looks like. Copilot and Codex need better expectation-setting because their discovery surfaces are host-native rather than toolkit-native.
- The highest-priority adapter work is existing-state normalization, not new greenfield generation.

## Adapter Review Matrix

Priority legend:
- `P1` means the adapter has a foundational or user-visible gap worth addressing soon.
- `P2` means important, but not the sharpest blocker.
- `P3` means lower urgency or cleanup-level work.

Score legend:
- `High` means relatively strong or clear today.
- `Medium` means workable but uneven.
- `Low` means a notable gap or risk.

| Adapter slice | Priority | Setup clarity | Merge/update safety | Cleanup story | Human first action | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Copilot on a clean repo | P2 | Medium | Low | Low | Medium | Generates a rich surface, but relies on direct file writes. |
| Copilot with existing `.github/` content | P1 | Low | Low | Low | Low | Collision and overwrite behavior remains implicit. |
| Codex project-local plugin | P2 | Medium | Medium | Low | Medium | Plugin workflow is now clearer, but still unlike agent-based hosts. |
| Codex global plugin lifecycle | P1 | Medium | Medium | Low | Medium | Install is workable; stale plugin cleanup is still a manual concern. |
| OpenCode new project with no `opencode.json` | P2 | Medium | Medium | Medium | Medium | Happy path is fairly small and predictable. |
| OpenCode existing `opencode.json` | P1 | Low | Low | Medium | Low | Existing-config reconciliation is incomplete. |
| VS Code on a clean repo | P2 | Medium | Medium | Low | Low | Config generation is straightforward, but the editor itself is not the workflow surface. |
| VS Code with existing settings or MCP config | P1 | Low | Low | Low | Low | Additive merge avoids destructive edits, but drift is not reconciled. |

## A-001 Copilot on a clean repo

- Adapter:
  `copilot`
- User:
  A developer attaching toolkit to a repo with no existing `.github/` Copilot-specific content.
- Goal:
  Generate a usable Copilot working surface with instructions, prompts, and agents.
- Evidence:
  `adapters/copilot/generate.ts`
  `adapters/copilot/templates/`
- Expected workflow:
  Run the adapter.
  Open Copilot Chat.
  Start from generated prompts or agents.
- Observed behavior:
  The adapter copies templates directly into `.github/`.
  The generated surface is strong for prompt-led review and planning.
  The adapter is intentionally static and does not try to do runtime model routing.
- Risks / ambiguities:
  The adapter assumes direct file copy is acceptable.
  Cleanup and overwrite policy are not encoded here.
- Related issues:
  AD-001, AD-002, AD-003
- Related decisions:
  AD-001

## A-002 Copilot with existing `.github/` content

- Adapter:
  `copilot`
- User:
  A developer adopting toolkit in a repo that already has custom `.github/agents`, `.github/prompts`, or instructions.
- Goal:
  Add toolkit Copilot capability without silently trampling existing team content.
- Evidence:
  `adapters/copilot/generate.ts`
- Expected workflow:
  The adapter should make ownership and collision behavior obvious.
- Observed behavior:
  The adapter writes template files directly to `.github/`.
  It does not merge or classify existing content.
- Risks / ambiguities:
  User-owned and toolkit-owned Copilot files can be hard to distinguish.
  Re-runs can overwrite expectations even when the write path is technically valid.
- Related issues:
  AD-001, AD-002
- Related decisions:
  AD-001

## A-003 Codex project-local plugin

- Adapter:
  `codex`
- User:
  A developer generating a repo-local Codex plugin.
- Goal:
  Make toolkit capabilities discoverable in Codex without requiring framework-owned runtime files.
- Evidence:
  `adapters/codex/generate.ts`
  `adapters/codex/templates/plugin.json`
  `adapters/codex/templates/skills/review-issues/SKILL.md`
- Expected workflow:
  Generate marketplace entry, plugin manifest, MCP config, and plugin-local skills.
  Open Codex and use plugin prompts/skills.
- Observed behavior:
  The adapter now generates a clearer plugin workflow with review starter prompts and a review skill.
  It does not expose a toolkit-owned visible `@agent` picker.
- Risks / ambiguities:
  Users coming from OpenCode or Copilot may still expect a direct agent list.
  Plugin-style discovery depends on Codex marketplace/plugin behavior rather than repo docs alone.
- Related issues:
  AD-004, AD-005
- Related decisions:
  AD-004

## A-004 Codex global plugin lifecycle

- Adapter:
  `codex`
- User:
  A developer installing the Codex plugin globally under the home directory.
- Goal:
  Keep one durable toolkit-owned Codex plugin available across repos.
- Evidence:
  `adapters/codex/generate.ts`
  global marketplace/plugin paths under `~/.agents` and `~/plugins`
- Expected workflow:
  Install globally.
  Discover one stable plugin.
  Remove or refresh it cleanly when needed.
- Observed behavior:
  Install works.
  Marketplace upsert is scoped to the named plugin entry.
  Stale sibling plugin entries can remain if they were created by earlier flows.
- Risks / ambiguities:
  Cleanup is not a dedicated adapter flow.
  Users can accumulate stale plugin state outside the current generator's direct concern.
- Related issues:
  AD-004, AD-006
- Related decisions:
  AD-004

## A-005 OpenCode new project with no `opencode.json`

- Adapter:
  `opencode`
- User:
  A developer attaching toolkit to a repo with no existing OpenCode config.
- Goal:
  Generate a valid `opencode.json` with project-local instructions and model slots.
- Evidence:
  `adapters/opencode/generate.ts`
- Expected workflow:
  Create a minimal `opencode.json` that points at project-local rules and selected models.
- Observed behavior:
  The create path is small and predictable.
  It writes `instructions` plus `agent.build.model` and `agent.plan.model`.
- Risks / ambiguities:
  The adapter's happy path is fine, but it depends on project rule paths already being meaningful.
- Related issues:
  AD-007
- Related decisions:
  AD-007

## A-006 OpenCode existing `opencode.json`

- Adapter:
  `opencode`
- User:
  A developer re-running the adapter in a repo that already has `opencode.json`.
- Goal:
  Reconcile legacy paths and keep active settings aligned with current toolkit expectations.
- Evidence:
  `adapters/opencode/generate.ts`
- Expected workflow:
  Existing config should be normalized, not only left mostly alone.
- Observed behavior:
  The adapter only cleans legacy instruction prefixes if an `instructions` array already exists.
  It does not ensure `instructions` exists when missing.
  It does not refresh `agent.build` or `agent.plan` values for existing files.
  It only writes when the final `instructions` length changes, so replacing a legacy instruction with a current one can fail to persist.
- Risks / ambiguities:
  Existing configs can drift from current toolkit intent while still appearing healthy.
  Repeated attach/sync does not fully reconcile configuration state.
- Related issues:
  AD-007, AD-008, AD-009, AD-010, AD-014
- Related decisions:
  AD-007

## A-007 VS Code on a clean repo

- Adapter:
  `vscode`
- User:
  A developer generating project-local or global VS Code settings and MCP config.
- Goal:
  Seed a workable editor and MCP baseline without taking over the host.
- Evidence:
  `adapters/vscode/generate.ts`
  `templates/vscode/settings.json`
  `templates/vscode/mcp.json`
- Expected workflow:
  Generate baseline `settings.json` and `mcp.json`.
  Let the user continue from the editor or Copilot surface.
- Observed behavior:
  The adapter does this well enough on a clean target.
  MCP manifests are rendered appropriately for VS Code's input model.
- Risks / ambiguities:
  VS Code is the shell, not the real user workflow surface.
  Human onboarding depends on adjacent docs or Copilot prompts.
- Related issues:
  AD-011, AD-013
- Related decisions:
  AD-011

## A-008 VS Code with existing settings or MCP config

- Adapter:
  `vscode`
- User:
  A developer installing toolkit into a workspace or user profile that already has VS Code settings and MCP servers.
- Goal:
  Add toolkit capabilities without destructive overwrites, while still keeping the config current.
- Evidence:
  `adapters/vscode/generate.ts`
- Expected workflow:
  Merge safely and reconcile toolkit drift over time.
- Observed behavior:
  The adapter merges additively.
  It adds missing keys and servers, but does not reconcile changed template values or remove stale generated values.
  Its `filesWritten` result can also over-report work because existing unchanged files are still counted in the summary path.
- Risks / ambiguities:
  Additive merge is safe in the short term but can lock in drift.
  Users may think re-running the adapter refreshes toolkit defaults more completely than it does.
- Related issues:
  AD-011, AD-012, AD-015
- Related decisions:
  AD-011
