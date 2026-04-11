import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs"
import { homedir, platform } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import { type ToolkitEnvironment } from "../toolkit-environment"
import { type AdapterTarget } from "./adapter-targets"
import { loadGlobalInstallRegistry, saveGlobalInstallRegistry } from "./install-registry"
import { type InstalledTargetRecord } from "./contracts"

export type GlobalToolItemKind = "plugin" | "dependency" | "instruction" | "marketplace-plugin" | "plugin-dir" | "baseline-dir" | "registry-install"
export type GlobalCleanupMode = "toolkit" | "all" | "select"

export interface GlobalToolInventoryItem {
  key: string
  kind: GlobalToolItemKind
  value: string
  location: string
  managedByToolkit: boolean
  detail?: string
}

export interface GlobalToolInventory {
  target: AdapterTarget
  scope: "global"
  rootDir: string
  items: GlobalToolInventoryItem[]
}

export interface GlobalToolCleanupPlan {
  target: AdapterTarget
  scope: "global"
  rootDir: string
  mode: GlobalCleanupMode
  removable: GlobalToolInventoryItem[]
  missingSelections: string[]
}

export interface GlobalToolCleanupResult {
  removed: GlobalToolInventoryItem[]
  missingSelections: string[]
}

function readJSON(path: string): Record<string, any> {
  if (!existsSync(path)) return {}
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, any>
}

function writeJSON(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8")
}

function getGlobalRegistryBase(env: ToolkitEnvironment): string {
  return join(homedir(), ".config", env.globalRegistryDirName)
}

function getRenderedInstructionRoot(env: ToolkitEnvironment): string {
  return join(getGlobalRegistryBase(env), "opencode-instructions")
}

function isToolkitManagedOpenCodeInstruction(env: ToolkitEnvironment, value: string): boolean {
  const renderedRoot = getRenderedInstructionRoot(env)
  if (value.startsWith(renderedRoot + "/")) return true
  if (value.includes(`/${env.packageName}/`)) return true
  if (value.startsWith(env.toolkitRoot + "/")) return true
  return false
}

function isToolkitManagedCodexRecord(env: ToolkitEnvironment, entry: InstalledTargetRecord): boolean {
  return entry.generatedPaths.some((path) => path.includes(`plugins/${env.toolkitPluginName}/`) || path === ".agents/plugins/marketplace.json")
}

function listCodexPluginDirs(rootDir: string): string[] {
  const pluginsDir = join(rootDir, "plugins")
  if (!existsSync(pluginsDir)) return []
  return readdirSync(pluginsDir)
    .map((name) => join(pluginsDir, name))
    .filter((pluginDir) => existsSync(join(pluginDir, ".codex-plugin", "plugin.json")))
}

function normalizeRootDir(env: ToolkitEnvironment, target: AdapterTarget, rootDir?: string): string {
  if (rootDir) return resolve(rootDir)
  if (target === "codex") return homedir()
  if (target === "opencode") return env.opencodeConfigDir
  if (target === "copilot") return join(homedir(), ".config", env.globalRegistryDirName, "copilot")
  if (target === "vscode") {
    if (platform() === "darwin") {
      return join(homedir(), "Library", "Application Support", "Code", "User")
    }
    if (platform() === "win32") {
      return join(homedir(), "AppData", "Roaming", "Code", "User")
    }
    return join(homedir(), ".config", "Code", "User")
  }
  return homedir()
}

