# Toolkit Issues And Decisions

## Purpose

This document tracks concrete gaps, conflicting guidance, options,
recommendations, and final decisions for `agent-toolkit`.

It is a working audit artifact, not polished user-facing documentation.

Use it to:
- record implementation-backed issues
- cross-reference scenario failures and ambiguities
- preserve rejected options instead of re-opening the same debate later
- provide stable decision anchors that scenario records can link to once a direction is chosen

## Status Legend

- `open` — observed issue, no final decision yet
- `proposed` — recommendation exists, but not locked
- `decided` — direction chosen
- `deferred` — intentionally postponed

## Issue Metadata Model

Use these fields when recording or consolidating issues so the review produces a usable backlog instead of only narrative notes.

- `Type`:
  classify the issue clearly so routing and ownership are easier.
  Suggested values:
  - `bug` — incorrect implemented behavior
  - `feature-gap` — an expected capability is missing
  - `docs-gap` — the behavior exists, but the docs/onboarding do not explain it well enough
  - `ux-gap` — the capability exists, but the human flow is confusing or too implicit
  - `workflow-gap` — multi-step lifecycle or operating flow is incomplete or unclear
  - `ownership-gap` — responsibility, precedence, or artifact ownership is unclear
  - `cleanup-gap` — uninstall, prune, or rollback behavior is incomplete
  - `decision-gap` — product intent is unresolved, so downstream guidance stays unstable
- `Priority`:
  use `P1`, `P2`, or `P3`
- `Blocked by`:
  list prerequisite issue IDs or `—`
- `Subtasks`:
  list child issue IDs or `—`

Consolidation rule:
- Some findings should become subtasks instead of standalone top-level issues.
- If an issue cannot be resolved independently, record what it is blocked by.
- Prefer one strong parent issue with explicit subtasks over several weak duplicates.

## Issue Index By Area

### Onboarding

- TK-001 No explicit host-specific onboarding guide
- TK-002 No clear first human action for VS Code + Copilot
- TK-003 Copilot generated surface guides the agent, not the human
- TK-006 Codex first-run workflow is unclear after plugin generation
- TK-019 Global VS Code install is under-documented
- TK-020 Global Codex install is under-documented
- TK-023 Project scaffold expectations are implicit, not explicitly initialized

### Host Lifecycle

- TK-005 `attach` defaults to all hosts instead of a host-specific happy path
- TK-007 OpenCode is the only host with a dedicated global lifecycle flow
- TK-008 No single clean “uninstall everything” command
- TK-009 No first-class “remove all project surfaces” path
- TK-010 OpenCode uninstall appears incomplete
- TK-011 No global uninstall path for Codex or VS Code surfaces
- TK-013 Existing `opencode.json` without an `instructions` array may not be updated
- TK-021 Host cleanup behavior is uneven across generators

### Custom Content Ownership

- TK-025 No explicit model for custom skills coexisting with toolkit-owned instruction assets
- TK-026 No first-class selective removal path for toolkit-owned instruction assets only
- TK-028 No documented ownership boundary for generated host instruction files versus user-authored ones
- TK-031 Inferred ownership can incorrectly classify pre-existing host files as toolkit-managed
- TK-032 No disable or deactivate story for a subset of toolkit capabilities
- TK-033 No documented boundary between toolkit-rendered OpenCode instructions and nearby user-authored content

### Effectiveness And Review

- TK-027 Effectiveness review exists, but is OpenCode-centric rather than host-neutral
- TK-029 Pack and profile changes alter behavior without a clear reproducibility contract
- TK-030 No clear commit policy for toolkit state and generated surfaces
- TK-034 No host-neutral review scorecard for onboarding, agent quality, and cleanup confidence
- TK-035 No reusable multi-persona scenario-simulation workflow for design review
- TK-037 No first-class global logging workflow for cross-host review effectiveness

### Shared Ownership And Drift

- TK-014 Shared repo artifact ownership is unclear
- TK-015 Teammate without toolkit can consume some generated files but cannot manage lifecycle
- TK-016 Team drift risk across toolkit versions, profiles, and pack selection
- TK-017 VS Code config merge is additive and may not propagate template updates cleanly
- TK-018 “All hosts at once” lacks source-of-truth guidance
- TK-022 Existing `.github/` conventions can collide with generated Copilot files
- TK-024 Inferred installs can misrepresent ownership in shared repos

### Host-Specific Setup

- TK-004 VS Code MCP setup lacks auth, value, and onboarding explanation
- TK-012 OpenCode local generation assumes `.agent-toolkit/rules/*.md` but no clear project-init flow creates that structure
- TK-036 `tools install <target> --scope global` misparses flags as a directory argument

