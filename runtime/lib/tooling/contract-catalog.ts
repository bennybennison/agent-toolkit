import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { type ToolkitEnvironment } from "../toolkit-environment"
import { type ContractCatalogEntry } from "./contracts"

function readFirstHeading(filePath: string): string {
  const raw = readFileSync(filePath, "utf8")
  const match = raw.match(/^#\s+(.+)$/m)
  return match?.[1]?.trim() ?? ""
}

function readPurpose(filePath: string): string {
  const raw = readFileSync(filePath, "utf8")
  const lines = raw.split("\n")
  const purposeIndex = lines.findIndex((line) => line.trim() === "## Purpose")
  if (purposeIndex < 0) return ""

  const collected: string[] = []
  for (const line of lines.slice(purposeIndex + 1)) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (collected.length > 0) break
      continue
    }
    if (trimmed.startsWith("#")) break
    collected.push(trimmed)
  }

  return collected.join(" ")
}

export function listToolkitContracts(env: ToolkitEnvironment): ContractCatalogEntry[] {
  const contractsDir = join(env.toolkitRoot, "contracts")
  if (!existsSync(contractsDir)) return []

  const entries: ContractCatalogEntry[] = []
  for (const entry of readdirSync(contractsDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue

    const contractPath = join(contractsDir, entry.name, "CONTRACT.md")
    const schemaPath = join(contractsDir, entry.name, "schema.json")
    const templatePath = join(contractsDir, entry.name, "TEMPLATE.md")
    if (!existsSync(contractPath) || !existsSync(schemaPath) || !existsSync(templatePath)) continue

    entries.push({
      id: entry.name,
      contractPath,
      schemaPath,
      templatePath,
      title: readFirstHeading(contractPath),
      purpose: readPurpose(contractPath),
    })
  }

  return entries
}
