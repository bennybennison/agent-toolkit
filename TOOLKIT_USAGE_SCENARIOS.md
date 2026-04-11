# Toolkit Usage Scenarios

## Purpose

This document captures how `agent-toolkit` is currently expected to be used
across host setups, based on the implementation that exists today.

It is a working audit artifact, not polished user-facing documentation.

Use it to record:
- expected lifecycle steps
- generated and shared artifacts
- user interpretation of the current flow
- ambiguities, risks, and gaps discovered during analysis

## Scope

This is an audit artifact for current toolkit behavior.

It describes:
- what the current CLI and generators do
- how a user is likely to interpret that behavior
- where that interpretation breaks down

It does not try to present future-state or idealized onboarding.

## Simulation Method

This audit currently uses a scenario-simulation method rather than a single
generic review pass.

The method is:
- identify a concrete user or team situation
- assume a specific user identity with one dominant concern
- walk the current command path and generated artifacts
- ask what the user would expect to happen next
- compare that expectation with current implemented behavior
- record gaps as scenario ambiguities and linked issue IDs
- repeat with a different identity until the problem space feels saturated

Current simulation identities:
- New adopter:
  Looks for first-run confusion, missing quickstarts, and unclear first actions.
- Solo maintainer:
  Looks for lifecycle gaps, uninstall anxiety, and cleanup confidence.
- Teammate without toolkit:
  Looks for portability, shareability, and “can I still use this repo?” risks.
- Teammate with toolkit:
  Looks for regeneration drift, version mismatch, and ownership conflicts.
- Custom-content owner:
  Looks for collisions with existing skills, prompts, rules, agents, and MCP config.
- Effectiveness reviewer:
  Looks for evidence that toolkit improves outcomes rather than only installing files.

Synthesis rule:
- Each simulation produces local observations.
- Repeated observations become linked issue IDs.
- Cross-scenario patterns become higher-level product questions.
- Once an ambiguity turns into a chosen direction, the affected scenarios should link to that decision as well as the underlying issues.

Potential future agent:
- A dedicated multi-persona scenario simulator would be useful here.
- Its job would be to identify likely use cases, simulate them through different reviewer identities, produce granular findings, and then consolidate those findings into a shared issue map and comparison matrix.
- The key value would be breadth plus synthesis, not just one deep review from one perspective.
- That issue map should classify each item by type, priority, blocked-by state, and any subtasks so the output can drive execution rather than only discussion.

## Scenario Index