## TK-001 No explicit host-specific onboarding guide

- Status:
  open
- Area:
  onboarding
- Scenarios:
  S-001, S-002, S-003, S-011, S-012
- Expected:
  A new user should have a clear host-specific quickstart that says what to run first and what to do next.
- Actual:
  The toolkit exposes generic CLI verbs and host generators, but no clear host-specific onboarding guide exists.
- Why it matters:
  New users have to infer the intended path from generated artifacts and adapter behavior.
- Options:
  - A:
    Add host-specific quickstart docs and surface them from the root README.
  - B:
    Add host-specific guided CLI subcommands or richer help output first.
- Recommendation:
  Start with docs first, then decide whether CLI affordances are still needed.
- Decision:
  —
- Notes:
  This affects every host, but the pain is highest in Copilot, Codex, and global installs.

## TK-002 No clear first human action for VS Code + Copilot

- Status:
  open
- Area:
  onboarding
- Scenarios:
  S-001
- Expected:
  After generating Copilot and VS Code files, the user should know what to open or type first in VS Code.
- Actual:
  The likely first step is “open Copilot Chat and use a generated prompt,” but this is not stated explicitly.
- Why it matters:
  The generated surface can exist and still feel unusable if the first human action is unclear.
- Options:
  - A:
    Add a human-facing quickstart section to the generated Copilot instructions.
  - B:
    Add a dedicated first-run prompt such as `start` to the Copilot prompt set and document it.
- Recommendation:
  Add a first-run prompt and human-facing quickstart guidance together.
- Decision:
  —
- Notes:
  The current toolkit content has a `start` concept, but it is not surfaced as an obvious Copilot first action.

## TK-003 Copilot generated surface guides the agent, not the human

- Status:
  open
- Area:
  onboarding
- Scenarios:
  S-001
- Expected:
  The generated Copilot surface should help both the model and the human operator understand the intended workflow.
- Actual:
  `copilot-instructions.md` mostly instructs the agent what to read and how to behave.
- Why it matters:
  A good agent surface can still be a poor onboarding surface for the human user.
- Options:
  - A:
    Keep agent instructions separate and add a human quickstart file.
  - B:
    Blend human onboarding into `copilot-instructions.md`.
- Recommendation:
  Prefer a separate human quickstart to avoid overloading the agent instruction file.
- Decision:
  —
- Notes:
  This is a Copilot-specific usability issue rather than a generic toolkit problem.

## TK-004 VS Code MCP setup lacks auth, value, and onboarding explanation

- Status:
  open
- Area:
  host-specific setup
- Scenarios:
  S-001, S-011
- Expected:
  Users should know what `.vscode/mcp.json` adds, what requires auth, and what experience improvement to expect.
- Actual:
  The generated MCP config adds servers, but the toolkit does not explain auth expectations or first-run value.
- Why it matters:
  Users may ignore the MCP config, distrust it, or fail to complete auth and then conclude the setup is broken.
- Options:
  - A:
    Add user-facing VS Code MCP onboarding docs.
  - B:
    Add comments or companion markdown that explain the generated config.
- Recommendation:
  Add user-facing docs first; only annotate config if editor behavior supports it cleanly.
- Decision:
  —
- Notes:
  The current default MCP config includes `context7`, `gh_grep`, and GitHub Copilot’s MCP endpoint.

## TK-005 `attach` defaults to all hosts instead of a host-specific happy path

- Status:
  open
- Area:
  host lifecycle
- Scenarios:
  S-001, S-004, S-014
- Expected:
  A new user should be able to follow a narrow happy path without unintentionally generating unrelated host surfaces.
- Actual:
  `attach` defaults to `all`, which broadens the generated surface unless the user passes `--tools`.
- Why it matters:
  The broad default is convenient for power users but muddy for onboarding and ownership.
- Options:
  - A:
    Keep `attach` broad but document host-specific commands more clearly.
  - B:
    Change `attach` default behavior to a narrower host set or require explicit host choice.
- Recommendation:
  Clarify the host-specific happy paths before deciding whether the default should change.
- Decision:
  —
- Notes:
  The current default makes the “single host” stories less obvious than they should be.

## TK-006 Codex first-run workflow is unclear after plugin generation

- Status:
  open
- Area:
  onboarding
- Scenarios:
  S-002, S-012
- Expected:
  After Codex plugin generation, the user should know how Codex discovers and uses the local or global plugin.
- Actual:
  The toolkit generates marketplace and plugin files, but the first user step after generation is implicit.
- Why it matters:
  Successful file generation does not guarantee a usable first-run experience.
- Options:
  - A:
    Add Codex-specific quickstart docs.
  - B:
    Add a validation or inspect command that confirms the Codex plugin is discoverable.
