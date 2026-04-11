# agent-toolkit

Standalone `agent-toolkit` package for reusable packs, adapters, templates, and toolkit runtime utilities.

`agent-toolkit` is designed to work without `agent-framework`.

Hosts such as `agent-framework` can depend on this package and override host conventions, but the toolkit itself should not depend on framework-owned code or paths.

`agent-toolkit` is now the primary product entrypoint.

The runtime/enforcement layer is optional and should be thought of as a toolkit module, not a competing top-level product. The preferred runtime entrypoint is:

```bash
agent-toolkit runtime attach .
agent-toolkit runtime sync .
agent-toolkit runtime status
```

The toolkit now also owns the runtime entrypoint file itself at `agent-toolkit/bin/runtime-main.ts`. During migration, that toolkit-owned entrypoint still bridges into the legacy internal implementation where needed, but the package boundary now matches the product boundary.

Default standalone conventions:

- package name: `agent-toolkit`
- CLI command: `agent-toolkit`
- project state: `.agent-toolkit/`
- project context: `.agent-toolkit-context/`

`agent-framework` is now only a compatibility wrapper for older commands and installs. Toolkit-managed adapter surfaces and the optional runtime both live under `agent-toolkit`.

## When To Use Which

Use `agent-toolkit` when you want reusable capability surfaces without the framework runtime.

Typical uses:

- install repo-local surfaces first for isolated testing and experimentation
- install or refresh Codex, OpenCode, Copilot, or VS Code surfaces
- install a global Copilot baseline under toolkit config for reuse across repos
- inspect what is installed globally
- clean up toolkit-managed host entries
- work directly with packs, templates, skills, agents, and adapter outputs

Use `agent-framework` when you want the managed runtime on top of the toolkit.

Preferred runtime usage now goes through `agent-toolkit runtime ...`.

The standalone `agent-framework` command remains available as a legacy-compatible wrapper during migration.

That includes:

- `.agent/` project state
- hooks and runtime guardrails
- orchestration execution
- model routing
- staging/apply flow
- framework attach/sync/detach/upgrade workflows

Short rule:

- `agent-toolkit` = primary product
- `agent-toolkit runtime` = optional runtime/enforcement layer
- `agent-framework` = legacy compatibility wrapper for the runtime layer

Visible top-level workflow:

- `Session-Manager` for session lifecycle
- `Orchestrator` for broad task execution

Hidden specialist agents still exist, but they are implementation machinery rather than the primary user-facing surface.

Local-first policy:

- project installs are the default
- prefer repo-local surfaces for testing, package experiments, and per-project agent variation
- use `--scope global` only when you explicitly want shared host state across repos
- framework config is effectively local-first at runtime because project config overrides global config

Shared skills are now seeded into `.agents/skills/`:

- repo-local installs seed `<repo>/.agents/skills/`
- global installs seed `~/.agents/skills/`
- OpenCode, Copilot/VS Code, and Codex can all discover that shared skill library
- host-specific adapter files still exist, but `.agents/skills/` is the common portable skill surface
- `skills/` is the toolkit-owned authored source for portable shared skills
- `recipes/` is the toolkit-owned authored source for top-level orchestration routes
- packs remain the composition layer that decides which authored skills are installed

Install is tool-first and local-first:

```bash
agent-toolkit install .                       # install all local tool surfaces in this repo
agent-toolkit install copilot . --scope project
agent-toolkit install opencode . --scope project
agent-toolkit install codex . --scope project
agent-toolkit install opencode --scope global
agent-toolkit install copilot --scope global
```

The global Copilot path is a reusable toolkit baseline, not a native Copilot host-global hook.

## Update And Refresh

If you update `agent-toolkit` source:

- toolkit code changes are immediately available to consumers in this repo
- generated host surfaces do not update automatically
- rerun the relevant install or sync flow

Common refresh commands:

```bash
agent-toolkit sync .
agent-toolkit install copilot . --scope project
agent-toolkit install opencode . --scope project
agent-toolkit install codex . --scope project
agent-toolkit install opencode --scope global
agent-toolkit tools inspect opencode --scope global
agent-toolkit tools cleanup codex --scope global --mode toolkit
```

If you add new toolkit agents, skills, recipes, commands, or packs:

- the toolkit catalog sees them immediately
- hosts only expose them after regeneration
- you must rerender the target host surface

In practice:

- Codex: rerun the local Codex install/sync flow in the repo you are testing
- OpenCode: prefer rerunning `agent-toolkit install opencode . --scope project`; use global only when you intentionally want shared defaults
- Copilot global baseline: rerun `agent-toolkit install copilot --scope global` only for shared starter content
- Copilot: rerender `.github/` in the repo under test
- VS Code: prefer project `.vscode/` refreshes for repo-specific behavior

Adding a new toolkit agent does not automatically make framework orchestration choose it. A command, skill, route, or policy still needs to reference that agent.

Package areas:

- `skills/` for toolkit-owned authored shared skills that install into `.agents/skills/`
- `recipes/` for toolkit-owned authored orchestration routes such as hold, session, map, plan, implement, repair, review, and wireframe
- `adapters/` for host-specific install/render logic
- `content/` for toolkit-owned legacy skills, agents, and commands that have not yet moved into packs
- `runtime/lib/toolkit-environment.ts` for toolkit path resolution, package metadata, and host conventions
- `runtime/lib/toolkit-operations.ts` for target generation, install recording, catalog access, and content inventory
- `runtime/lib/opencode-global-install.ts` for OpenCode global install and uninstall flows
- `runtime/lib/tooling/` for host-neutral tool manifests, install registries, and pruning
- `runtime/lib/pack-resolver.ts` as the current catalog/packs bridge
- `templates/` for toolkit-owned adapter assets, including reusable MCP template artifacts
- `packs/` for the reusable capability catalog
- `ADAPTER_USAGE_SCENARIOS.md` for adapter-specific usage review
- `ADAPTER_ISSUES_AND_DECISIONS.md` for adapter-specific issue and decision tracking

Recent capability additions:

- `skills/using-agent-toolkit/` for lightweight workflow orientation and top-level routing without mandatory ceremony
- `recipes/` for a first-class recipe layer that the top-level orchestrator can inspect and select
- runtime mission startup now records and uses a selected recipe for command-driven orchestration
- `packs/rules-common/` for reusable documentation, security, modularity, monorepo, MCP, and workflow governance rules
- `packs/skills-discovery/` for idea exploration, feasibility and placement, repo mapping, implementation strategy selection, bug diagnosis, and refactor planning
- `packs/commands-discovery/` for `/explore`, `/map`, and `/repair`
- `templates/workflows/` for reusable discovery, planning, delivery, review, verification, repair, refactor, and mapping artifacts
- `packs/skills-outside-in/` for workflow-first internal tool and ops app design
- `packs/skills-ui-first/` for frontend-only concept branches, fake-data wireframes, and UI handoff
- `packs/commands-product/` for a lightweight `/outside-in` entrypoint
- `templates/ui-first/` for mocked-frontend handoff artifacts
- `templates/outside-in/` for reusable outside-in design artifacts
- `templates/reference/` for portable project reference docs such as `AGENTS.md`, `SKILL.md`, `CONSTITUTION.md`, `ADR.md`, and planning templates

The long-term boundary is:

- `agent-toolkit` is standalone
- `agent-framework` uses `agent-toolkit`
- `agent-toolkit` does not use `agent-framework`
