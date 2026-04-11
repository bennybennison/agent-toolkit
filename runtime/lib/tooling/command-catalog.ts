import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { type ToolkitEnvironment } from "../toolkit-environment"
import { type CommandCatalogEntry, type CommandSurface } from "./contracts"

function parseFrontmatter(filePath: string): Record<string, string> {
  const raw = readFileSync(filePath, "utf8")
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}

  const result: Record<string, string> = {}
  for (const line of match[1].split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const pair = trimmed.match(/^([A-Za-z0-9_-]+):\s*(.+)$/)
    if (!pair) continue
    result[pair[1]] = pair[2].trim()
  }
  return result
}

function parseBoolean(value: string | undefined): boolean {
  return value === "true"
}

function inferSurface(frontmatter: Record<string, string>): CommandSurface {
  const surface = frontmatter.surface
  if (surface === "user" || surface === "user-agent" || surface === "internal") {
    return surface
  }
  return frontmatter.agent ? "user-agent" : "user"
}

function getMarkdownFiles(dir: string, exclude: string[] = []): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((file) => file.endsWith(".md") && !exclude.includes(file))
    .sort()
}

export function listToolkitCommands(env: ToolkitEnvironment): CommandCatalogEntry[] {
  const entries: CommandCatalogEntry[] = []
  const seen = new Set<string>()

  for (const packDirName of readdirSync(env.packsDir).sort()) {
    const commandsDir = join(env.packsDir, packDirName, "commands")
    for (const file of getMarkdownFiles(commandsDir)) {
      const filePath = join(commandsDir, file)
      const frontmatter = parseFrontmatter(filePath)
      const id = file.replace(/\.md$/, "")
      seen.add(id)
      entries.push({
        id,
        description: frontmatter.description ?? "",
        source: "pack",
        sourcePath: filePath,
        packId: packDirName,
        surface: inferSurface(frontmatter),
        delegatedAgent: frontmatter.agent ?? null,
        subtask: parseBoolean(frontmatter.subtask),
      })
    }
  }

  const legacyCommandsDir = join(env.toolkitContentDir, "commands")
  for (const file of getMarkdownFiles(legacyCommandsDir, ["README.md"])) {
    const id = file.replace(/\.md$/, "")
    if (seen.has(id)) continue

    const filePath = join(legacyCommandsDir, file)
    const frontmatter = parseFrontmatter(filePath)
    entries.push({
      id,
      description: frontmatter.description ?? "",
      source: "legacy",
      sourcePath: filePath,
      surface: inferSurface(frontmatter),
      delegatedAgent: frontmatter.agent ?? null,
      subtask: parseBoolean(frontmatter.subtask),
    })
  }

  return entries.sort((left, right) => left.id.localeCompare(right.id))
}