- Recommendation:
  Document the discovery path first, then decide if validation tooling is needed.
- Decision:
  —
- Notes:
  This gap exists for both project-local and global Codex installs.

## TK-007 OpenCode is the only host with a dedicated global lifecycle flow

- Status:
  open
- Area:
  host lifecycle
- Scenarios:
  S-003
- Expected:
  Global lifecycle expectations should be clear and symmetrical across hosts that support global state.
- Actual:
  OpenCode has explicit `install` and `uninstall`, while other hosts rely mainly on targeted install/prune patterns.
- Why it matters:
  The toolkit feels architecturally uneven and users may over-assume parity where none exists.
- Options:
  - A:
    Keep OpenCode special because it genuinely requires global setup.
  - B:
    Create clearer lifecycle framing for all hosts even if the actual mechanics differ.
- Recommendation:
  Keep the implementation asymmetry if needed, but document lifecycle symmetry at the UX level.
- Decision:
  —
- Notes:
  This issue is about user expectation and product shape more than code correctness.

## TK-008 No single clean “uninstall everything” command

- Status:
  open
- Area:
  host lifecycle
- Scenarios:
  S-004, S-005
- Expected:
  Users should be able to remove all toolkit-managed state through one obvious command path.
- Actual:
  Global OpenCode uninstall and project prune are separate and incomplete pieces.
- Why it matters:
  Cleanup anxiety increases when installation is easy but removal is fragmented.
- Options:
  - A:
    Add a first-class “remove everything” command.
  - B:
    Keep separate commands but provide a documented, explicit full-removal recipe.
- Recommendation:
  Start with a documented full-removal recipe, then evaluate whether a single command is still necessary.
- Decision:
  —
- Notes:
  This is a broad lifecycle issue and should not be reduced to OpenCode only.

## TK-009 No first-class “remove all project surfaces” path

- Status:
  open
- Area:
  host lifecycle
- Scenarios:
  S-005, S-009
- Expected:
  Users should be able to remove all project-local toolkit-generated surfaces in one explicit project-level action.
- Actual:
  `tools prune` is safety-based and target-oriented, but there is no clearly supported “remove all” project path.
- Why it matters:
  Partial lifecycle tooling makes project-local cleanup awkward and unclear.
- Options:
  - A:
    Add an explicit project-level “remove all toolkit surfaces” command.
  - B:
    Document a supported prune-based workflow for full project cleanup.
- Recommendation:
  Make the intended removal path explicit before adding new behavior.
- Decision:
  —
- Notes:
  Current CLI shape does not make “desired targets = none” obvious or first-class.

## TK-010 OpenCode uninstall appears incomplete

- Status:
  open
- Area:
  host lifecycle
- Scenarios:
  S-003, S-005
- Expected:
  OpenCode uninstall should remove all toolkit-created global OpenCode state or clearly document leftovers.
- Actual:
  Likely leftovers include the CLI shortcut, rendered instruction directory, and copied global config.
- Why it matters:
  Users may think uninstall is complete when it only removes part of the global footprint.
- Options:
  - A:
    Expand uninstall to remove all generated global artifacts.
  - B:
    Leave some artifacts in place but document that policy explicitly.
- Recommendation:
  Either fully remove generated artifacts or explicitly classify the survivors as intentional.
- Decision:
  —
- Notes:
  The current uninstall removes plugin registration, filtered instructions, package dependency, and registry state, but not every generated byproduct.

## TK-011 No global uninstall path for Codex or VS Code surfaces

- Status:
  open
- Area:
  host lifecycle
- Scenarios:
  S-005, S-011, S-012
- Expected:
  If global install is supported, global removal should also be supported clearly.
- Actual:
  VS Code and Codex have global install pathways but no dedicated global uninstall command.
- Why it matters:
  Global state without symmetric cleanup creates trust and maintenance problems.
- Options:
  - A:
    Add explicit global uninstall support for each applicable host.
  - B:
    Keep cleanup manual but document the exact file and registry paths.
- Recommendation:
  Prefer explicit uninstall support if global install remains a promoted path.
- Decision:
  —
- Notes:
  This is distinct from the broader “remove everything” issue.

## TK-012 OpenCode local generation assumes `.agent-toolkit/rules/*.md` but no clear project-init flow creates that structure

- Status:
  open
- Area:
  host-specific setup
- Scenarios:
  S-003, S-013, S-014
- Expected:
  A plain repo should have a clear, supported path to whatever project rules structure OpenCode expects.
- Actual:
  Local `opencode.json` generation points at `.agent-toolkit/rules/*.md`, but the broader rule scaffold is not explained as part of project init.
- Why it matters:
  A technically valid generated config can still be conceptually broken to users if its expected companion structure is not established.
