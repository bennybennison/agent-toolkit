import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { type ResolvedPack } from "../../runtime/lib/pack-resolver"
import { renderCodexMcpConfig } from "../../runtime/lib/tooling/mcp-renderers"
import { loadToolManifestsFromResolvedPacks } from "../../runtime/lib/tooling/tool-manifests"

type TemplateValueMap = Record<string, string>

type MarketplacePluginEntry = {
  name: string
  source: {
    source: "local"
    path: string
  }
  policy: {
    installation: "AVAILABLE"
    authentication: "ON_INSTALL"
  }
  category: string
}

type MarketplaceFile = {
  name: string
  interface?: {
    displayName?: string
  }
  plugins: MarketplacePluginEntry[]
}

export interface CodexSyncOptions {
  rootDir: string
  pluginName: string
  displayName: string
  packageVersion: string
  authorName: string
  marketplaceName: string
  marketplaceDisplayName: string
  activePacks: ResolvedPack[]
}

export interface CodexSyncResult {
  filesWritten: number
  paths: string[]
  pluginRoot: string
  marketplacePath: string
}

function getTemplatesDir(): string {
  const dir = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))
  return join(dir, "templates")
}

function readJSON<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T
}

function writeJSON(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8")
}

function renderTemplate(path: string, values: TemplateValueMap): string {
  let rendered = readFileSync(path, "utf8")
  for (const [key, value] of Object.entries(values)) {
    rendered = rendered.replaceAll(key, value)
  }
  return rendered
}

function upsertMarketplacePlugin(file: MarketplaceFile, entry: MarketplacePluginEntry): MarketplaceFile {
  const existingIndex = file.plugins.findIndex((plugin) => plugin.name === entry.name)
  if (existingIndex >= 0) {
    file.plugins[existingIndex] = entry
  } else {
    file.plugins.push(entry)
  }
  return file
}

export function generateCodexSurface(options: CodexSyncOptions): CodexSyncResult {
  const templatesDir = getTemplatesDir()
  const marketplacePath = join(options.rootDir, ".agents", "plugins", "marketplace.json")
  const pluginRoot = join(options.rootDir, "plugins", options.pluginName)
  const pluginManifestPath = join(pluginRoot, ".codex-plugin", "plugin.json")
  const mcpConfigPath = join(pluginRoot, ".mcp.json")
  const result: CodexSyncResult = {
    filesWritten: 0,
    paths: [],
    pluginRoot,
    marketplacePath,
  }

  mkdirSync(join(pluginRoot, ".codex-plugin"), { recursive: true })

  const toolManifests = loadToolManifestsFromResolvedPacks(options.activePacks)
  const mcpConfig = renderCodexMcpConfig(toolManifests)
  writeJSON(mcpConfigPath, mcpConfig)
  result.filesWritten++
  result.paths.push(join("plugins", options.pluginName, ".mcp.json"))

  const pluginDescription = `Reusable Codex plugin for ${options.displayName}, generated from the local tool catalog.`
  const shortDescription = `Explore ideas, map code, repair bugs, and review issues`
  const longDescription = `Use ${options.displayName} in Codex to explore rough ideas, map repository fit, diagnose bugs, review issues and pull requests, and load selected MCP capabilities without coupling project state to orchestration internals.`
  const defaultPrompts = [
    "Explore this rough idea, identify use cases and risks, and tell me whether to proceed.",
    "Map this change against the repo and show candidate placement, dependencies, and risks.",
    "Diagnose this bug, identify likely causes, and outline the safest repair path.",
    "Review this issue and call out risks, edge cases, and an implementation plan.",
    "Review this PR or diff for bugs, regressions, and missing tests.",
    "Turn this bug report into actionable next steps and verification checks.",
  ]

  const pluginManifest = JSON.parse(
    renderTemplate(join(templatesDir, "plugin.json"), {
      "__PLUGIN_NAME__": options.pluginName,
      "__PLUGIN_VERSION__": options.packageVersion,
      "__PLUGIN_DESCRIPTION__": pluginDescription,
      "__AUTHOR_NAME__": options.authorName,
      "__DISPLAY_NAME__": options.displayName,
      "__SHORT_DESCRIPTION__": shortDescription,
      "__LONG_DESCRIPTION__": longDescription,
      "__DEFAULT_PROMPT__": defaultPrompts[0],
      "__BRAND_COLOR__": "#111111",
    }),
  ) as Record<string, unknown>
  delete pluginManifest.skills
  const pluginInterface = pluginManifest.interface as Record<string, unknown> | undefined
  if (pluginInterface) {
    pluginInterface.defaultPrompt = defaultPrompts
  }
  writeJSON(pluginManifestPath, pluginManifest)
  result.filesWritten++
  result.paths.push(join("plugins", options.pluginName, ".codex-plugin", "plugin.json"))

  const marketplaceTemplate = JSON.parse(
    renderTemplate(join(templatesDir, "marketplace.json"), {
      "__MARKETPLACE_NAME__": options.marketplaceName,
      "__MARKETPLACE_DISPLAY_NAME__": options.marketplaceDisplayName,
    }),
  ) as MarketplaceFile
  const marketplace = existsSync(marketplacePath)
    ? readJSON<MarketplaceFile>(marketplacePath)
    : marketplaceTemplate

  if (!marketplace.interface) marketplace.interface = {}
  if (!marketplace.interface.displayName) marketplace.interface.displayName = options.marketplaceDisplayName
  if (!marketplace.name) marketplace.name = options.marketplaceName
  if (!Array.isArray(marketplace.plugins)) marketplace.plugins = []

  upsertMarketplacePlugin(marketplace, {
    name: options.pluginName,
    source: {
      source: "local",
      path: `./plugins/${options.pluginName}`,
    },
    policy: {
      installation: "AVAILABLE",
      authentication: "ON_INSTALL",
    },
    category: "Coding",
  })
  writeJSON(marketplacePath, marketplace)
  result.filesWritten++
  result.paths.push(join(".agents", "plugins", "marketplace.json"))

  return result
}
