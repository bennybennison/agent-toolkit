import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

import { type ContractCatalogEntry } from "./contracts"

export interface ContractScaffoldOptions {
  workspaceRoot: string
  contract: ContractCatalogEntry
  name?: string
  outPath?: string
  force?: boolean
}

export interface ContractScaffoldResult {
  outputPath: string
  created: boolean
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function titleizeFromContractId(contractId: string): string {
  return contractId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function inferArtifactSubdir(contractId: string): string {
  switch (contractId) {
    case "context-bundle":
      return "context-bundles"
    case "verification-report":
    case "diagnosis-note":
    case "audit-report":
      return "verification"
    case "decision-note":
      return "decisions"
    case "plan":
    case "wireframe-plan":
    case "build-proposal":
    case "map-report":
    case "mock-data-plan":
    case "api-contract-set":
      return "plans"
    case "task-brief":
    case "change-summary":
    case "recommendation-set":
    case "session-summary":
    case "next-step-brief":
    default:
      return "handoffs"
  }
}

function buildDefaultOutputPath(workspaceRoot: string, contractId: string, name?: string): string {
  const subdir = inferArtifactSubdir(contractId)
  const baseName = slugify(name ?? contractId) || contractId
  return resolve(workspaceRoot, ".agent-artifacts", subdir, `${baseName}.md`)
}

function buildScaffoldContent(contract: ContractCatalogEntry, title: string): string {
  const template = readFileSync(contract.templatePath, "utf8")
  const replaced = template.replaceAll("{{TITLE}}", title)

  return [
    `<!-- Scaffolded from toolkit contract: ${contract.id} -->`,
    `<!-- Contract: ${contract.contractPath} -->`,
    `<!-- Template: ${contract.templatePath} -->`,
    "",
    replaced,
  ].join("\n")
}

export function scaffoldToolkitContract(options: ContractScaffoldOptions): ContractScaffoldResult {
  const outputPath = options.outPath
    ? resolve(options.workspaceRoot, options.outPath)
    : buildDefaultOutputPath(options.workspaceRoot, options.contract.id, options.name)

  if (existsSync(outputPath) && !options.force) {
    throw new Error(`Refusing to overwrite existing file without --force: ${outputPath}`)
  }

  mkdirSync(dirname(outputPath), { recursive: true })

  const title = options.name?.trim() || titleizeFromContractId(options.contract.id)
  writeFileSync(outputPath, buildScaffoldContent(options.contract, title), "utf8")

  return {
    outputPath,
    created: true,
  }
}