- Options:
  - A:
    Create project rule scaffolding as part of attach/init.
  - B:
    Keep the path assumption but document how and when those rule files should appear.
- Recommendation:
  Decide whether rules are required or optional, then align generation and onboarding.
- Decision:
  —
- Notes:
  Attach does create `.agent-toolkit/state/tool-installs.json`, but not a broader obvious rules/plans scaffold for the user.

## TK-013 Existing `opencode.json` without an `instructions` array may not be updated

- Status:
  open
- Area:
  host lifecycle
- Scenarios:
  S-003, S-013
- Expected:
  Existing OpenCode configs should be normalized into a toolkit-compatible shape.
- Actual:
  The current generator only updates instructions if `config.instructions` already exists.
- Why it matters:
  Existing repos may silently fail to become toolkit-aware even though attach appears to succeed.
- Options:
  - A:
    Normalize and create `instructions` when absent.
  - B:
    Fail fast with a clear warning when the existing config shape is unsupported.
- Recommendation:
  Normalize the config rather than leaving the user in a partial state.
- Decision:
  —
- Notes:
  This is a concrete generator behavior issue, not just a documentation gap.

## TK-014 Shared repo artifact ownership is unclear

- Status:
  open
- Area:
  shared ownership and drift
- Scenarios:
  S-004, S-006, S-007, S-010
- Expected:
  Users should know which generated files are intended to be committed, shared, regenerated locally, or treated as personal state.
- Actual:
  The toolkit generates a mix of repo-local and user-local artifacts without a clear ownership policy.
- Why it matters:
  Shared repos become fragile when generated surfaces have ambiguous ownership.
- Options:
  - A:
    Define a commit/share policy per host artifact class.
  - B:
    Push more state into user-local generation and reduce shared repo artifacts.
- Recommendation:
  Start by documenting ownership per artifact before changing storage strategy.
- Decision:
  —
- Notes:
  This is the core team-use issue across hosts.

## TK-015 Teammate without toolkit can consume some generated files but cannot manage lifecycle

- Status:
  open
- Area:
  shared ownership and drift
- Scenarios:
  S-006
- Expected:
  A teammate without toolkit should still have a clear boundary between “usable” and “unmanageable” repo state.
- Actual:
  Some committed generated artifacts may still function, but lifecycle management depends on the toolkit being installed locally.
- Why it matters:
  Partial usability without lifecycle clarity creates silent maintenance debt.
- Options:
  - A:
    Treat generated repo artifacts as consumable but not maintainable without toolkit.
  - B:
    Reduce dependence on committed generated artifacts for teammates without toolkit.
- Recommendation:
  Make this limitation explicit and decide which artifacts are safe to rely on without local toolkit.
- Decision:
  —
- Notes:
  This is related to ownership, but distinct from version drift.

## TK-016 Team drift risk across toolkit versions, profiles, and pack selection

- Status:
  open
- Area:
  shared ownership and drift
- Scenarios:
  S-007, S-010
- Expected:
  Shared surfaces should be reproducible enough that collaborators do not rewrite each other’s generated artifacts constantly.
- Actual:
  Generation can vary by toolkit version, selected profile, and explicit pack set.
- Why it matters:
  Reproducibility gaps turn generated files into churn magnets.
- Options:
  - A:
    Add project-level locking or explicit policy around profiles and packs.
  - B:
    Keep generation flexible but discourage committing some generated artifacts.
- Recommendation:
  Decide which surfaces are meant to be reproducible and then define the locking policy around those.
- Decision:
  —
- Notes:
  This is likely the biggest blocker to clean team-sharing behavior.

## TK-017 VS Code config merge is additive and may not propagate template updates cleanly

- Status:
  open
- Area:
  shared ownership and drift
- Scenarios:
  S-001, S-007, S-008, S-009
- Expected:
  Toolkit updates should either propagate predictably or declare a stable merge policy.
- Actual:
  VS Code config merge is additive and does not fully reconcile prior generated values with later template changes.
- Why it matters:
  Long-lived repos may drift away from current toolkit intent while still appearing “installed.”
- Options:
  - A:
    Keep additive merge and document it as compatibility-first behavior.
  - B:
    Add a stronger reconciliation or reset workflow for toolkit-managed entries.
- Recommendation:
  Clarify the intended merge contract before changing behavior.
- Decision:
  —
- Notes:
  This affects both project-local and global VS Code installs.

## TK-018 “All hosts at once” lacks source-of-truth guidance

- Status:
  open
- Area:
  shared ownership and drift
- Scenarios:
  S-004, S-006, S-007, S-010
- Expected:
  Multi-host repos should have clear guidance about which host behavior is canonical and how overlaps are resolved.
