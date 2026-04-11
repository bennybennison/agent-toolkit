import type { GlobalCleanupMode } from "./toolkit-operations"
import { getAdapterTargets, isAdapterTarget, type AdapterTarget } from "./tooling/adapter-targets"

export class CliCommandError extends Error {
  exitCode: number

  constructor(message: string, exitCode = 1) {
    super(message)
    this.name = "CliCommandError"
    this.exitCode = exitCode
  }
}

export type InstallScopeFlag = "project" | "global"
export type ToolSet = "all" | AdapterTarget

export function parseTools(args: string[]): ToolSet[] {
  const idx = args.indexOf("--tools")
  if (idx < 0 || idx + 1 >= args.length) return ["all"]
  const raw = args[idx + 1].split(",").map((value) => value.trim().toLowerCase())
  const tools: ToolSet[] = []
  for (const candidate of raw) {
    if (candidate === "all") {
      tools.push("all")
      continue
    }
    if (!isAdapterTarget(candidate)) {
      throw new CliCommandError(`Unknown tool: "${candidate}". Valid: all, ${getAdapterTargets().join(", ")}`)
    }
    tools.push(candidate)
  }
  return tools.includes("all") ? ["all"] : tools
}

export function shouldGenerate(tools: ToolSet[], tool: AdapterTarget): boolean {
  return tools.includes("all") || tools.includes(tool)
}

export function parseProfileArg(args: string[], fallback: string): string {
  const idx = args.indexOf("--profile")
  if (idx < 0 || idx + 1 >= args.length) return fallback
  return String(args[idx + 1])
}

export function parseScopeArg(args: string[], fallback: InstallScopeFlag): InstallScopeFlag {
  const idx = args.indexOf("--scope")
  if (idx < 0 || idx + 1 >= args.length) return fallback
  const scope = args[idx + 1]
  if (scope === "project" || scope === "global") return scope
  throw new CliCommandError(`Unknown scope: "${scope}". Valid: project, global`)
}

export function parsePackIds(args: string[]): string[] | undefined {
  const idx = args.indexOf("--packs")
  if (idx < 0 || idx + 1 >= args.length) return undefined
  const raw = args[idx + 1].split(",").map((value) => value.trim()).filter(Boolean)
  return raw.length > 0 ? raw : undefined
}

export function parseOptionalDirArg(value: string | undefined): string | undefined {
  if (!value || value.startsWith("--")) return undefined
  return value
}

export function parseCleanupMode(args: string[], fallback: GlobalCleanupMode = "toolkit"): GlobalCleanupMode {
  const idx = args.indexOf("--mode")
  if (idx < 0 || idx + 1 >= args.length) return fallback
  const mode = args[idx + 1]
  if (mode === "toolkit" || mode === "all" || mode === "select") return mode
  throw new CliCommandError(`Unknown cleanup mode: "${mode}". Valid: toolkit, all, select`)
}

export function parseSelectArg(args: string[]): string[] {
  const idx = args.indexOf("--select")
  if (idx < 0 || idx + 1 >= args.length) return []
  return args[idx + 1].split(",").map((value) => value.trim()).filter(Boolean)
}

export function hasVerboseFlag(args: string[]): boolean {
  return args.includes("--verbose")
}
