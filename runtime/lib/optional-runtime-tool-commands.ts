import { join, resolve } from "node:path"
import type { ToolkitEnvironment } from "./toolkit-environment"
import { CliCommandError } from "./optional-runtime-cli-core"
import {
  applyToolkitGlobalTargetCleanup,
  applyToolkitTarget,
  applyToolkitTargetPrune,
  getToolkitCatalog,
  getToolkitInstalledTargets,
  inspectToolkitGlobalTarget,
  planToolkitGlobalTargetCleanup,
  planToolkitTargetPrune,
  resolveToolkitInstallRequest,
  syncToolkitSharedSkills,
  type GlobalCleanupMode,
} from "./toolkit-operations"
import type { AdapterTarget } from "./tooling/adapter-targets"
import { formatGlobalToolInventory } from "./tooling/global-surface-format"

export interface ExecShellResult {
  code: number
  stdout: string
  stderr: string
}

export type ExecShellFn = (cmd: string, args: string[], cwd: string) => ExecShellResult

export function printToolkitCatalog(
  env: ToolkitEnvironment,
  opts?: { detailed?: boolean; log?: (line: string) => void },
): void {
  const log = opts?.log ?? console.log
  const entries = getToolkitCatalog(env)

  if (opts?.detailed) {
    log("Tool Catalog")
    log("============")
    log("")
    if (entries.length === 0) {
      log("No catalog entries found in packs/.")
      log("")
      return
    }
    for (const entry of entries) {
      const signals: string[] = []
      if (entry.always) signals.push("always")
      if (entry.profiles.length > 0) signals.push(`profiles=${entry.profiles.join(",")}`)
      if (entry.autoDetectFiles.length > 0) signals.push(`auto=${entry.autoDetectFiles.join(",")}`)
      log(`- ${entry.id} [${entry.category}]`)
      log(`  ${entry.name}`)
      if (entry.provides.length > 0) log(`  provides: ${entry.provides.join(", ")}`)
      if (signals.length > 0) log(`  ${signals.join(" | ")}`)
    }
    log("")
    return
  }

  for (const entry of entries) {
    log(`${entry.id}\t${entry.category}\t${entry.name}`)
  }
}

export function printInstalledToolkitTargets(
  env: ToolkitEnvironment,
  projectDir: string,
  opts?: { detailed?: boolean; log?: (line: string) => void },
): void {
  const log = opts?.log ?? console.log
  const installed = getToolkitInstalledTargets(env, projectDir)

  if (opts?.detailed) {
    log("Installed Tool Targets")
    log("======================")
    log("")
    log("Global")
    if (installed.globalInstalls.length === 0) {
      log("  (none recorded)")
    } else {
      for (const entry of installed.globalInstalls) {
        log(`  - ${entry.target}`)
        log(`    root: ${entry.rootDir}`)
        log(`    source: ${entry.source}`)
        log(`    packs: ${entry.activePackIds.length === 0 ? "(none)" : entry.activePackIds.join(", ")}`)
      }
    }

    log("")
    log("Project")
    if (installed.projectInstalls.length === 0) {
      log("  (none recorded)")
    } else {
      for (const entry of installed.projectInstalls) {
        log(`  - ${entry.target}`)
        log(`    root: ${entry.rootDir}`)
        log(`    source: ${entry.source}`)
        log(`    files: ${entry.generatedPaths.length}`)
        log(`    packs: ${entry.activePackIds.length === 0 ? "(unknown/inferred)" : entry.activePackIds.join(", ")}`)
      }
    }
    log("")
    return
  }

  log("Project installs:")
  for (const entry of installed.projectInstalls) {
    log(`- ${entry.target} (${entry.scope}) @ ${entry.rootDir}`)
  }
  log("Global installs (explicit shared state):")
  for (const entry of installed.globalInstalls) {
    log(`- ${entry.target} (${entry.scope}) @ ${entry.rootDir}`)
  }
}

export function printToolkitGlobalInspection(
  env: ToolkitEnvironment,
  target: AdapterTarget,
  dirArg: string | undefined,
  opts?: { verbose?: boolean; log?: (line: string) => void },
): void {
  const log = opts?.log ?? console.log
  const inventory = inspectToolkitGlobalTarget(env, target, dirArg)
  for (const line of formatGlobalToolInventory(inventory, env.hostConventions.cliCommand, { verbose: opts?.verbose })) {
    log(line)
  }
}