- Actual:
  The toolkit supports multiple hosts at once, but does not define a source-of-truth model for overlapping instructions or lifecycle decisions.
- Why it matters:
  Multi-host support increases complexity faster than single-host usage.
- Options:
  - A:
    Define a primary-host model for mixed repos.
  - B:
    Keep all hosts equal but document artifact ownership and sync policy carefully.
- Recommendation:
  Decide whether mixed-host repos should be first-class or merely possible.
- Decision:
  —
- Notes:
  This is a product-shape question, not only a tooling question.

## TK-019 Global VS Code install is under-documented

- Status:
  open
- Area:
  onboarding
- Scenarios:
  S-011
- Expected:
  If global VS Code install is supported, users should know when and why to use it.
- Actual:
  The CLI supports global VS Code install, but the path is not highlighted as a documented user journey.
- Why it matters:
  Hidden power features are hard to adopt safely.
- Options:
  - A:
    Document global VS Code install as an advanced path.
  - B:
    De-emphasize it if project-local setup is the intended default.
- Recommendation:
  Position it explicitly as advanced unless the product wants to promote it more strongly.
- Decision:
  —
- Notes:
  This is distinct from the lack of global uninstall.

## TK-020 Global Codex install is under-documented

- Status:
  open
- Area:
  onboarding
- Scenarios:
  S-012
- Expected:
  If global Codex install is supported, users should know the discovery model, intended use case, and that Codex receives a plugin workflow rather than a standalone agent picker.
- Actual:
  The CLI supports it, but the journey is not made explicit to the user.
  The generated surface is a Codex plugin with MCP wiring and plugin-local skills, which can be mistaken for a missing or failed agent install when users expect a visible `@code-reviewer` style selector.
- Why it matters:
  Users may never discover the capability or may use it without understanding the blast radius.
- Options:
  - A:
    Document global Codex install as an advanced path.
  - B:
    Narrow support to project-local Codex if global use is not a priority.
- Recommendation:
  Clarify product intent and make the first review action discoverable with plugin starter prompts and skills before investing in deeper Codex lifecycle work.
- Decision:
  —
- Notes:
  This issue is about positioning and lifecycle clarity together.

## TK-002 No clear first human action for VS Code + Copilot

- Status:
  open
- Area:
  onboarding
- Scenarios:
  S-001
- Expected:
  After generating Copilot and VS Code files, the user should know the first useful action in VS Code and how to start issue review.
- Actual:
  The generated Copilot surface includes prompts and agents, but the onboarding path is still easy to miss unless the human already knows to open Copilot Chat and use a generated prompt.
- Why it matters:
  A good generated surface still feels broken if the human cannot see the first step.
- Options:
  - A:
    Add quickstart guidance to the generated Copilot instructions and make `review-issue` an explicit first-run prompt.
  - B:
    Keep the current generated assets but document the first-step flow only in repo docs.
- Recommendation:
  Prefer generated quickstart guidance plus a review-oriented prompt so the first useful action is visible inside the host.
- Decision:
  —

## TK-021 Host cleanup behavior is uneven across generators

- Status:
  open
- Area:
  host lifecycle
- Scenarios:
  S-003, S-005
- Expected:
  Generated host surfaces should have similarly understandable cleanup behavior.
- Actual:
  OpenCode has bespoke global uninstall logic, while other hosts rely more on prune or manual understanding of artifacts.
- Why it matters:
  Uneven cleanup semantics make the product harder to reason about as a whole.
- Options:
  - A:
    Standardize lifecycle semantics across hosts where possible.
  - B:
    Keep host-specific behavior but document the differences very clearly.
- Recommendation:
  At minimum, standardize the documentation model even if implementation remains host-specific.
- Decision:
  —
- Notes:
  This is broader than any one uninstall bug.

## TK-022 Existing `.github/` conventions can collide with generated Copilot files

- Status:
  open
- Area:
  shared ownership and drift
- Scenarios:
  S-001, S-008, S-009
- Expected:
  Repos with existing `.github/` conventions should be able to adopt toolkit-generated Copilot files without unclear overwrite behavior.
- Actual:
  Copilot file generation writes template output directly into `.github/`.
- Why it matters:
  Teams often already use `.github/` heavily for workflows, docs, and repo policy.
- Options:
  - A:
    Treat generated Copilot files as toolkit-owned and document overwrite policy.
  - B:
    Add safer coexistence or namespacing behavior.
- Recommendation:
  Clarify ownership and overwrite expectations before deciding on namespacing.
- Decision:
  —
- Notes:
  This is not about GitHub Actions specifically; it is about `.github/` as a shared team namespace.

## TK-023 Project scaffold expectations are implicit, not explicitly initialized

