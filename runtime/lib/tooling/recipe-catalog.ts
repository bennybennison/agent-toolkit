import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { type ToolkitEnvironment } from "../toolkit-environment"
import { type CapabilityCeiling, type ContractMode, type InteractionPolicy, type RecipeCatalogEntry } from "./contracts"

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

function normalizeScalar(value: string | undefined): string | undefined {
  if (!value) return undefined
  return value.trim().replace(/^['"]|['"]$/g, "")
}

function parseList(value: string | undefined): string[] {
  const normalized = normalizeScalar(value)
  if (!normalized) return []
  const trimmed = normalized.replace(/^\[/, "").replace(/\]$/, "")
  return trimmed
    .split(",")
    .map((entry) => normalizeScalar(entry))
    .filter((entry): entry is string => Boolean(entry))
}

function parseInteractionPolicy(value: string | undefined): InteractionPolicy {
  const normalized = normalizeScalar(value)
  if (normalized === "checkpointed" || normalized === "mutate-only" || normalized === "final-only") {
    return normalized
  }
  return "confirm-first"
}

function parseCapabilityCeiling(value: string | undefined): CapabilityCeiling {
  const normalized = normalizeScalar(value)
  if (normalized === "read" || normalized === "verify" || normalized === "mutate") {
    return normalized
  }
  return "read"
}

function parseContractMode(value: string | undefined): ContractMode {
  const normalized = normalizeScalar(value)
  if (normalized === "required" || normalized === "validated") {
    return normalized
  }
  return "advisory"
}

export function listToolkitRecipes(env: ToolkitEnvironment): RecipeCatalogEntry[] {
  const recipesDir = join(env.toolkitRoot, "recipes")
  if (!existsSync(recipesDir)) return []

  const entries: RecipeCatalogEntry[] = []
  for (const entry of readdirSync(recipesDir, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory()) continue

    const sourcePath = join(recipesDir, entry.name, "RECIPE.md")
    if (!existsSync(sourcePath)) continue

    const frontmatter = parseFrontmatter(sourcePath)
    entries.push({
      id: entry.name,
      description: normalizeScalar(frontmatter.description) ?? "",
      sourcePath,
      interactionPolicy: parseInteractionPolicy(frontmatter.interaction_policy),
      capabilityCeiling: parseCapabilityCeiling(frontmatter.capability_ceiling),
      contractMode: parseContractMode(frontmatter.contract_mode),
      artifactRoot: normalizeScalar(frontmatter.artifact_root) ?? ".agent-artifacts/",
      requiredContracts: parseList(frontmatter.contracts),
      suggestedSkills: parseList(frontmatter.skills),
      allowedSpecialists: parseList(frontmatter.specialists),
    })
  }

  return entries
}
