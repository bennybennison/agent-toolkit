import { readFileSync } from "node:fs"
import { join } from "node:path"
import { type ResolvedPack } from "../pack-resolver"

export type ToolManifestKind = "mcp-server" | "content-bundle"
export type ToolEnvValue =
  | { kind: "literal"; value: string }
  | { kind: "env-ref"; envVar: string }

export interface BaseToolManifest {
  id: string
  name: string
  kind: ToolManifestKind
  category: string
  sourcePackId: string
  sourcePackName: string
  profiles: string[]
  autoDetectFiles: string[]
  always: boolean
}

export interface McpHttpTransport {
  transport: "http"
  url: string
}

export interface McpStdioTransport {
  transport: "stdio"
  command: string
  args: string[]
  env: Record<string, ToolEnvValue>
}

export interface McpToolManifest extends BaseToolManifest {
  kind: "mcp-server"
  serverName: string
  enabledByDefault: boolean
  note?: string
  transport: McpHttpTransport | McpStdioTransport
}

export interface ContentBundleToolManifest extends BaseToolManifest {
  kind: "content-bundle"
  bundleType: string
  files: {
    instructions: string[]
    commands: string[]
    agents: string[]
    hooks: string[]
    templates: string[]
    mcp: string[]
  }
}

export type ToolManifest = McpToolManifest | ContentBundleToolManifest

type RawMcpServer = {
  type?: string
  url?: string
  command?: unknown
  environment?: Record<string, unknown>
  enabled?: boolean
  note?: string
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function parseEnvValue(value: unknown): ToolEnvValue {
  if (typeof value !== "string") return { kind: "literal", value: String(value) }
  const match = value.match(/^\{env:([A-Z0-9_]+)\}$/)
  if (match) {
    return { kind: "env-ref", envVar: match[1] }
  }
  return { kind: "literal", value }
}

function buildContentBundleManifest(pack: ResolvedPack): ContentBundleToolManifest | null {
  const content = pack.manifest.content
  const manifest: ContentBundleToolManifest = {
    id: `${pack.id}:bundle`,
    name: pack.manifest.name,
    kind: "content-bundle",
    category: pack.manifest.category,
    sourcePackId: pack.id,
    sourcePackName: pack.manifest.name,
    profiles: pack.manifest.profiles ? [...pack.manifest.profiles] : [],
    autoDetectFiles: pack.manifest.auto_detect?.files ? [...pack.manifest.auto_detect.files] : [],
    always: pack.manifest.always ?? false,
    bundleType: pack.manifest.category,
    files: {
      instructions: (content.instructions ?? []).map((path) => `${pack.dir}/${path}`),
      commands: (content.commands ?? []).map((path) => `${pack.dir}/${path}`),
      agents: (content.agents ?? []).map((path) => `${pack.dir}/${path}`),
      hooks: [...(content.hooks ?? [])],
      templates: (content.templates ?? []).map((path) => `${pack.dir}/${path}`),
      mcp: (content.mcp ?? []).map((path) => `${pack.dir}/${path}`),
    },
  }

  const fileCount = Object.values(manifest.files).reduce((count, files) => count + files.length, 0)
  return fileCount > 0 ? manifest : null
}

function buildMcpToolManifests(pack: ResolvedPack): McpToolManifest[] {
  const manifests: McpToolManifest[] = []
  for (const relativePath of pack.manifest.content.mcp ?? []) {
    const file = JSON.parse(readFileSync(join(pack.dir, relativePath), "utf8")) as { servers?: Record<string, RawMcpServer> }
    for (const [serverName, server] of Object.entries(file.servers ?? {})) {
      const base = {
        id: `${pack.id}:${slugify(serverName)}`,
        name: serverName,
        kind: "mcp-server" as const,
        category: pack.manifest.category,
        sourcePackId: pack.id,
        sourcePackName: pack.manifest.name,
        profiles: pack.manifest.profiles ? [...pack.manifest.profiles] : [],
        autoDetectFiles: pack.manifest.auto_detect?.files ? [...pack.manifest.auto_detect.files] : [],
        always: pack.manifest.always ?? false,
        serverName,
        enabledByDefault: server.enabled ?? false,
        note: typeof server.note === "string" ? server.note : undefined,
      }

      if (server.type === "remote" && typeof server.url === "string") {
        manifests.push({
          ...base,
          transport: {
            transport: "http",
            url: server.url,
          },
        })
        continue
      }

      if (server.type === "local" && Array.isArray(server.command) && server.command.length > 0) {
        manifests.push({
          ...base,
          transport: {
            transport: "stdio",
            command: String(server.command[0]),
            args: server.command.slice(1).map((value) => String(value)),
            env: Object.fromEntries(
              Object.entries(server.environment ?? {}).map(([key, value]) => [key, parseEnvValue(value)]),
            ),
          },
        })
      }
    }
  }
  return manifests
}

export function loadToolManifestsFromResolvedPacks(packs: ResolvedPack[]): ToolManifest[] {
  const manifests: ToolManifest[] = []

  for (const pack of packs) {
    if (pack.manifest.category === "mcp") {
      manifests.push(...buildMcpToolManifests(pack))
      continue
    }

    const contentBundle = buildContentBundleManifest(pack)
    if (contentBundle) manifests.push(contentBundle)
  }

  return manifests.sort((left, right) => left.id.localeCompare(right.id))
}

export function getMcpToolManifests(toolManifests: ToolManifest[]): McpToolManifest[] {
  return toolManifests
    .filter((manifest): manifest is McpToolManifest => manifest.kind === "mcp-server")
    .sort((left, right) => left.serverName.localeCompare(right.serverName))
}
