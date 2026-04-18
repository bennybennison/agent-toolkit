import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { type ContractCatalogEntry } from "./contracts"

export interface ContractValidationIssue {
  severity: "error" | "warning"
  message: string
}

export interface ContractValidationResult {
  contractId: string
  artifactPath: string
  ok: boolean
  issues: ContractValidationIssue[]
}

function normalizeSectionName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function readRequiredSections(contractPath: string): string[] {
  const raw = readFileSync(contractPath, "utf8")
  const lines = raw.split("\n")
  const sectionIndex = lines.findIndex((line) => line.trim() === "## Required Sections")
  if (sectionIndex < 0) return []

  const sections: string[] = []
  for (const line of lines.slice(sectionIndex + 1)) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (sections.length > 0) break
      continue
    }
    if (trimmed.startsWith("#")) break
    const match = trimmed.match(/^-\s+(.+)$/)
    if (!match) continue
    sections.push(normalizeSectionName(match[1]))
  }

  return sections
}

function readMarkdownSections(markdown: string): Set<string> {
  const sections = new Set<string>()
  for (const line of markdown.split("\n")) {
    const match = line.match(/^##+\s+(.+)$/)
    if (!match) continue
    sections.add(normalizeSectionName(match[1]))
  }
  return sections
}

function findUnresolvedTemplateTokens(markdown: string): string[] {
  return [...markdown.matchAll(/{{[^}]+}}/g)].map((match) => match[0])
}

function findBlankScaffoldFields(markdown: string): string[] {
  const warnings: string[] = []
  const lines = markdown.split("\n")

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    if (/^-\s+[^:]+:\s*$/.test(line)) {
      warnings.push(line.trim())
      continue
    }
    if (/^\d+\.\s+[^:]+:\s*$/.test(line)) {
      warnings.push(line.trim())
      continue
    }
    if (/^\s{2,}[^:]+:\s*$/.test(rawLine) && !rawLine.trimStart().startsWith("#")) {
      warnings.push(rawLine.trim())
    }
  }

  return warnings
}

export function validateToolkitContractArtifact(
  contract: ContractCatalogEntry,
  artifactPath: string,
): ContractValidationResult {
  const resolvedArtifactPath = resolve(artifactPath)
  const issues: ContractValidationIssue[] = []

  if (!existsSync(resolvedArtifactPath)) {
    return {
      contractId: contract.id,
      artifactPath: resolvedArtifactPath,
      ok: false,
      issues: [{ severity: "error", message: `Artifact file does not exist: ${resolvedArtifactPath}` }],
    }
  }

  const raw = readFileSync(resolvedArtifactPath, "utf8")
  const requiredSections = readRequiredSections(contract.contractPath)
  const presentSections = readMarkdownSections(raw)

  for (const required of requiredSections) {
    if (!presentSections.has(required)) {
      issues.push({
        severity: "error",
        message: `Missing required section: ${required}`,
      })
    }
  }

  const titleMatch = raw.match(/^#\s+(.+)$/m)
  if (!titleMatch?.[1]?.trim()) {
    issues.push({
      severity: "error",
      message: "Missing top-level title heading",
    })
  }

  const unresolvedTokens = findUnresolvedTemplateTokens(raw)
  for (const token of unresolvedTokens) {
    issues.push({
      severity: "error",
      message: `Unresolved template token: ${token}`,
    })
  }

  const blankFields = findBlankScaffoldFields(raw)
  for (const field of blankFields) {
    issues.push({
      severity: "warning",
      message: `Blank scaffold field: ${field}`,
    })
  }

  return {
    contractId: contract.id,
    artifactPath: resolvedArtifactPath,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
  }
}