- Status:
  open
- Area:
  onboarding
- Scenarios:
  S-001, S-003, S-014
- Expected:
  Users should understand what project-local toolkit structure exists and what host surfaces depend on it.
- Actual:
  Host flows can create install state, but broader project scaffold expectations remain implicit.
- Why it matters:
  Hidden assumptions make attach feel successful while the conceptual model stays incomplete.
- Options:
  - A:
    Add an explicit project init/scaffold story.
  - B:
    Reduce dependence on uninitialized project-local toolkit paths.
- Recommendation:
  First decide whether `.agent-toolkit/` is meant to be visible product surface or mostly internal implementation detail.
- Decision:
  —
- Notes:
  This especially affects OpenCode because its local config points at rules under `.agent-toolkit/`.

## TK-024 Inferred installs can misrepresent ownership in shared repos

- Status:
  open
- Area:
  shared ownership and drift
- Scenarios:
  S-006, S-007, S-010
- Expected:
  Install state should reflect whether files were intentionally generated by toolkit for this project, not merely present.
- Actual:
  If no install registry exists, toolkit can infer installed targets from matching files already present in the repo.
- Why it matters:
  In shared repos, inference can blur the line between toolkit-owned artifacts and pre-existing or teammate-owned files.
- Options:
  - A:
    Keep inference for convenience, but surface that it is only a heuristic.
  - B:
    Require explicit install state for lifecycle-sensitive operations.
- Recommendation:
  Make inferred ownership visible and treat it as lower-confidence than recorded ownership.
- Decision:
  —
- Notes:
  This matters most when a collaborator did not generate the files locally.

## TK-025 No explicit model for custom skills coexisting with toolkit-owned instruction assets

- Status:
  open
- Area:
  custom content ownership
- Scenarios:
  S-003, S-005, S-015, S-016, S-024
- Expected:
  Users should be able to distinguish clearly between their own custom instructions and toolkit-provided instruction assets.
- Actual:
  The docs describe host surfaces, but do not define a first-class ownership model for custom skills, rules, prompts, or agents that coexist with toolkit content.
- Why it matters:
  Adoption and removal both become risky when users cannot tell what belongs to them versus what toolkit created.
- Options:
  - A:
    Define a documented ownership taxonomy for user-authored content, toolkit-generated host files, and toolkit-rendered instruction assets.
  - B:
    Minimize mixed ownership by moving more toolkit content into clearly namespaced locations.
- Recommendation:
  Define the ownership taxonomy first so later lifecycle decisions have a stable model.
- Decision:
  —
- Notes:
  This is most visible in OpenCode because pack instructions are rendered into user config.

## TK-026 No first-class selective removal path for toolkit-owned instruction assets only

- Status:
  open
- Area:
  custom content ownership
- Scenarios:
  S-005, S-016
- Expected:
  Users should be able to remove toolkit-owned instruction assets without disturbing custom content.
- Actual:
  Project prune removes tracked generated paths, and OpenCode uninstall removes some global state, but there is no clearly documented selective-removal model for toolkit-only instruction assets.
- Why it matters:
  Fear of collateral damage makes cleanup feel unsafe even if installation was successful.
- Options:
  - A:
    Add a selective-removal command path for toolkit-owned instruction assets.
  - B:
    Keep the current mechanics but document exact ownership boundaries and manual cleanup steps.
- Recommendation:
  Start by documenting the ownership boundary, then decide if a new command is required.
- Decision:
  —
- Notes:
  This is narrower than “remove everything” and should stay distinct from it.

## TK-027 Effectiveness review exists, but is OpenCode-centric rather than host-neutral

- Status:
  open
- Area:
  effectiveness and review
- Scenarios:
  S-021, S-022
- Expected:
  Users should be able to review toolkit effectiveness across hosts using a shared model, even if host-specific tools differ.
- Actual:
  The packs include review and observability commands such as `session-audit`, `optimise`, and `review-framework`, plus eval-driven-development guidance, but the current audit docs do not surface them and the model appears OpenCode-oriented.
- Why it matters:
  The product can only improve systematically if effectiveness review is visible and comparable, not hidden in one host-specific workflow.
- Options:
  - A:
    Promote a host-neutral review framework and then map host-specific signals into it.
  - B:
    Keep effectiveness review host-specific and document the asymmetry explicitly.
- Recommendation:
  Create a host-neutral review frame first, then decide how much actual cross-host tooling is needed.
- Decision:
  —
- Notes:
  This is not “no effectiveness system exists.” It is “the existing system is uneven and underrepresented.”

## TK-028 No documented ownership boundary for generated host instruction files versus user-authored ones

- Status:
  open
- Area:
  custom content ownership