export function inspectGlobalToolSurface(
  env: ToolkitEnvironment,
  target: AdapterTarget,
  rootDir?: string,
): GlobalToolInventory {
  const resolvedRootDir = normalizeRootDir(env, target, rootDir)
  const items: GlobalToolInventoryItem[] = []
  const registry = loadGlobalInstallRegistry(getGlobalRegistryBase(env))

  if (target === "opencode") {
    const configPath = join(resolvedRootDir, "opencode.json")
    const packageJsonPath = join(resolvedRootDir, "package.json")
    const config = readJSON(configPath)
    const pkg = readJSON(packageJsonPath)

    for (const plugin of Array.isArray(config.plugin) ? config.plugin : []) {
      items.push({
        key: `plugin:${plugin}`,
        kind: "plugin",
        value: String(plugin),
        location: configPath,
        managedByToolkit: plugin === env.packageName || plugin === env.toolkitPluginName,
      })
    }

    const deps = pkg.dependencies && typeof pkg.dependencies === "object"
      ? Object.entries(pkg.dependencies as Record<string, string>)
      : []
    for (const [name, version] of deps) {
      if (name.startsWith("@opencode-ai/")) continue
      items.push({
        key: `dependency:${name}`,
        kind: "dependency",
        value: name,
        location: packageJsonPath,
        managedByToolkit: name === env.packageName || name === env.toolkitPluginName,
        detail: String(version),
      })
    }

    for (const instruction of Array.isArray(config.instructions) ? config.instructions : []) {
      items.push({
        key: `instruction:${instruction}`,
        kind: "instruction",
        value: String(instruction),
        location: configPath,
        managedByToolkit: isToolkitManagedOpenCodeInstruction(env, String(instruction)),
      })
    }

    for (const entry of registry.installs.filter((install) => install.target === "opencode" && install.scope === "global")) {
      items.push({
        key: `registry:${entry.target}:${entry.scope}:${entry.rootDir}`,
        kind: "registry-install",
        value: entry.rootDir,
        location: join(getGlobalRegistryBase(env), "tool-installs.json"),
        managedByToolkit: entry.rootDir === resolvedRootDir,
        detail: entry.activePackIds.join(", "),
      })
    }
  } else if (target === "codex") {
    const marketplacePath = join(resolvedRootDir, ".agents", "plugins", "marketplace.json")
    const marketplace = readJSON(marketplacePath)
    for (const plugin of Array.isArray(marketplace.plugins) ? marketplace.plugins : []) {
      const name = String(plugin?.name ?? "")
      const sourcePath = typeof plugin?.source?.path === "string" ? String(plugin.source.path) : ""
      items.push({
        key: `marketplace-plugin:${name}`,
        kind: "marketplace-plugin",
        value: name,
        location: marketplacePath,
        managedByToolkit: name === env.toolkitPluginName,
        detail: sourcePath,
      })
    }

    for (const pluginDir of listCodexPluginDirs(resolvedRootDir)) {
      const name = basename(pluginDir)
      items.push({
        key: `plugin-dir:${pluginDir}`,
        kind: "plugin-dir",
        value: name,
        location: pluginDir,
        managedByToolkit: name === env.toolkitPluginName,
      })
    }

    for (const entry of registry.installs.filter((install) => install.target === "codex" && install.scope === "global")) {
      items.push({
        key: `registry:${entry.target}:${entry.scope}:${entry.rootDir}`,
        kind: "registry-install",
        value: entry.rootDir,
        location: join(getGlobalRegistryBase(env), "tool-installs.json"),
        managedByToolkit: isToolkitManagedCodexRecord(env, entry),
        detail: existsSync(entry.rootDir) ? "present" : "missing",
      })
    }
  } else if (target === "copilot") {
    if (existsSync(resolvedRootDir)) {
      items.push({
        key: `baseline-dir:${resolvedRootDir}`,
        kind: "baseline-dir",
        value: resolvedRootDir,
        location: resolvedRootDir,
        managedByToolkit: true,
      })
    }
    for (const entry of registry.installs.filter((install) => install.target === "copilot" && install.scope === "global")) {
      items.push({
        key: `registry:${entry.target}:${entry.scope}:${entry.rootDir}`,
        kind: "registry-install",
        value: entry.rootDir,
        location: join(getGlobalRegistryBase(env), "tool-installs.json"),
        managedByToolkit: true,
        detail: entry.activePackIds.join(", "),
      })
    }
  } else {
    for (const entry of registry.installs.filter((install) => install.target === target && install.scope === "global")) {
      items.push({
        key: `registry:${entry.target}:${entry.scope}:${entry.rootDir}`,
        kind: "registry-install",
        value: entry.rootDir,
        location: join(getGlobalRegistryBase(env), "tool-installs.json"),
        managedByToolkit: true,
        detail: entry.generatedPaths.join(", "),
      })
    }
  }

  items.sort((left, right) => left.key.localeCompare(right.key))
  return {
    target,
    scope: "global",
    rootDir: resolvedRootDir,
    items,
  }
}