export function runToolkitGlobalCleanup(
  env: ToolkitEnvironment,
  target: AdapterTarget,
  dirArg: string | undefined,
  mode: GlobalCleanupMode,
  selected: string[],
  applyChanges: boolean,
  opts?: { detailed?: boolean; log?: (line: string) => void },
): void {
  const log = opts?.log ?? console.log
  const plan = planToolkitGlobalTargetCleanup(env, target, mode, selected, dirArg)

  if (opts?.detailed) {
    log("Global Tool Cleanup")
    log("===================")
    log("")
    log(`Target: ${target}`)
    log("Scope:  global")
    log(`Root:   ${plan.rootDir}`)
    log(`Mode:   ${mode}`)
    log("")
    if (plan.removable.length === 0) {
      log("Nothing matched this cleanup request.")
    } else {
      log("Matching entries")
      for (const item of plan.removable) {
        const owner = item.managedByToolkit ? "toolkit" : "external"
        log(`  - [${owner}] ${item.kind}: ${item.key}`)
      }
    }
    if (plan.missingSelections.length > 0) {
      log("")
      log(`Missing selections: ${plan.missingSelections.join(", ")}`)
    }
    if (!applyChanges) {
      log("")
      log("Dry run only. Re-run with `--yes` to apply.")
      log("")
      return
    }
    const result = applyToolkitGlobalTargetCleanup(env, target, plan)
    log("")
    log(`Removed items: ${result.removed.length}`)
    if (result.missingSelections.length > 0) {
      log(`Missing selections remain: ${result.missingSelections.join(", ")}`)
    }
    log("")
    return
  }

  log(`Cleanup plan for ${target} (global) @ ${plan.rootDir}`)
  log(`Mode: ${mode}`)
  if (plan.removable.length === 0) {
    log("Nothing matched this cleanup request.")
  } else {
    for (const item of plan.removable) {
      const owner = item.managedByToolkit ? "toolkit" : "external"
      log(`- [${owner}] ${item.kind} ${item.key}`)
    }
  }
  if (plan.missingSelections.length > 0) {
    log(`Missing selections: ${plan.missingSelections.join(", ")}`)
  }
  if (!applyChanges) {
    log("Dry run only. Re-run with --yes to apply.")
    return
  }
  const result = applyToolkitGlobalTargetCleanup(env, target, plan)
  log(`Removed ${result.removed.length} item(s).`)
  if (result.missingSelections.length > 0) {
    log(`Still missing: ${result.missingSelections.join(", ")}`)
  }
}

export function runToolkitTargetInstall(
  env: ToolkitEnvironment,
  target: AdapterTarget,
  opts: {
    scope: "project" | "global"
    dirArg?: string
    profile: string
    explicitPacks?: string[]
    source: "install" | "attach" | "sync"
    openCodeModels?: { buildModel: string; planModel: string }
    detailed?: boolean
    log?: (line: string) => void
  },
): void {
  const log = opts.log ?? console.log
  const installRequest = resolveToolkitInstallRequest({
    env,
    target,
    scope: opts.scope,
    dirArg: opts.dirArg,
    profile: opts.profile,
    explicitPacks: opts.explicitPacks,
  })
  const result = applyToolkitTarget({
    env,
    target,
    scope: opts.scope,
    rootDir: installRequest.rootDir,
    activePacks: installRequest.activePacks,
    source: opts.source,
    openCodeModels: opts.openCodeModels,
  })
  const sharedSkills = syncToolkitSharedSkills({
    env,
    scope: opts.scope,
    rootDir: installRequest.rootDir,
    activePacks: installRequest.activePacks,
  })

  if (opts.detailed) {
    log("Tool Install")
    log("============")
    log("")
    log(`Target: ${target}`)
    log(`Scope:  ${opts.scope}`)
    log(`Root:   ${installRequest.rootDir}`)
    log(`Packs:  ${installRequest.activePacks.length === 0 ? "(none)" : installRequest.activePacks.map((pack) => pack.id).join(", ")}`)
    log(`Files:  ${result.filesWritten}`)
    log("")
    if (sharedSkills.filesWritten > 0) {
      log(`Shared skills seeded: ${sharedSkills.filesWritten}`)
      log("")
    }
    if (opts.scope === "global") {
      log(`Local-first policy: prefer project installs for ${target} unless you explicitly want shared global state.`)
      log("")
    }
    if (target === "copilot" && opts.scope === "global") {
      log("This is a reusable global Copilot baseline, not a native Copilot host-global install.")
      log("")
    }
    return
  }

  log(`Installed ${target} (${opts.scope}) at ${installRequest.rootDir}`)
  for (const path of result.generatedPaths) {
    log(`- ${path}`)
  }
  for (const path of sharedSkills.generatedPaths) {
    log(`- ${path}`)
  }
  if (opts.scope === "global") {
    log(`Local-first policy: prefer project installs for ${target} unless you explicitly want shared global state.`)
  }
  if (target === "copilot" && opts.scope === "global") {
    log("This is a reusable global Copilot baseline, not a native Copilot host-global install.")
  }
}