- Scenarios:
  S-015, S-018, S-024
- Expected:
  Users should know whether files under shared namespaces like `.github/agents`, `.github/prompts`, or `plugins/*` are toolkit-owned, user-owned, or mixed.
- Actual:
  The docs discuss existing config collisions generally, but not the more specific case where toolkit-generated and user-authored instruction files occupy the same host namespace.
- Why it matters:
  Shared namespaces make overwrite, merge, and commit behavior much harder to reason about.
- Options:
  - A:
    Document ownership boundaries and naming conventions within shared host namespaces.
  - B:
    Move toolkit-generated instruction files under stronger namespacing where host conventions allow it.
- Recommendation:
  Document the boundary first so future namespacing decisions are easier to evaluate.
- Decision:
  —
- Notes:
  This is related to `.github/` collisions, but more specific and broader than Copilot alone.

## TK-029 Pack and profile changes alter behavior without a clear reproducibility contract

- Status:
  open
- Area:
  effectiveness and review
- Scenarios:
  S-007, S-010, S-017, S-023
- Expected:
  Users should understand which behavior changes are expected when packs or profiles change and how to reproduce a known-good state.
- Actual:
  Pack selection and profile choice can materially alter generated instructions and host behavior, but the docs do not define a reproducibility contract.
- Why it matters:
  It is hard to debug, review, or evaluate toolkit behavior if the active instruction set drifts invisibly over time.
- Options:
  - A:
    Add a project-level declaration or lock model for profile and pack selection.
  - B:
    Keep pack selection flexible but document regeneration expectations and scope clearly.
- Recommendation:
  Decide which artifact classes need reproducibility, then define the contract around those.
- Decision:
  —
- Notes:
  This is both a lifecycle and effectiveness problem, not just a team-sharing issue.

## TK-030 No clear commit policy for toolkit state and generated surfaces

- Status:
  open
- Area:
  effectiveness and review
- Scenarios:
  S-006, S-007, S-010, S-020
- Expected:
  Teams should know which toolkit-generated files are intended for git and which are personal machine state.
- Actual:
  The docs list artifacts, but do not yet give a clear commit-versus-ignore policy for them.
- Why it matters:
  Without a commit policy, teams cannot reason cleanly about reviews, drift, or teammate setup expectations.
- Options:
  - A:
    Add a per-artifact commit policy matrix to the audit docs and later to user-facing docs.
  - B:
    Reduce the number of ambiguous artifact classes by moving more state into clearly local directories.
- Recommendation:
  Start with a policy matrix before changing storage layout.
- Decision:
  —
- Notes:
  `.agent-toolkit/state/tool-installs.json` is the most obvious unresolved case, but not the only one.

## TK-031 Inferred ownership can incorrectly classify pre-existing host files as toolkit-managed

- Status:
  open
- Area:
  custom content ownership
- Scenarios:
  S-006, S-007, S-010, S-018, S-019
- Expected:
  Lifecycle-sensitive actions should distinguish explicit toolkit ownership from heuristic guesses based on file presence.
- Actual:
  If recorded install state is missing, toolkit can infer installed targets from files that merely happen to match expected paths.
- Why it matters:
  Incorrect ownership assumptions can cause misleading status, risky cleanup, and team confusion.
- Options:
  - A:
    Treat inferred ownership as low-confidence and surface that fact clearly in docs and UX.
  - B:
    Restrict lifecycle actions when ownership is inferred rather than recorded.
- Recommendation:
  Make ownership confidence visible first; then decide how strict lifecycle actions should be.
- Decision:
  —
- Notes:
  This is narrower and more action-oriented than the broader shared-ownership issues.

## TK-032 No disable or deactivate story for a subset of toolkit capabilities

- Status:
  open
- Area:
  custom content ownership
- Scenarios:
  S-017, S-023, S-024
- Expected:
  Users should be able to tune toolkit behavior without treating every change as full adoption or full removal.
- Actual:
  The current docs do not define a clear path for disabling one capability family, pack, or instruction subset while leaving the rest intact.
- Why it matters:
  Fine-grained control is often necessary before users will trust a broad toolkit in long-lived repos.
- Options:
  - A:
    Define pack-level deactivation as the primary tuning mechanism.
  - B:
    Add a host-specific capability toggle model instead.
- Recommendation:
  Clarify whether packs, profiles, or host targets are the intended unit of deactivation.
- Decision:
  —
- Notes:
  This issue sits at the boundary between configuration UX and lifecycle UX.

## TK-033 No documented boundary between toolkit-rendered OpenCode instructions and nearby user-authored content

- Status:
  open
- Area:
  custom content ownership
- Scenarios:
  S-003, S-005, S-015, S-016, S-024
