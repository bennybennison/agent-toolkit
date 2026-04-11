import { resolve } from "node:path"
import type { ToolkitEnvironment } from "../lib/toolkit-environment"
import type { AdapterTarget } from "../lib/tooling/adapter-targets"
import { getAdapterTargets, isAdapterTarget } from "../lib/tooling/adapter-targets"
import type { ExecShellFn } from "../lib/optional-runtime-tool-commands"
import {
  printInstalledToolkitTargets,
  printToolkitCatalog,
  printToolkitGlobalInspection,
  runToolkitGlobalCleanup,
  runToolkitReport,
  runToolkitTargetInstall,
  runToolkitTargetPrune,
} from "../lib/optional-runtime-tool-commands"
import {
  CliCommandError,
  hasVerboseFlag,
  parseCleanupMode,
  parseOptionalDirArg,
  parsePackIds,
  parseProfileArg,
  parseScopeArg,
  parseSelectArg,
  type ToolSet,
} from "../lib/optional-runtime-cli-core"
import { ADAPTER_TARGETS } from "../lib/toolkit-operations"

function resolveDirArg(dirArg: string | undefined): string | undefined {
  const parsed = parseOptionalDirArg(dirArg)
  return parsed ? resolve(parsed) : undefined
}

function requireAdapterTarget(targetArg: string | undefined, usage: string): AdapterTarget {
  if (!targetArg || !isAdapterTarget(targetArg)) {
    throw new CliCommandError(`${usage}\nTargets: ${getAdapterTargets().join(", ")}`)
  }
  return targetArg
}

export function toolsCatalogRuntimeCommand(
  env: ToolkitEnvironment,
  opts?: { detailed?: boolean; log?: (line: string) => void },
): void {
  printToolkitCatalog(env, opts)
}

export function toolsInstalledRuntimeCommand(
  env: ToolkitEnvironment,
  projectDir: string,
  opts?: { detailed?: boolean; log?: (line: string) => void },
): void {
  printInstalledToolkitTargets(env, projectDir, opts)
}

export function toolsInspectRuntimeCommand(options: {
  env: ToolkitEnvironment
  cliCommand: string
  targetArg: string | undefined
  dirArg: string | undefined
  args: string[]
  log?: (line: string) => void
}): void {
  const target = requireAdapterTarget(
    options.targetArg,
    `Usage: ${options.cliCommand} tools inspect <target> [dir] [--scope global]`,
  )
  const scope = parseScopeArg(options.args, "global")
  if (scope !== "global") {
    throw new CliCommandError("tools inspect currently supports --scope global only.")
  }
  printToolkitGlobalInspection(options.env, target, resolveDirArg(options.dirArg), {
    verbose: hasVerboseFlag(options.args),
    log: options.log,
  })
}

export function toolsCleanupRuntimeCommand(options: {
  env: ToolkitEnvironment
  cliCommand: string
  targetArg: string | undefined
  dirArg: string | undefined
  args: string[]
  detailed?: boolean
  log?: (line: string) => void
}): void {
  const target = requireAdapterTarget(
    options.targetArg,
    `Usage: ${options.cliCommand} tools cleanup <target> [dir] [--scope global] [--mode toolkit|all|select] [--select key,key] [--yes]`,
  )
  const scope = parseScopeArg(options.args, "global")
  if (scope !== "global") {
    throw new CliCommandError("tools cleanup currently supports --scope global only.")
  }
  const mode = parseCleanupMode(options.args, "toolkit")
  const selected = parseSelectArg(options.args)
  if (mode === "select" && selected.length === 0) {
    throw new CliCommandError("tools cleanup --mode select requires --select key,key")
  }
  runToolkitGlobalCleanup(
    options.env,
    target,
    resolveDirArg(options.dirArg),
    mode,
    selected,
    options.args.includes("--yes"),
    { detailed: options.detailed, log: options.log },
  )
}

export function toolsInstallRuntimeCommand(options: {
  env: ToolkitEnvironment
  cliCommand: string
  targetArg: string | undefined
  dirArg: string | undefined
  args: string[]
  defaultScope?: "project" | "global"
  defaultProfile?: string
  source: "install" | "attach" | "sync"
  openCodeModels?: { buildModel: string; planModel: string }
  detailed?: boolean
  log?: (line: string) => void
}): void {
  const target = requireAdapterTarget(
    options.targetArg,
    `Usage: ${options.cliCommand} tools install <target> [dir] [--scope project|global] [--profile <profile>] [--packs <ids>]`,
  )
  const scope = parseScopeArg(options.args, options.defaultScope ?? "project")
  const explicitPacks = parsePackIds(options.args)
  const profile = parseProfileArg(options.args, options.defaultProfile ?? (scope === "global" ? "full" : "standard"))

  if (scope === "global" && !ADAPTER_TARGETS[target].supportedScopes.includes("global")) {
    throw new CliCommandError(`${target} does not support global installs.`)
  }
  if (target === "opencode" && scope === "global") {
    throw new CliCommandError(`Use \`${options.cliCommand} install\` for OpenCode global setup. That flow also handles plugin registration.`)
  }

  runToolkitTargetInstall(options.env, target, {
    scope,
    dirArg: resolveDirArg(options.dirArg),
    profile,
    explicitPacks,
    source: options.source,
    openCodeModels: options.openCodeModels,
    detailed: options.detailed,
    log: options.log,
  })
}

export function toolsPruneRuntimeCommand(options: {
  env: ToolkitEnvironment
  projectDir: string
  tools: ToolSet[]
  applyChanges: boolean
  detailed?: boolean
  log?: (line: string) => void
}): void {
  const desiredTargets: AdapterTarget[] = options.tools.includes("all")
    ? getAdapterTargets()
    : options.tools.filter((tool): tool is AdapterTarget => tool !== "all")
  runToolkitTargetPrune(options.env, options.projectDir, desiredTargets, options.applyChanges, {
    detailed: options.detailed,
    log: options.log,
  })
}

export function reportRuntimeCommand(options: {
  env: ToolkitEnvironment
  reportType: string | undefined
  args: string[]
  execShell: ExecShellFn
  cwd: string
  log?: (line: string) => void
}): void {
  const output = runToolkitReport(options.env, options.reportType, options.args, options.execShell, options.cwd)
  const trimmed = output.trim()
  if (trimmed) {
    ;(options.log ?? console.log)(trimmed)
  }
}