export function runToolkitTargetPrune(
  env: ToolkitEnvironment,
  projectDir: string,
  desiredTargets: AdapterTarget[],
  applyChanges: boolean,
  opts?: { detailed?: boolean; log?: (line: string) => void },
): void {
  const log = opts?.log ?? console.log
  const plan = planToolkitTargetPrune(env, projectDir, desiredTargets)

  if (opts?.detailed) {
    log("Project Tool Prune")
    log("==================")
    log("")
    log(`Project: ${projectDir}`)
    log(`Keep:    ${desiredTargets.join(", ")}`)
    log("")
    if (plan.removable.length === 0 && plan.blocked.length === 0) {
      log("Nothing to prune.")
      log("")
      return
    }
    if (plan.removable.length > 0) {
      log("Removable")
      for (const entry of plan.removable) {
        log(`  - ${entry.target}: ${entry.paths.join(", ")}`)
      }
    }
    if (plan.blocked.length > 0) {
      log("")
      log("Blocked")
      for (const entry of plan.blocked) {
        log(`  - ${entry.target}: ${entry.reason}`)
        if (entry.paths.length > 0) {
          log(`    ${entry.paths.join(", ")}`)
        }
      }
    }
    if (!applyChanges) {
      log("")
      log("Dry run only. Re-run with `--yes` to remove the removable targets.")
      log("")
      return
    }
    const result = applyToolkitTargetPrune(env, projectDir, plan)
    log("")
    log(`Removed targets: ${result.removedTargets.length === 0 ? "(none)" : result.removedTargets.join(", ")}`)
    log(`Removed files:   ${result.removedPaths.length}`)
    if (result.blocked.length > 0) {
      log("Blocked targets remain unchanged.")
    }
    log("")
    return
  }

  if (!applyChanges) {
    log(`Would remove ${plan.prunableTargets.length} target(s): ${plan.prunableTargets.join(", ") || "none"}`)
    return
  }
  const result = applyToolkitTargetPrune(env, projectDir, plan)
  log(`Removed ${result.removedPaths.length} path(s).`)
}

export function runToolkitReport(
  env: ToolkitEnvironment,
  reportType: string | undefined,
  args: string[],
  execShell: ExecShellFn,
  cwd: string,
): string {
  const reportScripts: Record<string, string> = {
    "session-audit": "opencode_session_audit.py",
    "codex-session-audit": "codex_session_audit.py",
    "copilot-session-audit": "copilot_session_audit.py",
    "optimise": "opencode_optimise_report.py",
    "optimise-compare": "opencode_optimise_compare.py",
    "review-framework": "opencode_framework_review.py",
  }

  if (!reportType || !(reportType in reportScripts)) {
    throw new CliCommandError(
      `Usage: ${env.hostConventions.cliCommand} report <session-audit|codex-session-audit|copilot-session-audit|optimise|optimise-compare|review-framework> [script args]`,
    )
  }

  const scriptPath = join(env.toolkitScriptsDir, reportScripts[reportType])
  const directoryArg = (() => {
    for (let index = 0; index < args.length; index++) {
      const current = args[index]
      if (current === "--dir" && index + 1 < args.length) {
        return resolve(args[index + 1])
      }
      if (current.startsWith("--dir=")) {
        return resolve(current.slice("--dir=".length))
      }
    }
    return cwd
  })()
  const auditsDir = join(directoryArg, env.hostConventions.auditsDir)
  const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19)
  const reportArgs = [...args]
  const hasOut = reportArgs.includes("--out")
  const hasAuditsDir = reportArgs.includes("--audits-dir")

  if (!hasOut) {
    const defaultNames: Record<string, string> = {
      "session-audit": `opencode-audit-${stamp}.md`,
      "codex-session-audit": `codex-audit-${stamp}.md`,
      "copilot-session-audit": `copilot-audit-${stamp}.md`,
      "optimise": `opencode-optimise-${stamp}.md`,
      "optimise-compare": `opencode-optimise-compare-${stamp}.md`,
      "review-framework": `framework-review-${stamp}.md`,
    }
    reportArgs.push("--out", join(auditsDir, defaultNames[reportType]))
  }

  if (!hasAuditsDir) {
    reportArgs.push("--audits-dir", auditsDir)
  }

  const result = execShell("python3", [scriptPath, ...reportArgs], cwd)
  if (result.code !== 0) {
    throw new CliCommandError(result.stderr || result.stdout || `Report failed: ${reportType}`, result.code || 1)
  }
  return result.stdout
}
