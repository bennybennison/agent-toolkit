import { basename, dirname, extname, join, normalize } from "node:path"

import type { FileMapObject, FileRelationship } from "../contracts/mapping"

const TEXT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".md", ".yml", ".yaml", ".toml",
  ".py", ".sh", ".css", ".html",
])

export function inferLanguage(filePath: string): string {
  const extension = extname(filePath).toLowerCase()
  switch (extension) {
    case ".ts":
    case ".tsx":
      return "typescript"
    case ".js":
    case ".jsx":
    case ".mjs":
    case ".cjs":
      return "javascript"
    case ".json":
      return "json"
    case ".md":
      return "markdown"
    case ".py":
      return "python"
    case ".yml":
    case ".yaml":
      return "yaml"
    case ".toml":
      return "toml"
    case ".sh":
      return "shell"
    case ".css":
      return "css"
    case ".html":
      return "html"
    default:
      return extension ? extension.slice(1) : "unknown"
  }
}

export function isLikelyTextFile(filePath: string): boolean {
  return TEXT_EXTENSIONS.has(extname(filePath).toLowerCase())
}

export function inferTags(filePath: string, language: string): string[] {
  const tags = new Set<string>()
  const lowerPath = filePath.toLowerCase()
  const fileName = basename(lowerPath)

  if (lowerPath.includes("/test") || lowerPath.includes("/tests/") || fileName.includes(".test.") || fileName.includes(".spec.")) tags.add("test")
  if (fileName === "package.json" || fileName.endsWith(".config.ts") || fileName.endsWith(".config.js") || lowerPath.includes("/config")) tags.add("config")
  if (lowerPath.endsWith(".md")) tags.add("documentation")
  if (lowerPath.includes("/runtime/")) tags.add("runtime")
  if (lowerPath.includes("/hooks/")) tags.add("hook")
  if (lowerPath.includes("/orchestrator/")) tags.add("orchestrator")
  if (lowerPath.includes("/contracts/")) tags.add("contract")
  if (lowerPath.includes("/tests/")) tags.add("test")
  if (lowerPath.includes("/content/")) tags.add("content")
  if (!tags.has("documentation") && !tags.has("config") && !tags.has("test")) tags.add("source")
  tags.add(language)

  return [...tags]
}

export function summarizeFile(path: string, language: string, tags: string[], content: string | null): { summary: string; purpose: string; keySymbols: string[] } {
  const fileName = basename(path)

  if (language === "markdown" && content) {
    const heading = content.split("\n").find((line) => line.startsWith("# "))
    if (heading) {
      return {
        summary: `${heading.replace(/^#\s+/, "")} (${fileName})`,
        purpose: "Project documentation or operating guidance",
        keySymbols: heading ? [heading.replace(/^#\s+/, "")] : [],
      }
    }
  }

  if (fileName === "package.json" && content) {
    try {
      const pkg = JSON.parse(content) as Record<string, unknown>
      const name = typeof pkg.name === "string" ? pkg.name : fileName
      return {
        summary: `Package manifest for ${name}`,
        purpose: "Project package and dependency configuration",
        keySymbols: ["dependencies", "scripts"].filter((symbol) => symbol in pkg),
      }
    } catch {
      // fall through to heuristic summary
    }
  }

  const purpose = tags.includes("test")
    ? "Test coverage and verification behavior"
    : tags.includes("config")
      ? "Configuration and runtime settings"
      : tags.includes("documentation")
        ? "Documentation or operating instructions"
        : `Implementation module in ${dirname(path)}`

  return {
    summary: `${fileName} (${language})`,
    purpose,
    keySymbols: extractKeySymbols(language, content),
  }
}

export function extractRelationships(path: string, content: string | null, allPaths: Set<string>): FileRelationship[] {
  if (!content) return inferTestRelationships(path, allPaths)

  const relationships = [...inferImportRelationships(path, content, allPaths), ...inferTestRelationships(path, allPaths)]
  const unique = new Map<string, FileRelationship>()
  for (const relationship of relationships) {
    unique.set(`${relationship.type}:${relationship.targetPath}`, relationship)
  }
  return [...unique.values()]
}

function extractKeySymbols(language: string, content: string | null): string[] {
  if (!content) return []
  const matches = new Set<string>()
  const regexes = language === "markdown"
    ? [/^#{1,3}\s+(.+)$/gm]
    : [
        /\b(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/g,
        /\b(?:export\s+)?class\s+([A-Za-z0-9_]+)/g,
        /\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_]+)/g,
        /\b(?:export\s+)?interface\s+([A-Za-z0-9_]+)/g,
        /\b(?:export\s+)?type\s+([A-Za-z0-9_]+)/g,
      ]

  for (const regex of regexes) {
    for (const match of content.matchAll(regex)) {
      const symbol = match[1]?.trim()
      if (symbol) matches.add(symbol)
    }
  }

  return [...matches].slice(0, 12)
}

function inferImportRelationships(sourcePath: string, content: string, allPaths: Set<string>): FileRelationship[] {
  const relationships: FileRelationship[] = []
  const regex = /from\s+["']([^"']+)["']|require\(["']([^"']+)["']\)/g

  for (const match of content.matchAll(regex)) {
    const specifier = match[1] ?? match[2]
    if (!specifier?.startsWith(".")) continue
    const basePath = resolveRelativeModulePath(sourcePath, specifier)
    const candidates = [
      basePath,
      `${basePath}.ts`,
      `${basePath}.tsx`,
      `${basePath}.js`,
      `${basePath}.md`,
      `${basePath}/index.ts`,
      `${basePath}/index.js`,
    ]
    const targetPath = candidates.find((candidate) => allPaths.has(candidate))
    if (targetPath) relationships.push({ type: "imports", targetPath })
  }

  return relationships
}

function inferTestRelationships(path: string, allPaths: Set<string>): FileRelationship[] {
  const relationships: FileRelationship[] = []
  const extension = extname(path)
  const fileName = basename(path)

  if (!fileName.includes(".test.") && !fileName.includes(".spec.")) return relationships

  const sourceCandidates = [
    path.replace(".test.", "."),
    path.replace(".spec.", "."),
    path.replace(`/tests/`, `/runtime/`),
  ].map((candidate) => candidate.endsWith(extension) ? candidate : `${candidate}${extension}`)

  const targetPath = sourceCandidates.find((candidate) => allPaths.has(candidate))
  if (targetPath) {
    relationships.push({ type: "tests", targetPath })
  }

  return relationships
}

function resolveRelativeModulePath(sourcePath: string, specifier: string): string {
  const sourceDirectory = dirname(sourcePath)
  const resolved = normalize(join(sourceDirectory, specifier)).replace(/\\/g, "/")
  return resolved.replace(/^\.\//, "")
}

export function deriveImportedByRelationships(files: Record<string, FileMapObject>): Record<string, FileMapObject> {
  const next: Record<string, FileMapObject> = {}

  for (const [path, file] of Object.entries(files)) {
    next[path] = { ...file, relationships: [...file.relationships] }
  }

  for (const [sourcePath, file] of Object.entries(next)) {
    for (const relationship of file.relationships) {
      const target = next[relationship.targetPath]
      if (!target) continue
      if (relationship.type === "imports") {
        target.relationships = [
          ...target.relationships,
          { type: "imported-by", targetPath: sourcePath },
        ]
      }
      if (relationship.type === "tests") {
        target.relationships = [
          ...target.relationships,
          { type: "tested-by", targetPath: sourcePath },
        ]
      }
    }
  }

  return next
}
