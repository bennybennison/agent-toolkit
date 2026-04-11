/**
 * OpenCode Adapter — generates opencode.json for a project
 *
 * Creates a minimal opencode.json pointing to project-local rules.
 * Global install handles the framework's content instruction paths.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

export interface OpenCodeSyncResult {
  created: boolean
  cleaned: boolean
  path: string
}

export interface OpenCodeGenerateOptions {
  buildModel?: string
  planModel?: string
  instructions?: string[]
  legacyInstructionPrefixes?: string[]
  managedInstructionPrefixes?: string[]
}

function arraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

function readJSON(path: string): any {
  return JSON.parse(readFileSync(path, "utf8"))
}

function writeJSON(path: string, data: any): void {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8")
}

/**
 * Generate or update opencode.json in a project directory.
 * - If no opencode.json exists, creates a minimal one
 * - If one exists with legacy .opencode/ symlink paths, cleans them
 */
export function generateOpenCodeSurface(projectDir: string, options?: OpenCodeGenerateOptions): OpenCodeSyncResult {
  const ocPath = join(projectDir, "opencode.json")
  const result: OpenCodeSyncResult = { created: false, cleaned: false, path: "opencode.json" }
  const instructions = options?.instructions ?? [".agent-toolkit/rules/*.md"]
  const legacyInstructionPrefixes = options?.legacyInstructionPrefixes ?? [".opencode/"]
  const managedInstructionPrefixes = options?.managedInstructionPrefixes ?? []
  const buildModel = options?.buildModel ?? "github-copilot/claude-sonnet-4.6"
  const planModel = options?.planModel ?? "github-copilot/claude-sonnet-4.6"

  if (!existsSync(ocPath)) {
    writeJSON(ocPath, {
      $schema: "https://opencode.ai/config.json",
      instructions,
      agent: {
        build: { model: buildModel },
        plan: { model: planModel },
      },
    })
    result.created = true
    return result
  }

  // Clean legacy paths
  const config = readJSON(ocPath)
  const originalInstructions = Array.isArray(config.instructions) ? [...config.instructions] : []
  config.instructions = originalInstructions.filter((p: string) => {
    if (legacyInstructionPrefixes.some((prefix) => p.startsWith(prefix))) {
      return false
    }
    if (managedInstructionPrefixes.some((prefix) => p.startsWith(prefix))) {
      return false
    }
    return true
  })

  for (const instruction of instructions) {
    if (!config.instructions.includes(instruction)) {
      config.instructions.push(instruction)
    }
  }

  if (!config.agent || typeof config.agent !== "object") config.agent = {}
  if (!config.agent.build || typeof config.agent.build !== "object") config.agent.build = {}
  if (!config.agent.plan || typeof config.agent.plan !== "object") config.agent.plan = {}

  const buildChanged = config.agent.build.model !== buildModel
  const planChanged = config.agent.plan.model !== planModel
  config.agent.build.model = buildModel
  config.agent.plan.model = planModel

  const instructionsChanged = !arraysEqual(originalInstructions, config.instructions)
  if (instructionsChanged || buildChanged || planChanged) {
    writeJSON(ocPath, config)
    result.cleaned = instructionsChanged
  }

  return result
}
