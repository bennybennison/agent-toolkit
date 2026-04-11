import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { renderVSCodeMcpConfig } from "../../runtime/lib/tooling/mcp-renderers"
import { type ToolManifest } from "../../runtime/lib/tooling/tool-manifests"

export interface VSCodeSyncResult {
  filesWritten: number
  paths: string[]
}

export interface VSCodeGenerateOptions {
  mode?: "project" | "global"
  toolManifests?: ToolManifest[]
  templateTokens?: Record<string, string>
}

function getTemplatesDir(): string {
  const dir = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))
  return join(dir, "..", "..", "templates", "vscode")
}

function readJSON(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>
}

function readRenderedJSON(path: string, templateTokens?: Record<string, string>): Record<string, unknown> {
  let contents = readFileSync(path, "utf8")
  for (const [token, value] of Object.entries(templateTokens ?? {}).sort(([left], [right]) => right.length - left.length)) {
    contents = contents.split(token).join(value)
  }
  return JSON.parse(contents) as Record<string, unknown>
}

function writeJSON(path: string, data: Record<string, unknown>): void {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8")
}

function mergeJsonConfigWithTokens(src: string, dest: string, templateTokens?: Record<string, string>): boolean {
  if (!existsSync(dest)) {
    const rendered = readRenderedJSON(src, templateTokens)
    mkdirSync(dirname(dest), { recursive: true })
    writeJSON(dest, rendered)
    return true
  }

  const template = readRenderedJSON(src, templateTokens)
  const existing = readJSON(dest)
  let changed = false

  for (const [key, value] of Object.entries(template)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      if (!existing[key] || typeof existing[key] !== "object" || Array.isArray(existing[key])) {
        existing[key] = {}
      }
      for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
        const nested = existing[key] as Record<string, unknown>
        if (!(subKey in nested)) {
          nested[subKey] = subValue
          changed = true
        }
      }
      continue
    }

    if (!(key in existing)) {
      existing[key] = value
      changed = true
    }
  }

  if (changed) {
    writeJSON(dest, existing)
  }

  return changed
}

function mergeGeneratedMcpConfig(dest: string, generated: ReturnType<typeof renderVSCodeMcpConfig>): boolean {
  const existing = existsSync(dest) ? readJSON(dest) : {}
  let changed = false

  if (!existing.servers || typeof existing.servers !== "object" || Array.isArray(existing.servers)) {
    existing.servers = {}
    changed = true
  }

  const servers = existing.servers as Record<string, unknown>
  for (const [name, config] of Object.entries(generated.servers)) {
    if (!(name in servers)) {
      servers[name] = config
      changed = true
    }
  }

  if (generated.inputs && generated.inputs.length > 0) {
    const existingInputs = Array.isArray(existing.inputs) ? existing.inputs as Array<Record<string, unknown>> : []
    const existingIds = new Set(
      existingInputs
        .map((input) => typeof input.id === "string" ? input.id : null)
        .filter((value): value is string => value !== null),
    )
    for (const input of generated.inputs) {
      if (existingIds.has(input.id)) continue
      existingInputs.push(input)
      existingIds.add(input.id)
      changed = true
    }
    if (existingInputs.length > 0) {
      existing.inputs = existingInputs
    }
  }

  if (changed) {
    writeJSON(dest, existing)
  }

  return changed
}

export function generateVSCodeSurface(projectDir: string, options?: VSCodeGenerateOptions): VSCodeSyncResult {
  const templatesDir = getTemplatesDir()
  const mode = options?.mode ?? "project"
  const vscodeDir = mode === "global" ? projectDir : join(projectDir, ".vscode")
  const result: VSCodeSyncResult = { filesWritten: 0, paths: [] }

  mkdirSync(vscodeDir, { recursive: true })

  for (const file of ["settings.json", "mcp.json"]) {
    const changed = mergeJsonConfigWithTokens(join(templatesDir, file), join(vscodeDir, file), options?.templateTokens)
    if (changed || existsSync(join(vscodeDir, file))) {
      result.filesWritten++
      result.paths.push(mode === "global" ? file : `.vscode/${file}`)
    }
  }

  if (options?.toolManifests && options.toolManifests.length > 0) {
    const mcpPath = join(vscodeDir, "mcp.json")
    const merged = mergeGeneratedMcpConfig(mcpPath, renderVSCodeMcpConfig(options.toolManifests))
    if (merged) {
      const relPath = mode === "global" ? "mcp.json" : ".vscode/mcp.json"
      if (!result.paths.includes(relPath)) {
        result.filesWritten++
        result.paths.push(relPath)
      }
    }
  }

  return result
}