export function planGlobalToolCleanup(
  env: ToolkitEnvironment,
  target: AdapterTarget,
  mode: GlobalCleanupMode,
  selectedKeys: string[] = [],
  rootDir?: string,
): GlobalToolCleanupPlan {
  const inventory = inspectGlobalToolSurface(env, target, rootDir)
  const itemMap = new Map(inventory.items.map((item) => [item.key, item]))
  const removable = mode === "all"
    ? [...inventory.items]
    : mode === "toolkit"
      ? inventory.items.filter((item) => item.managedByToolkit)
      : selectedKeys.flatMap((key) => {
          const item = itemMap.get(key)
          return item ? [item] : []
        })

  const expanded = [...removable]
  for (const item of removable) {
    if (item.kind !== "marketplace-plugin") continue
    const pluginDir = inventory.items.find((candidate) => candidate.kind === "plugin-dir" && candidate.value === item.value)
    if (pluginDir) expanded.push(pluginDir)
  }
  const deduped = Array.from(new Map(expanded.map((item) => [item.key, item])).values())
  const missingSelections = mode === "select"
    ? selectedKeys.filter((key) => !itemMap.has(key))
    : []

  return {
    target,
    scope: "global",
    rootDir: inventory.rootDir,
    mode,
    removable: deduped,
    missingSelections,
  }
}

function removeCodexPluginDir(pluginDirPath: string): void {
  if (!existsSync(pluginDirPath)) return
  const stats = statSync(pluginDirPath)
  if (stats.isDirectory()) {
    rmSync(pluginDirPath, { recursive: true, force: true })
    return
  }
  unlinkSync(pluginDirPath)
}

function removeDirectoryIfPresent(path: string): void {
  if (!existsSync(path)) return
  const stats = statSync(path)
  if (stats.isDirectory()) {
    rmSync(path, { recursive: true, force: true })
    return
  }
  unlinkSync(path)
}

