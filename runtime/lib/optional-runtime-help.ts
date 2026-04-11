import { getAdapterTargets } from "./tooling/adapter-targets"
import { OPTIONAL_RUNTIME_LEGACY_CLI, OPTIONAL_RUNTIME_PREFERRED_CLI } from "./optional-runtime-identity"

export function formatOptionalRuntimeHelp(): string {
  const targets = `${getAdapterTargets().join(",")},all`

  return `${OPTIONAL_RUNTIME_PREFERRED_CLI} — optional runtime/enforcement layer

Optional runtime/enforcement module layered on top of the portable toolkit.

Commands:
  install              Register plugin globally (hooks + instructions)
  attach [dir] [profile] Attach optional runtime to a project (light|standard|full)
  init [dir] [profile] Alias for attach
  sync [dir]           Regenerate adapter surfaces (opencode.json, .github/, .vscode/)
  migrate [dir]        Migrate from legacy .opencode/ layout to .agent/ overlay
  upgrade              Refresh the runtime compatibility layer and global install
  detach [dir] [flags] Remove optional runtime from a project
  relink [dir]         Refresh adapter surfaces & update paths after runtime moves
  uninstall            Remove global plugin registration
  status               Show runtime status (hooks, skills, config)
  inspect              Alias for status
  tools catalog        List reusable tool packs in this repo
  tools install        Install an adapter target with explicit scope (project/local by default)
  tools installed [d]  Show project installs first, then explicit global installs
  tools inspect        Show global host entries and selection keys
  tools cleanup        Clean global host entries by mode or explicit key
  tools prune [d]      Dry-run removal of local adapter targets not in --tools
  report <type>        Run toolkit report scripts (session-audit, codex-session-audit, copilot-session-audit, optimise, optimise-compare, review-framework)
  shadow-start <id>    Activate shadow staging for mission id
  shadow-stop          Deactivate active shadow staging mission
  shadow-status [id]   Show active/selected shadow mission status
  apply <id> [--yes]   Preview/apply staged mission files

Model routing:
  list-providers       List all registered model providers
  list-models          List all models in the catalog
  validate-models      Validate model routing configuration
  resolve-model <role> Resolve concrete model for an agent role
    --mode <mode>      Execution mode: online (default), offline, hybrid

Tool selection (for attach/sync):
  --tools <list>       Comma-separated: ${targets}

Tool install:
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} tools install copilot . --scope project
                       Install project-local Copilot files without full attach
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} tools install opencode . --scope project
                       Install project-local opencode.json without full attach
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} tools install codex . --scope project --packs mcp-dev,mcp-web
                       Install a repo-local Codex plugin from selected packs
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} tools install vscode . --scope project
                       Install repo-local VS Code files for isolated project behavior
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} tools install opencode --scope global
                       Install shared OpenCode host state only when you explicitly want cross-repo defaults
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} tools install codex --scope global --packs mcp-dev,mcp-cloud
                       Install a home-local Codex plugin and marketplace entry

Tool pruning:
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} tools prune . --tools opencode,vscode
                       Dry-run removal of other managed local adapter targets
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} tools prune . --tools opencode --yes
                       Remove managed local Copilot / VS Code / Codex surfaces if unmodified

Global inspection / cleanup:
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} tools inspect opencode --scope global
                       Show plugins, instructions, dependencies, and registry entries for OpenCode
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} tools cleanup opencode --scope global --mode toolkit
                       Dry-run removal of toolkit-managed OpenCode entries
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} tools cleanup opencode --scope global --mode select --select plugin:${OPTIONAL_RUNTIME_LEGACY_CLI},dependency:${OPTIONAL_RUNTIME_LEGACY_CLI} --yes
                       Remove selected stale entries explicitly

Detach flags:
  --dry-run            Show what would be removed without making changes
  --keep-docs          Export all durable docs to docs/ before removing
  --export-to <path>   Override export location (implies --keep-docs)

Profiles:
  light                Minimal partner-mode setup (fewer hooks, less scaffolding)
  standard             Normal planning/spec/task workflow (default)
  full                 Autonomous/mission/shadow-root/ledger features

Examples:
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} install
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} attach .
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} attach /path/to/project full
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} attach . standard --tools=copilot
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} attach . standard --tools=codex
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} sync . --tools copilot,vscode
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} tools install codex --scope global --packs mcp-dev,mcp-cloud
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} upgrade
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} detach . --dry-run
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} status

Legacy compatibility:
  ${OPTIONAL_RUNTIME_LEGACY_CLI} <command>

Notes:
  - runtime is optional; the toolkit still works without it
  - toolkit remains the primary product identity
  - the current runtime implementation is still bridged through the legacy framework package during migration
`
}
