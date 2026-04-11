import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, unlinkSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { homedir } from "node:os"
import { type ToolkitEnvironment } from "./toolkit-environment"
import { loadGlobalInstallRegistry, recordInstalledTarget, saveGlobalInstallRegistry } from "./tooling/install-registry"

export interface ShellResult {
  code: number
  stdout: string
  stderr: string
}

export interface OpenCodeGlobalInstallResult {
  pluginAdded: boolean
  staleInstructionCount: number
  activePackIds: string[]
  addedInstructionPaths: string[]
  removedLegacySymlinks: number
  shortcutInstalled: boolean
  shortcutPath: string
  globalConfigCreated: boolean
}

function readJSON(path: string): Record<string, any> {
  if (!existsSync(path)) return {}
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, any>
}

function writeJSON(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8")
}

function arrayAdd(arr: string[], item: string): boolean {
  if (arr.includes(item)) return false
  arr.push(item)
  return true
}

function arrayRemove(arr: string[], item: string): boolean {
  const idx = arr.indexOf(item)
  if (idx === -1) return false
  arr.splice(idx, 1)
  return true
}

export function installOpenCodeGlobal(options: {
  env: ToolkitEnvironment
  execShell: (cmd: string, args: string[], cwd: string) => ShellResult
}): OpenCodeGlobalInstallResult {
  const { env, execShell } = options
  mkdirSync(env.opencodeConfigDir, { recursive: true })

  const packageJsonPath = join(env.opencodeConfigDir, "package.json")
  const pkg = readJSON(packageJsonPath)
  if (!pkg.dependencies) pkg.dependencies = {}
  pkg.dependencies[env.packageName] = `file:${env.workspaceRoot}`
  writeJSON(packageJsonPath, pkg)

  const installResult = execShell("bun", ["install"], env.opencodeConfigDir)
  if (installResult.code !== 0) {
    throw new Error(installResult.stderr || "bun install failed")
  }

  const config = readJSON(env.opencodeJsonPath)
  if (!Array.isArray(config.plugin)) config.plugin = []
  const pluginAdded = arrayAdd(config.plugin, env.packageName)

  if (!Array.isArray(config.instructions)) config.instructions = []
  const oldLen = config.instructions.length
  config.instructions = config.instructions.filter(
    (p: string) => !p.includes(".opencode/") || !p.includes(env.packageName),
  )
  config.instructions = config.instructions.filter((p: string) => {
    if (!p.startsWith(env.workspaceRoot + "/")) return true
    const rel = p.slice(env.workspaceRoot.length + 1)
    return rel.startsWith("content/")
      || rel.startsWith("agent-toolkit/content/")
      || rel.startsWith("agent-toolkit/packs/")
      || rel.startsWith("agent-toolkit/content/")
      || rel.startsWith("agent-toolkit/packs/")
  })
  const staleInstructionCount = oldLen - config.instructions.length
  config.instructions = config.instructions.filter((p: string) => !p.includes("/packs/"))
  const renderedInstructionsDir = join(homedir(), ".config", env.globalRegistryDirName, "opencode-instructions")
  config.instructions = config.instructions.filter((p: string) => !p.startsWith(renderedInstructionsDir + "/"))

  const addedInstructionPaths: string[] = []

  let removedLegacySymlinks = 0
  const pluginsDir = join(env.opencodeConfigDir, "plugins")
  if (existsSync(pluginsDir)) {
    for (const file of readdirSync(pluginsDir)) {
      if (!file.endsWith(".ts")) continue
      const fullPath = join(pluginsDir, file)
      if (lstatSync(fullPath).isSymbolicLink()) {
        const target = readlinkSync(fullPath)
        if (target.includes(env.packageName) || target.includes(env.workspaceRoot)) {
          unlinkSync(fullPath)
          removedLegacySymlinks++
        }
      }
    }
  }

  writeJSON(env.opencodeJsonPath, config)

  const registry = loadGlobalInstallRegistry(join(homedir(), ".config", env.globalRegistryDirName))
  recordInstalledTarget(registry, {
    target: "opencode",
    scope: "global",
    rootDir: env.opencodeConfigDir,
    source: "install",
    generatedPaths: ["opencode.json", "package.json"],
    activePackIds: [],
  })
  saveGlobalInstallRegistry(registry, join(homedir(), ".config", env.globalRegistryDirName))

  const localBinDir = join(homedir(), ".local", "bin")
  const shortcutPath = join(localBinDir, env.hostConventions.cliCommand)
  let shortcutInstalled = false
  try {
    mkdirSync(localBinDir, { recursive: true })
    writeFileSync(shortcutPath, `#!/bin/sh\nexec bun ${env.cliEntrypointPath} "$@"\n`, { mode: 0o755 })
    shortcutInstalled = true
  } catch {
    shortcutInstalled = false
  }

  const globalConfigDir = join(homedir(), ".config", env.globalRegistryDirName)
  const globalConfigPath = join(globalConfigDir, "config.json")
  const defaultConfigPath = join(env.workspaceRoot, "config.json")
  let globalConfigCreated = false
  if (!existsSync(globalConfigPath) && existsSync(defaultConfigPath)) {
    mkdirSync(globalConfigDir, { recursive: true })
    copyFileSync(defaultConfigPath, globalConfigPath)
    globalConfigCreated = true
  }

  return {
    pluginAdded,
    staleInstructionCount,
    activePackIds: [],
    addedInstructionPaths,
    removedLegacySymlinks,
    shortcutInstalled,
    shortcutPath,
    globalConfigCreated,
  }
}

export function uninstallOpenCodeGlobal(options: {
  env: ToolkitEnvironment
  execShell: (cmd: string, args: string[], cwd: string) => ShellResult
}): void {
  const { env, execShell } = options
  const config = readJSON(env.opencodeJsonPath)

  if (Array.isArray(config.plugin)) {
    arrayRemove(config.plugin, env.packageName)
    if (config.plugin.length === 0) delete config.plugin
  }

  if (Array.isArray(config.instructions)) {
    config.instructions = config.instructions.filter((p: string) => !p.includes(env.packageName))
    if (config.instructions.length === 0) delete config.instructions
  }

  writeJSON(env.opencodeJsonPath, config)

  const packageJsonPath = join(env.opencodeConfigDir, "package.json")
  const pkg = readJSON(packageJsonPath)
  if (pkg.dependencies) {
    delete pkg.dependencies[env.packageName]
    writeJSON(packageJsonPath, pkg)
    execShell("bun", ["install"], env.opencodeConfigDir)
  }

  const registry = loadGlobalInstallRegistry(join(homedir(), ".config", env.globalRegistryDirName))
  registry.installs = registry.installs.filter(
    (entry) => !(entry.target === "opencode" && entry.scope === "global"),
  )
  saveGlobalInstallRegistry(registry, join(homedir(), ".config", env.globalRegistryDirName))
}