export function applyGlobalToolCleanup(
  env: ToolkitEnvironment,
  target: AdapterTarget,
  plan: GlobalToolCleanupPlan,
): GlobalToolCleanupResult {
  const removed: GlobalToolInventoryItem[] = []
  const selectedKeys = new Set(plan.removable.map((item) => item.key))

  if (target === "opencode") {
    const configPath = join(plan.rootDir, "opencode.json")
    const packageJsonPath = join(plan.rootDir, "package.json")
    const config = readJSON(configPath)
    const pkg = readJSON(packageJsonPath)

    if (Array.isArray(config.plugin)) {
      const originalPlugins = [...config.plugin]
      const nextPlugins = config.plugin.filter((value: string) => !selectedKeys.has(`plugin:${value}`))
      config.plugin = nextPlugins
      if (nextPlugins.length === 0) delete config.plugin
      if (nextPlugins.length !== originalPlugins.length) {
        for (const value of originalPlugins) {
          if (!selectedKeys.has(`plugin:${value}`)) continue
          removed.push({
            key: `plugin:${value}`,
            kind: "plugin",
            value,
            location: configPath,
            managedByToolkit: value === env.packageName || value === env.toolkitPluginName,
          })
        }
      }
    }

    if (Array.isArray(config.instructions)) {
      const originalInstructions = [...config.instructions]
      config.instructions = config.instructions.filter((value: string) => !selectedKeys.has(`instruction:${value}`))
      if (config.instructions.length === 0) delete config.instructions
      for (const value of originalInstructions) {
        if (selectedKeys.has(`instruction:${value}`)) {
          removed.push({
            key: `instruction:${value}`,
            kind: "instruction",
            value,
            location: configPath,
            managedByToolkit: isToolkitManagedOpenCodeInstruction(env, value),
          })
        }
      }
    }

    writeJSON(configPath, config)

    if (pkg.dependencies && typeof pkg.dependencies === "object") {
      const dependencyEntries = Object.entries(pkg.dependencies as Record<string, string>)
      let changed = false
      for (const [name, version] of dependencyEntries) {
        if (!selectedKeys.has(`dependency:${name}`) && !selectedKeys.has(`plugin:${name}`)) continue
        delete pkg.dependencies[name]
        removed.push({
          key: `dependency:${name}`,
          kind: "dependency",
          value: name,
          location: packageJsonPath,
          managedByToolkit: name === env.packageName || name === env.toolkitPluginName,
          detail: String(version),
        })
        changed = true
      }
      if (changed) {
        if (Object.keys(pkg.dependencies).length === 0) delete pkg.dependencies
        writeJSON(packageJsonPath, pkg)
      }
    }
  } else if (target === "codex") {
    const marketplacePath = join(plan.rootDir, ".agents", "plugins", "marketplace.json")
    const marketplace = readJSON(marketplacePath)
    if (Array.isArray(marketplace.plugins)) {
      const originalPlugins = [...marketplace.plugins]
      marketplace.plugins = marketplace.plugins.filter((plugin: Record<string, any>) => {
        const name = String(plugin?.name ?? "")
        return !selectedKeys.has(`marketplace-plugin:${name}`)
      })
      for (const plugin of originalPlugins) {
        const name = String(plugin?.name ?? "")
        if (!selectedKeys.has(`marketplace-plugin:${name}`)) continue
        removed.push({
          key: `marketplace-plugin:${name}`,
          kind: "marketplace-plugin",
          value: name,
          location: marketplacePath,
          managedByToolkit: name === env.toolkitPluginName,
          detail: typeof plugin?.source?.path === "string" ? String(plugin.source.path) : undefined,
        })
      }
      if (marketplace.plugins.length === 0) {
        delete marketplace.plugins
      }
      writeJSON(marketplacePath, marketplace)
    }

    for (const item of plan.removable.filter((entry) => entry.kind === "plugin-dir")) {
      removeCodexPluginDir(item.location)
      removed.push(item)
    }
  } else if (target === "copilot" || target === "vscode") {
    for (const item of plan.removable.filter((entry) => entry.kind === "baseline-dir" || entry.kind === "plugin-dir")) {
      removeDirectoryIfPresent(item.location)
      removed.push(item)
    }
  }

  const registryPath = join(getGlobalRegistryBase(env), "tool-installs.json")
  const registry = loadGlobalInstallRegistry(getGlobalRegistryBase(env))
  const keptInstalls: InstalledTargetRecord[] = []
  for (const entry of registry.installs) {
    const key = `registry:${entry.target}:${entry.scope}:${entry.rootDir}`
    if (!selectedKeys.has(key)) {
      keptInstalls.push(entry)
      continue
    }
    removed.push({
      key,
      kind: "registry-install",
      value: entry.rootDir,
      location: registryPath,
      managedByToolkit: target === "codex" ? isToolkitManagedCodexRecord(env, entry) : entry.rootDir === plan.rootDir,
      detail: entry.activePackIds.join(", "),
    })
  }
  registry.installs = keptInstalls
  saveGlobalInstallRegistry(registry, getGlobalRegistryBase(env))

  removed.sort((left, right) => left.key.localeCompare(right.key))
  return {
    removed,
    missingSelections: plan.missingSelections,
  }
}