- Expected:
  Users should know how OpenCode global install stores toolkit-rendered instruction assets relative to their own instruction content.
- Actual:
  Toolkit renders instruction assets into the user config area, but the docs do not define the ownership boundary or selective-removal expectations for that space.
- Why it matters:
  Shared directory spaces make users nervous about install side effects and uninstall completeness.
- Options:
  - A:
    Document the rendered-directory contract and what uninstall owns there.
  - B:
    Move toolkit-rendered assets into a more obviously namespaced location if feasible.
- Recommendation:
  Document the storage contract before deciding whether it needs structural change.
- Decision:
  —
- Notes:
  This is the most concrete “custom skills near toolkit assets” problem today.

## TK-034 No host-neutral review scorecard for onboarding, agent quality, and cleanup confidence

- Status:
  open
- Area:
  effectiveness and review
- Scenarios:
  S-021, S-022, S-024
- Expected:
  Teams should have a simple way to review whether toolkit is easy to start, helpful in practice, and safe to clean up across hosts.
- Actual:
  The toolkit has pieces of observability and review, but no shared scorecard that covers onboarding success, agent effectiveness, artifact churn, and uninstall confidence.
- Why it matters:
  Without a shared scorecard, analysis stays anecdotal and decisions about packs or hosts are harder to compare.
- Options:
  - A:
    Add an audit template that scores onboarding, effectiveness, drift, and cleanup per host.
  - B:
    Keep reviews narrative-only and host-specific.
- Recommendation:
  Start with a lightweight audit template so future simulations compare like with like.
- Decision:
  —
- Notes:
  This is the natural bridge between the scenario doc and the issue log.

## TK-035 No reusable multi-persona scenario-simulation workflow for design review

- Status:
  open
- Area:
  effectiveness and review
- Scenarios:
  S-021, S-022
- Expected:
  The toolkit should have a repeatable review method for simulating different user identities, surfacing granular issues, and synthesizing them into a shared design view.
- Actual:
  The current audit is using that method manually, but it is not yet captured as a reusable workflow, agent, or review artifact beyond the notes in the scenario document.
- Why it matters:
  Complex host and lifecycle systems are easy to under-review if they are only examined from one persona or one command path at a time.
- Options:
  - A:
    Formalize the method as a documented review workflow that humans can run.
  - B:
    Turn the method into a dedicated scenario-simulator agent that generates personas, runs structured simulations, and synthesizes findings.
- Recommendation:
  Document the workflow first, then consider turning it into a dedicated audit agent once the review shape stabilizes.
- Decision:
  —
- Notes:
  The valuable part is not just scenario generation. It is the combination of persona shifts, artifact tracing, issue extraction, and synthesis into a matrix plus decision log.
  That matrix should include an explicit priority field so consolidation produces an ordered backlog, not just a comparison view.

## TK-036 `tools install <target> --scope global` misparses flags as a directory argument

- Status:
  open
- Area:
  host-specific setup
- Scenarios:
  S-012, S-025
- Expected:
  A user should be able to run `agent-toolkit tools install codex --scope global` and have `--scope global` interpreted as flags, with the install root defaulting to the home directory.
- Actual:
  The current CLI reads the first positional after the target as `dirArg` even when it is actually `--scope`, causing a bogus install rooted at a literal `--scope` directory while still reporting success.
- Why it matters:
  This breaks the most obvious global Codex install flow and creates invalid filesystem and registry state.
- Options:
  - A:
    Fix argument parsing so flag tokens cannot be consumed as `dirArg`.
  - B:
    Require an explicit directory for global install and make that contract obvious in help text.
- Recommendation:
  Fix parsing so the flag-only form works as users will naturally expect.
- Decision:
  —
- Notes:
  This was reproduced during live review on 2026-04-06.

## TK-037 No first-class global logging workflow for cross-host review effectiveness

- Status:
  open
- Area:
  effectiveness and review
- Scenarios:
  S-021, S-022, S-026
- Expected:
  Teams using toolkit across repos and hosts should have a standard place and format for recording installs, simulations, effectiveness findings, and cleanup confidence.
- Actual:
  Toolkit has host-specific observability pieces and repo-local audit paths, but no first-class global logging workflow for cross-host review history.
- Why it matters:
  Without durable global review logs, the same findings get rediscovered and cross-project trends stay invisible.
- Options:
  - A:
    Add a simple global review log and structured effectiveness ledger as an official pattern.
  - B:
    Keep logging repo-local only and leave cross-host review aggregation to teams.
- Recommendation:
  Start with a lightweight official global logging pattern before building anything more automated.
- Decision:
  —
- Notes:
  A manual global review log and CSV effectiveness log were created during the live review as a stopgap.