- [S-001 Single user in VS Code + GitHub Copilot](#s-001-single-user-in-vs-code--github-copilot)
- [S-002 Single user in Codex](#s-002-single-user-in-codex)
- [S-003 Single user in OpenCode](#s-003-single-user-in-opencode)
- [S-004 Single user uses all hosts at once](#s-004-single-user-uses-all-hosts-at-once)
- [S-005 Single user wants to uninstall everything cleanly](#s-005-single-user-wants-to-uninstall-everything-cleanly)
- [S-006 Shared repo: second user does not have toolkit installed](#s-006-shared-repo-second-user-does-not-have-toolkit-installed)
- [S-007 Shared repo: second user does have toolkit installed](#s-007-shared-repo-second-user-does-have-toolkit-installed)
- [S-008 Existing repo already has `.github/` and `.vscode/` config](#s-008-existing-repo-already-has-github-and-vscode-config)
- [S-009 Generated files have been manually edited](#s-009-generated-files-have-been-manually-edited)
- [S-010 Teammates use different toolkit versions, profiles, or pack selections](#s-010-teammates-use-different-toolkit-versions-profiles-or-pack-selections)
- [S-011 Single user installs VS Code surface globally](#s-011-single-user-installs-vs-code-surface-globally)
- [S-012 Single user installs Codex surface globally](#s-012-single-user-installs-codex-surface-globally)
- [S-013 Existing repo already has `opencode.json`](#s-013-existing-repo-already-has-opencodejson)
- [S-014 Single user attaches toolkit to a plain repo with no toolkit scaffold](#s-014-single-user-attaches-toolkit-to-a-plain-repo-with-no-toolkit-scaffold)
- [S-015 Single user already has custom skills, rules, or prompts before adopting toolkit](#s-015-single-user-already-has-custom-skills-rules-or-prompts-before-adopting-toolkit)
- [S-016 Single user wants to remove only toolkit-created instruction assets and preserve custom ones](#s-016-single-user-wants-to-remove-only-toolkit-created-instruction-assets-and-preserve-custom-ones)
- [S-017 Single user changes profile or pack selection over time](#s-017-single-user-changes-profile-or-pack-selection-over-time)
- [S-018 Existing repo already has custom `.github/agents`, `.github/prompts`, Codex plugin, or MCP config](#s-018-existing-repo-already-has-custom-githubagents-githubprompts-codex-plugin-or-mcp-config)
- [S-019 Repo has toolkit-like surfaces but no install registry, so ownership is inferred](#s-019-repo-has-toolkit-like-surfaces-but-no-install-registry-so-ownership-is-inferred)
- [S-020 Team wants to decide what gets committed and what stays local](#s-020-team-wants-to-decide-what-gets-committed-and-what-stays-local)
- [S-021 User wants to review whether toolkit is actually improving results over time](#s-021-user-wants-to-review-whether-toolkit-is-actually-improving-results-over-time)
- [S-022 Team wants comparable effectiveness review across hosts](#s-022-team-wants-comparable-effectiveness-review-across-hosts)
- [S-023 User wants to disable one toolkit capability family without removing the whole host surface](#s-023-user-wants-to-disable-one-toolkit-capability-family-without-removing-the-whole-host-surface)
- [S-024 User-authored custom instructions conflict with toolkit-provided instructions](#s-024-user-authored-custom-instructions-conflict-with-toolkit-provided-instructions)
- [S-025 User follows the documented global Codex install syntax literally](#s-025-user-follows-the-documented-global-codex-install-syntax-literally)
- [S-026 Team wants global structured logging for reviews, effectiveness, and cleanup confidence](#s-026-team-wants-global-structured-logging-for-reviews-effectiveness-and-cleanup-confidence)

## Scenario Review Matrix

Score legend:
- `High` means relatively strong or clear today.
- `Medium` means workable but uneven.
- `Low` means a notable gap or risk.

Priority legend:
- `P1` means urgent or foundational enough to address soon.
- `P2` means important, but can follow the first wave.
- `P3` means useful later once sharper blockers are handled.

| Scenario slice | Priority | Onboarding clarity | Ownership clarity | Uninstall confidence | Team-share safety | Effectiveness support | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VS Code + Copilot | P1 | Low | Medium | Low | Medium | Low | Strong generated surface, weak first human action. |
| Codex | P1 | Low | Medium | Low | Medium | Low | Plugin generation exists, handoff remains implicit. |
| OpenCode | P2 | Medium | Low | Low | Low | Medium | Stronger lifecycle shape, but ownership and uninstall are uneven. |
| All hosts at once | P2 | Low | Low | Low | Low | Low | Broadly possible, weak source-of-truth model. |
| Uninstall everything | P1 | Low | Low | Low | Medium | Low | Cleanup paths are fragmented and incomplete. |
| Shared repo, no local toolkit | P2 | Medium | Low | Medium | Low | Low | Some artifacts may still work, but lifecycle is blocked. |
| Shared repo, teammate has toolkit | P2 | Medium | Low | Medium | Low | Low | Regeneration drift and inferred ownership stay risky. |
| Custom content coexistence | P1 | Low | Low | Low | Low | Low | Major documentation gap before this pass; still unresolved operationally. |
| Selective removal of toolkit-only assets | P1 | Low | Low | Low | Medium | Low | Partial mechanics exist, but not as a safe user story. |
| Effectiveness review across hosts | P2 | Low | Medium | Medium | Medium | Low | Observability exists, but mostly in an OpenCode-shaped form. |
| Literal global Codex install flow | P1 | Low | Medium | Low | Medium | Low | The documented flag-only syntax currently misparses and creates invalid state. |
| Global structured logging | P3 | Low | Medium | Medium | Medium | Low | Manual logs can be created today, but toolkit does not provide a first-class global logging workflow. |

## S-001 Single user in VS Code + GitHub Copilot

- User:
  A single developer working locally in VS Code with GitHub Copilot Chat.
- Goal:
  Use `agent-toolkit` to generate a Copilot and VS Code working surface for one repo.
- Preconditions:
  The user has the toolkit available locally and can run `agent-toolkit`.
- Primary command path:
  `agent-toolkit attach . --tools copilot,vscode`
- Generated/shared artifacts:
  `.github/copilot-instructions.md`
  `.github/instructions/`
  `.github/agents/`
  `.github/prompts/`
  `.github/prompts/review-issue.prompt.md`
  `.vscode/settings.json`
  `.vscode/mcp.json`
  `.agent-toolkit/state/tool-installs.json`
- Expected workflow:
  Attach toolkit surfaces.
  Open the repo in VS Code.
  Copilot reads the generated instruction surface.
  The user starts in Copilot Chat with a generated prompt such as `review-issue`, `review`, or `plan`.
- Expected outcome:
  The repo gets a project-local Copilot and VS Code surface without requiring framework-owned files, and issue review is discoverable through generated Copilot prompts and agents.
- Known ambiguities:
  VS Code is still mostly the editor and MCP shell rather than a standalone toolkit-agent surface.
  The first human action inside VS Code depends on opening Copilot Chat and using generated prompts or agents.
  Users may still look for a host-level mode picker instead of starting from generated Copilot prompts.
- Related issues:
  TK-001, TK-002, TK-003, TK-004, TK-005, TK-017, TK-018, TK-022, TK-023
- Related decisions:
  —

## S-002 Single user in Codex

- User:
  A single developer using Codex as the primary host.
- Goal:
  Generate a local Codex plugin surface for the current repo.
- Preconditions:
  The user has the toolkit available locally and Codex is expected to read project-local marketplace/plugin data.
- Primary command path:
  `agent-toolkit attach . --tools codex`
  or `agent-toolkit tools install codex . --scope project`
- Generated/shared artifacts:
  `.agents/plugins/marketplace.json`
  `plugins/agent-toolkit/.mcp.json`
  `plugins/agent-toolkit/.codex-plugin/plugin.json`
  `plugins/agent-toolkit/skills/review-issues/SKILL.md`
  `.agent-toolkit/state/tool-installs.json`
- Expected workflow:
  Generate the local plugin.
  Codex discovers the local marketplace and plugin definition.
  The user starts from a plugin-backed Codex environment with starter prompts and plugin-local review skills.
- Expected outcome:
  Codex sees a local plugin, gains access to toolkit-defined MCP capabilities for the repo, and can route issue/PR review through plugin prompts and skills.
- Known ambiguities:
  Codex does not expose toolkit agents as a visible picker the way users may expect from OpenCode or Copilot agents.
  The first in-tool action is much less explicit than Copilot or OpenCode unless starter prompts are surfaced clearly.
  Users may still expect a named `@code-reviewer` entry even though Codex receives a plugin workflow rather than an agent roster.
- Related issues:
  TK-001, TK-006, TK-014, TK-016, TK-018, TK-020
- Related decisions:
  —

## S-003 Single user in OpenCode

- User:
  A single developer using OpenCode as the primary host.
- Goal:
  Install toolkit support globally for OpenCode and attach project-local OpenCode config.
- Preconditions:
  The user can run `bun`, OpenCode global config exists or can be created, and the toolkit is available locally.
- Primary command path:
  Global: `agent-toolkit install`
  Project: `agent-toolkit attach . --tools opencode`
- Generated/shared artifacts:
  Global OpenCode config changes
  OpenCode plugin registration
  Rendered instruction files under the user config area
  Project-local `opencode.json`
  `.agent-toolkit/state/tool-installs.json`
- Expected workflow:
  Install toolkit globally for OpenCode.
  Attach the project-local OpenCode surface.
  OpenCode loads project rules plus rendered instructions from the global install.
- Expected outcome:
  OpenCode sees a dedicated toolkit-backed global install plus a project-specific `opencode.json`.
- Known ambiguities:
  This is the only host with a dedicated global install and uninstall flow today.
  The local `opencode.json` assumes project rule paths that are not clearly scaffolded by a separate init step.
  Existing `opencode.json` files may not be normalized consistently.
  OpenCode global install renders toolkit instruction assets into user config, which makes selective removal harder when user-authored content also exists nearby.
- Related issues:
  TK-001, TK-007, TK-010, TK-012, TK-013, TK-021, TK-023, TK-025, TK-026, TK-027, TK-033
- Related decisions:
  —

## S-004 Single user uses all hosts at once

- User:
  A single developer who wants one repo to support Copilot, VS Code, Codex, and OpenCode at the same time.
- Goal:
  Generate every supported host surface in one repo.
- Preconditions:
  The user has the toolkit available locally and can run attach or install commands for all desired hosts.
- Primary command path:
  `agent-toolkit attach .`
  or `agent-toolkit attach . --tools opencode,copilot,vscode,codex`
- Generated/shared artifacts:
  All project-local host surfaces
  `.agent-toolkit/state/tool-installs.json`
  Optional global OpenCode install state if used
- Expected workflow:
  Generate all project-local surfaces.
  Optionally install OpenCode globally.
  Move between host tools while using the same repo-local generated artifacts.
- Expected outcome:
  One repo supports multiple host experiences at once.
- Known ambiguities:
  There is no clear source-of-truth guidance when hosts expose overlapping concepts differently.
  The default `attach` behavior is broad, but the ownership and lifecycle of the generated surfaces are not explained.
  Multi-host use increases drift and cleanup complexity.
- Related issues:
  TK-005, TK-008, TK-009, TK-014, TK-016, TK-018
- Related decisions:
  —

## S-005 Single user wants to uninstall everything cleanly

- User:
  A single developer who wants to remove toolkit-managed host state from both the repo and local machine.
- Goal:
  Cleanly uninstall all toolkit-managed surfaces without leaving leftovers.
- Preconditions:
  Toolkit-managed project or global surfaces already exist.
- Primary command path:
  `agent-toolkit uninstall` for OpenCode global state
  `agent-toolkit tools prune ...` for project-local surfaces
- Generated/shared artifacts:
  Existing project-local host files
  Existing global OpenCode config, rendered instruction files, and shortcut
- Expected workflow:
  Remove OpenCode global registration.
  Prune project-local host surfaces.
  Confirm no leftover generated state remains.
- Expected outcome:
  The repo and local machine are returned to a clean pre-toolkit state.
- Known ambiguities:
  There is no single “remove everything” flow today.
  Project-local “remove all” is not clearly supported as a first-class command path.
  OpenCode uninstall appears not to remove every possible artifact.
  The cleanup story does not clearly separate toolkit-owned generated surfaces from user-authored custom skills, rules, or prompts.
- Related issues:
  TK-008, TK-009, TK-010, TK-011, TK-021, TK-025, TK-026, TK-033
- Related decisions:
  —

## S-006 Shared repo: second user does not have toolkit installed

- User:
  A collaborator pulling a repo that already contains toolkit-generated files, but who does not have `agent-toolkit` installed locally.
- Goal:
  Use the repo successfully without being blocked by missing toolkit binaries.
- Preconditions:
  Generated artifacts may already be committed by another user.
- Primary command path:
  Consume already-generated committed artifacts if present.
  Do not rely on re-running attach, sync, prune, or install flows locally.
- Generated/shared artifacts:
  `.github/*`
  `.vscode/*`
  `.agents/plugins/marketplace.json`
  `plugins/*`
  `.agent-toolkit/state/tool-installs.json` if committed
- Expected workflow:
  Pull the repo.
  Use whatever generated artifacts are already present.
  Avoid lifecycle management commands that require toolkit to be installed locally.
- Expected outcome:
  Some host surfaces remain usable even without the toolkit installed locally.
- Known ambiguities:
  Shared-vs-local ownership is currently unclear.
  It is not clear which generated files are meant to be committed and relied upon by teammates.
  A teammate without toolkit cannot safely manage lifecycle or regeneration.
- Related issues:
  TK-014, TK-015, TK-016, TK-018, TK-024, TK-030, TK-031
- Related decisions:
  —

## S-007 Shared repo: second user does have toolkit installed

- User:
  A collaborator pulling a repo that already contains toolkit-generated files and also has `agent-toolkit` installed locally.
- Goal:
  Work on the same repo without destabilizing another teammate’s generated host surfaces.
- Preconditions:
  Generated artifacts may already exist and may have been produced by another toolkit version, profile, or pack set.
- Primary command path:
  `agent-toolkit status`
  `agent-toolkit attach`
  `agent-toolkit sync`
  `agent-toolkit tools installed`
  `agent-toolkit tools prune`
- Generated/shared artifacts:
  Existing committed host surfaces
  Local or committed `.agent-toolkit/state/tool-installs.json`
- Expected workflow:
  Inspect current install state.
  Regenerate only if needed.
  Avoid clobbering teammate-owned or manually edited surfaces.
- Expected outcome:
  Teammates can share the same repo while understanding what is safe to regenerate.
- Known ambiguities:
  Version drift, profile drift, and pack drift can rewrite shared generated surfaces.
  Current tooling does not establish team-level policy for artifact ownership or regeneration.
- Related issues:
  TK-014, TK-016, TK-017, TK-018, TK-024, TK-029, TK-030, TK-031
- Related decisions:
  —

## S-008 Existing repo already has `.github/` and `.vscode/` config

- User:
  A developer applying toolkit surfaces to a repo that already has hand-written GitHub and VS Code configuration.
- Goal:
  Add toolkit support without destroying or obscuring existing repo configuration.
- Preconditions:
  `.github/` and `.vscode/` already exist and may contain user-owned settings.
- Primary command path:
  `agent-toolkit attach . --tools copilot,vscode`
- Generated/shared artifacts:
  New or updated `.github/*`
  New or updated `.vscode/settings.json`
  New or updated `.vscode/mcp.json`
- Expected workflow:
  Add toolkit-managed files while preserving or merging existing config.
- Expected outcome:
  Toolkit-generated host surfaces coexist cleanly with existing repo config.
- Known ambiguities:
  VS Code merge behavior is additive, not fully reconciliatory.
  Copilot generation writes template files directly and may not distinguish user-owned versus generated content.
- Related issues:
  TK-017, TK-022
- Related decisions:
  —

## S-009 Generated files have been manually edited

- User:
  A developer or teammate who has changed toolkit-generated files by hand after generation.
- Goal:
  Preserve intentional manual edits or at least avoid deleting them silently.
- Preconditions:
  Toolkit-generated files exist and some have diverged from recorded hashes or expected generated content.
- Primary command path:
  `agent-toolkit tools prune ...`
  `agent-toolkit sync ...`
- Generated/shared artifacts:
  Modified generated host files
  `.agent-toolkit/state/tool-installs.json`
- Expected workflow:
  Detect divergence from generated state.
  Avoid destructive cleanup of user-modified files.
- Expected outcome:
  Prune blocks unsafe removal and makes ownership conflicts visible.
- Known ambiguities:
  Prune is hash-based, but sync and regenerate behavior still leaves ownership unclear.
  There is no explicit “adopt manual edits” or “return to generated baseline” workflow.
- Related issues:
  TK-009, TK-014, TK-017, TK-022
- Related decisions:
  —

## S-010 Teammates use different toolkit versions, profiles, or pack selections

- User:
  Multiple collaborators using the same repo, but with different local toolkit environments or different command usage.
- Goal:
  Share repo-managed host surfaces without constant churn or conflicting regeneration.
- Preconditions:
  Different users may run `attach`, `sync`, or targeted installs with different defaults.
- Primary command path:
  `agent-toolkit attach`
  `agent-toolkit sync`
  `agent-toolkit tools install ... --packs ...`
- Generated/shared artifacts:
  Shared repo host surfaces
  Shared or local `.agent-toolkit/state/tool-installs.json`
- Expected workflow:
  Users regenerate surfaces consistently enough that committed artifacts stay stable.
- Expected outcome:
  Repo surfaces remain reproducible across collaborators.
- Known ambiguities:
  Different profiles and pack selections can change what gets generated.
  There is no explicit lockfile or project policy for active packs and host targets.
- Related issues:
  TK-014, TK-016, TK-018, TK-024, TK-029, TK-030, TK-031
- Related decisions:
  —

## S-011 Single user installs VS Code surface globally

- User:
  A developer who wants toolkit-managed VS Code settings available at the editor user level instead of per-repo only.
- Goal:
  Install toolkit-generated VS Code config into the VS Code user settings location.
- Preconditions:
  The user has the toolkit available locally and wants global VS Code state touched.
- Primary command path:
  `agent-toolkit tools install vscode --scope global`
- Generated/shared artifacts:
  Global `settings.json`
  Global `mcp.json`
  Global install registry entry
- Expected workflow:
  Generate VS Code config in the host default user settings directory.
- Expected outcome:
  VS Code user settings and MCP config gain toolkit-provided entries globally.
- Known ambiguities:
  Global VS Code lifecycle is supported technically but is not clearly presented as an onboarding path.
  There is no matching global uninstall command specific to VS Code.
- Related issues:
  TK-001, TK-011, TK-019
- Related decisions:
  —

## S-012 Single user installs Codex surface globally

- User:
  A developer who wants toolkit-managed Codex plugin state available at the home level.
- Goal:
  Install a toolkit-generated Codex plugin globally.
- Preconditions:
  The user has the toolkit available locally and wants home-level Codex plugin state.
- Primary command path:
  `agent-toolkit tools install codex --scope global`
- Generated/shared artifacts:
  Home-level `.agents/plugins/marketplace.json`
  Home-level `plugins/agent-toolkit/.mcp.json`
  Home-level `plugins/agent-toolkit/.codex-plugin/plugin.json`
  Home-level `plugins/agent-toolkit/skills/review-issues/SKILL.md`
  Global install registry entry
- Expected workflow:
  Generate a local marketplace and plugin under the user’s home area.
  Codex discovers the plugin and can surface starter prompts for review-oriented tasks.
- Expected outcome:
  Codex can discover a global toolkit plugin and offer a review-oriented plugin workflow, even though there is no standalone toolkit agent picker.
- Known ambiguities:
  Global Codex lifecycle is possible but not clearly documented.
  Users may expect a selectable issue-review agent, but the generated surface is a plugin with MCP plus skill entrypoints instead.
  There is no dedicated global uninstall flow for Codex.
- Related issues:
  TK-001, TK-011, TK-020
- Related decisions:
  —

## S-013 Existing repo already has `opencode.json`

- User:
  A developer adding toolkit support to a repo that already uses OpenCode.
- Goal:
  Merge toolkit expectations into the existing `opencode.json` without breaking current config.
- Preconditions:
  `opencode.json` already exists and may or may not include an `instructions` array.
- Primary command path:
  `agent-toolkit attach . --tools opencode`
- Generated/shared artifacts:
  Updated or untouched `opencode.json`
  `.agent-toolkit/state/tool-installs.json`
- Expected workflow:
  Toolkit updates `opencode.json` to include its expected instructions and removes legacy prefixes where possible.
- Expected outcome:
  Existing OpenCode repos become toolkit-aware without manual surgery.
- Known ambiguities:
  If `instructions` is absent, the current generator does not clearly backfill it.
  Merge behavior is partial and path-shape dependent.
- Related issues:
  TK-012, TK-013
- Related decisions:
  —

## S-014 Single user attaches toolkit to a plain repo with no toolkit scaffold

- User:
  A developer pointing `agent-toolkit` at a normal repo that has no existing `.agent-toolkit/` structure.
- Goal:
  Get a usable host surface from a clean starting point.
- Preconditions:
  The repo does not already contain `.agent-toolkit/rules/`, `.agent-toolkit/plans/`, or other toolkit project scaffolding.
- Primary command path:
  `agent-toolkit attach .`
  or `agent-toolkit attach . --tools <host>`
- Generated/shared artifacts:
  Host-specific generated surfaces
  `.agent-toolkit/state/tool-installs.json`
- Expected workflow:
  Run attach on a plain repo and expect the toolkit to provide enough scaffold for the chosen host to work.
- Expected outcome:
  The repo becomes toolkit-ready with minimal confusion.
- Known ambiguities:
  The attach flow records install state, but it does not clearly establish broader project scaffolding such as rules and plans before host usage assumes those paths.
  This is especially visible in OpenCode where generated instructions point at `.agent-toolkit/rules/*.md`.
- Related issues:
  TK-005, TK-012, TK-023
- Related decisions:
  —

## S-015 Single user already has custom skills, rules, or prompts before adopting toolkit

- User:
  A developer who already maintains custom instructions outside toolkit-managed content.
- Goal:
  Adopt `agent-toolkit` without losing ownership boundaries between custom content and toolkit-generated content.
- Preconditions:
  The repo or user config already contains custom rules, prompts, agents, skills, or MCP wiring that were not created by toolkit.
- Primary command path:
  `agent-toolkit attach . --tools <host>`
  or `agent-toolkit install`
- Generated/shared artifacts:
  Existing custom instruction content
  New toolkit-generated host surfaces
  Potentially rendered OpenCode instruction assets under user config
  `.agent-toolkit/state/tool-installs.json`
- Expected workflow:
  Keep custom content in place.
  Add toolkit-managed surfaces next to it.
  Understand which files remain user-owned and which are now toolkit-owned.
- Expected outcome:
  Toolkit can be adopted incrementally without flattening all instructions into one ambiguous ownership bucket.
- Known ambiguities:
  The current docs do not define a strong ownership model for custom content that coexists with toolkit-generated content.
  OpenCode global install materializes toolkit instruction assets in user config, which can feel similar to user-authored instruction content.
  There is no explicit boundary model for "my skills" versus "toolkit instructions rendered from packs."
- Related issues:
  TK-025, TK-028, TK-033
- Related decisions:
  —

## S-016 Single user wants to remove only toolkit-created instruction assets and preserve custom ones

- User:
  A developer who previously adopted toolkit but wants to keep their own custom instructions while removing toolkit-owned content.
- Goal:
  Remove toolkit-created instruction assets only, without disturbing user-authored skills, rules, prompts, or agents.
- Preconditions:
  Toolkit and non-toolkit instruction content coexist in the same repo or user config area.
- Primary command path:
  `agent-toolkit uninstall`
  `agent-toolkit tools prune ...`
- Generated/shared artifacts:
  Toolkit-generated host surfaces
  Toolkit-rendered OpenCode instruction assets
  User-authored instruction content in adjacent directories
- Expected workflow:
  Identify toolkit-owned artifacts reliably.
  Remove toolkit-owned artifacts only.
  Leave custom user content untouched.
- Expected outcome:
  Toolkit can be cleanly backed out without collateral damage to user-authored instructions.
- Known ambiguities:
  Current lifecycle commands are not presented as a selective-removal system for toolkit-only instruction assets.
  Project prune removes tracked generated paths, but not arbitrary custom content.
  OpenCode uninstall is host-specific and does not clearly define the survival policy for nearby instruction content.
- Related issues:
  TK-025, TK-026, TK-033
- Related decisions:
  —

## S-017 Single user changes profile or pack selection over time

- User:
  A developer who starts with one toolkit profile or pack set, then changes it later.
- Goal:
  Regenerate host surfaces predictably after profile or pack changes.
- Preconditions:
  Toolkit-managed surfaces already exist and the user later runs install or attach with different defaults or explicit `--packs`.
- Primary command path:
  `agent-toolkit attach`
  `agent-toolkit sync`
  `agent-toolkit tools install ... --packs ...`
- Generated/shared artifacts:
  Existing generated host surfaces
  `.agent-toolkit/state/tool-installs.json`
  Potentially different rendered instruction sets
- Expected workflow:
  Change the selected profile or packs.
  Regenerate surfaces intentionally.
  Understand which differences are expected versus accidental.
- Expected outcome:
  A single user can evolve their setup without losing reproducibility or clarity.
- Known ambiguities:
  There is no explicit reproducibility contract for pack-driven or profile-driven regeneration.
  Pack changes can alter behavior even when the user thinks they are only re-running an install.
  The docs currently frame this more as a team drift problem than a solo lifecycle problem.
- Related issues:
  TK-016, TK-029, TK-032
- Related decisions:
  —

## S-018 Existing repo already has custom `.github/agents`, `.github/prompts`, Codex plugin, or MCP config

- User:
  A developer applying toolkit to a repo that already contains custom host-specific instruction surfaces.
- Goal:
  Add toolkit support without overwriting or ambiguously merging with pre-existing host assets.
- Preconditions:
  The repo already contains custom `.github/agents`, `.github/prompts`, `.vscode/mcp.json`, `.agents/plugins/marketplace.json`, or `plugins/*`.
- Primary command path:
  `agent-toolkit attach . --tools <host>`
- Generated/shared artifacts:
  Existing custom host surfaces
  Toolkit-generated host surfaces
  `.agent-toolkit/state/tool-installs.json`
- Expected workflow:
  Detect overlapping host namespaces.
  Add toolkit-managed files without claiming ownership over unrelated user-created files.
- Expected outcome:
  Toolkit coexists safely with repo-local custom host integrations.
- Known ambiguities:
  The current docs do not separate "existing config" from "existing generated-like config" clearly enough.
  Host namespaces such as `.github/` and `.agents/plugins/` are shared team spaces, not toolkit-only areas.
  It is unclear when toolkit should merge, overwrite, infer ownership, or refuse to proceed.
- Related issues:
  TK-022, TK-028, TK-031
- Related decisions:
  —

## S-019 Repo has toolkit-like surfaces but no install registry, so ownership is inferred

- User:
  A developer entering a repo where toolkit-like files exist, but no explicit install registry proves they were generated by toolkit.
- Goal:
  Understand whether toolkit should manage those files or treat them as ambiguous.
- Preconditions:
  Matching host files exist, but `.agent-toolkit/state/tool-installs.json` is missing or incomplete.
- Primary command path:
  `agent-toolkit status`
  `agent-toolkit tools installed`
  `agent-toolkit tools prune`
- Generated/shared artifacts:
  Existing `.github/*`, `.vscode/*`, `plugins/*`, or `.agents/plugins/marketplace.json`
  Missing or partial install registry state
- Expected workflow:
  Inspect what toolkit thinks is installed.
  Distinguish recorded ownership from inferred ownership.
  Avoid destructive lifecycle actions on low-confidence inferred state.
- Expected outcome:
  Ownership heuristics are visible, and users understand the risk of acting on inferred state.
- Known ambiguities:
  The current implementation can infer installed targets from file presence.
  The docs do not yet give users a confidence model for inferred ownership.
  This can be confused with real recorded install state during cleanup or team collaboration.
- Related issues:
  TK-024, TK-031
- Related decisions:
  —

## S-020 Team wants to decide what gets committed and what stays local

- User:
  A team that wants a clear policy for committed generated surfaces, local machine state, and toolkit registry files.
- Goal:
  Decide what belongs in git and what should remain local-only.
- Preconditions:
  The repo may use one or more hosts and may already contain committed generated files.
- Primary command path:
  `agent-toolkit attach`
  `agent-toolkit sync`
  Git review of generated file changes
- Generated/shared artifacts:
  `.github/*`
  `.vscode/*`
  `.agents/plugins/marketplace.json`
  `plugins/*`
  `.agent-toolkit/state/tool-installs.json`
  User-level OpenCode config and rendered instructions
- Expected workflow:
  Classify each artifact as committed, ignored, or user-local.
  Align the team on regeneration rules.
  Avoid accidental commits of purely personal state.
- Expected outcome:
  The team has a stable policy for artifact ownership and source control.
- Known ambiguities:
  The docs do not currently define a commit policy for toolkit state and generated surfaces.
  Some artifacts are clearly user-local, while others are repo-local but still user-sensitive.
  The lack of policy increases churn and trust issues during review.
- Related issues:
  TK-014, TK-015, TK-016, TK-030
- Related decisions:
  —

## S-021 User wants to review whether toolkit is actually improving results over time

- User:
  A developer or team lead who wants to know whether toolkit-provided agents, prompts, and skills are helping.
- Goal:
  Review effectiveness using a repeatable framework rather than relying only on gut feel.
- Preconditions:
  Toolkit-managed behavior has been used for real tasks and some history or eval workflow exists.
- Primary command path:
  Review observability commands and eval-driven workflows where available.
- Generated/shared artifacts:
  Audit reports
  Eval notes
  Session history where supported
- Expected workflow:
  Compare sessions or outcomes over time.
  Identify loops, failures, regressions, or behavior improvements.
  Decide whether specific toolkit capabilities are worth keeping.
- Expected outcome:
  Toolkit adoption can be evaluated as an operational improvement, not just an install success.
- Known ambiguities:
  There is some effectiveness and observability content in the packs, but it is not represented as a first-class user journey in these docs.
  The current effectiveness tooling appears more OpenCode-oriented than host-neutral.
  There is no shared scorecard for host onboarding success, agent quality, or cleanup confidence.
- Related issues:
  TK-027, TK-034
- Related decisions:
  —

## S-022 Team wants comparable effectiveness review across hosts

- User:
  A team using more than one host who wants one review language for Copilot, Codex, and OpenCode outcomes.
- Goal:
  Compare whether toolkit improves behavior consistently across hosts.
- Preconditions:
  The same repo or work type is being exercised through multiple hosts.
- Primary command path:
  Review observability commands, generated host surfaces, and any available eval workflow.
- Generated/shared artifacts:
  Host-specific generated surfaces
  Any host-specific audit or review outputs
- Expected workflow:
  Define comparable success measures across hosts.
  Review host-specific strengths and gaps.
  Avoid assuming one host’s observability story applies everywhere.
- Expected outcome:
  Multi-host adoption can be assessed coherently instead of by anecdotes.
- Known ambiguities:
  The toolkit does not yet define host-neutral effectiveness metrics.
  Existing observability content is not clearly surfaced as part of Copilot or Codex journeys.
  This makes "all hosts at once" harder to evaluate than to install.
- Related issues:
  TK-018, TK-027, TK-034
- Related decisions:
  —

## S-023 User wants to disable one toolkit capability family without removing the whole host surface

- User:
  A developer who wants to keep toolkit installed but stop using one pack, skill family, or capability area.
- Goal:
  Deactivate a subset of toolkit behavior cleanly.
- Preconditions:
  Toolkit-managed host surfaces are already installed and multiple packs or capability families are active.
- Primary command path:
  `agent-toolkit attach`
  `agent-toolkit sync`
  `agent-toolkit tools install ... --packs ...`
- Generated/shared artifacts:
  Existing generated surfaces
  Pack-driven instruction content
  `.agent-toolkit/state/tool-installs.json`
- Expected workflow:
  Remove or replace one capability family.
  Regenerate surfaces intentionally.
  Confirm that unrelated toolkit behavior stays intact.
- Expected outcome:
  Users can tune toolkit behavior without treating every change as full uninstall/reinstall.
- Known ambiguities:
  The current docs do not present a clear "disable just this capability" story.
  Pack-level changes can have wide downstream effects on rendered instructions.
  Users may not know whether to think in terms of packs, profiles, or host targets.
- Related issues:
  TK-029, TK-032
- Related decisions:
  —

## S-024 User-authored custom instructions conflict with toolkit-provided instructions

- User:
  A developer or team who has custom instructions that overlap or disagree with toolkit behavior.
- Goal:
  Resolve conflicts without losing the benefits of either side.
- Preconditions:
  Both user-authored and toolkit-provided instructions are active in the same host or repo.
- Primary command path:
  Review generated instructions, pack content, and host surfaces.
- Generated/shared artifacts:
  User-authored instructions
  Toolkit-generated instructions
  Potentially rendered OpenCode instruction assets
- Expected workflow:
  Identify which instruction source is authoritative for a given behavior.
  Decide whether to merge, disable, or override toolkit-provided content.
  Preserve a stable mental model for the active behavior set.
- Expected outcome:
  Instruction conflicts are visible and manageable rather than silent.
- Known ambiguities:
  The docs do not define precedence when custom instructions and toolkit instructions disagree.
  Conflict resolution is especially murky when toolkit renders instruction assets into a shared user config space.
  There is no explicit review workflow for instruction conflicts beyond manual inspection.
- Related issues:
  TK-025, TK-028, TK-032, TK-033, TK-034
- Related decisions:
  —

## S-025 User follows the documented global Codex install syntax literally

- User:
  A developer who copies the documented or help-text shaped command for global Codex install without adding any extra positional directory.
- Goal:
  Install Codex globally using the obvious flag-only form.
- Preconditions:
  The user runs the CLI from the toolkit repo or from any working directory and expects `--scope global` to redirect installation to the home-level default root.
- Primary command path:
  `agent-toolkit tools install codex --scope global`
- Generated/shared artifacts:
  Intended:
  Home-level `.agents/plugins/marketplace.json`
  Home-level `plugins/agent-toolkit/.codex-plugin/plugin.json`
  Home-level `plugins/agent-toolkit/.mcp.json`
  Global install registry entry
  Actual currently observed:
  A stray install rooted at a literal local `--scope` directory
  A bogus global install registry entry pointing at that path
- Expected workflow:
  Run the documented command once and receive a valid home-level global Codex install.
- Expected outcome:
  A working global plugin with no confusing local side effects.
- Known ambiguities:
  The current argument parser treats the first positional after the target as `dirArg`, even when it is actually a flag.
  This makes the obvious CLI form unsafe and undermines trust in the lifecycle story.
  The failure mode is especially confusing because the command still reports success.
- Related issues:
  TK-020, TK-036
- Related decisions:
  —

## S-026 Team wants global structured logging for reviews, effectiveness, and cleanup confidence

- User:
  A developer or team lead who wants global logs that persist across repos, hosts, and review sessions.
- Goal:
  Capture install outcomes, review findings, effectiveness signals, and cleanup observations in a consistent global format.
- Preconditions:
  Toolkit is being used across multiple projects or hosts and anecdotal memory is no longer enough.
- Primary command path:
  Review log and effectiveness log maintained under global toolkit config.
- Generated/shared artifacts:
  Global review notes
  Structured effectiveness log rows
  Potential links to repo-local audits
- Expected workflow:
  Record each install, review, simulation, and cleanup run.
  Compare patterns across hosts and projects.
  Use those records to decide what to fix or deprecate.
- Expected outcome:
  Toolkit quality can be monitored over time rather than rediscovered from scratch each session.
- Known ambiguities:
  The toolkit has pieces of observability, but no first-class global logging workflow for cross-host review.
  Manual logging is possible today, but the structure and required fields are not standardized by the product.
  There is no automatic connection yet between local audits and a global review history.
- Related issues:
  TK-034, TK-035, TK-037
- Related decisions:
  —
