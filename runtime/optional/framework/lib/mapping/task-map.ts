import { createHash } from "node:crypto"
import { dirname } from "node:path"

import type { TaskBrief, MapReport, BuildProposal, AuditReport, VerificationReport } from "../contracts/handoff"
import type { FileMapObject, ProjectMap, TaskMap, TaskMapSelectionReason } from "../contracts/mapping"

type HandoffInputs = {
  mapReport?: MapReport
  buildProposal?: BuildProposal
  auditReport?: AuditReport
  verificationReport?: VerificationReport
}

export function buildTaskMap(input: {
  brief: TaskBrief
  projectMap: ProjectMap
  files: Record<string, FileMapObject>
  existingTaskMap?: TaskMap | null
  handoffs?: HandoffInputs
}): TaskMap {
  const { brief, projectMap, files, existingTaskMap, handoffs } = input
  const createdAt = existingTaskMap?.createdAt ?? new Date().toISOString()
  const selected = new Map<string, Set<TaskMapSelectionReason>>()
  const allPaths = Object.keys(files)
  const includePaths = brief.scope.include.map(normalizeInputPath).filter(Boolean)
  const excludePaths = brief.scope.exclude.map(normalizeInputPath).filter(Boolean)

  for (const path of allPaths) {
    if (matchesPathList(path, includePaths)) addSelection(selected, path, "scope-include")
  }

  if (includePaths.length === 0) {
    const intentKeywords = tokenize(brief.intent)
    for (const file of Object.values(files)) {
      const searchable = `${file.path} ${file.summary ?? ""} ${(file.tags ?? []).join(" ")} ${(file.keySymbols ?? []).join(" ")}`.toLowerCase()
      const score = intentKeywords.filter((keyword) => searchable.includes(keyword)).length
      if (score >= 2 || (score >= 1 && file.tags.includes("orchestrator"))) {
        addSelection(selected, file.path, "intent-match")
      }
    }
  }

  for (const path of collectHandoffPaths(handoffs)) {
    if (path in files) addSelection(selected, path, handoffs?.buildProposal?.stagedFiles?.includes(path) ? "handoff" : "map-report")
  }

  for (const path of existingTaskMap?.relevantFiles.map((file) => file.path) ?? []) {
    if (path in files) addSelection(selected, path, "relationship")
  }

  // Pull in directly related files to keep bundles small but connected.
  for (const path of [...selected.keys()]) {
    for (const relationship of files[path]?.relationships ?? []) {
      if (relationship.targetPath in files) addSelection(selected, relationship.targetPath, "relationship")
    }
  }

  for (const excludedPath of excludePaths) {
    for (const path of [...selected.keys()]) {
      if (path === excludedPath || path.startsWith(`${excludedPath}/`)) {
        selected.delete(path)
      }
    }
  }

  const relevantFiles = [...selected.entries()]
    .map(([path, reasons]) => ({
      path,
      reasons: [...reasons].sort(),
      freshness: files[path]?.mappingStatus ?? "unmapped",
    }))
    .sort((a, b) => a.path.localeCompare(b.path))

  const relevantDirectories = [...new Set(relevantFiles.map((file) => dirname(file.path)).filter(Boolean))]
    .sort()

  const staleFiles = relevantFiles.filter((file) => file.freshness === "stale").map((file) => file.path)
  const unmappedFiles = relevantFiles.filter((file) => file.freshness === "unmapped").map((file) => file.path)
  const keySymbols = dedupe([
    ...relevantFiles.flatMap((file) => files[file.path]?.keySymbols ?? []),
    ...(handoffs?.mapReport?.symbols ?? []),
  ])
  const risks = dedupe([
    ...(handoffs?.mapReport?.risks.map((risk) => risk.summary) ?? []),
    ...(handoffs?.auditReport?.findings.map((finding) => finding.message) ?? []),
    ...staleFiles.map((path) => `File mapping is stale: ${path}`),
    ...unmappedFiles.map((path) => `File has not been enriched yet: ${path}`),
  ])

  return {
    schemaVersion: 1,
    taskMapId: createHash("sha256").update(`${brief.missionId}:${projectMap.mapId}:${brief.intent}`).digest("hex").slice(0, 12),
    missionId: brief.missionId,
    projectMapId: projectMap.mapId,
    createdAt,
    updatedAt: new Date().toISOString(),
    intent: brief.intent,
    include: includePaths,
    exclude: excludePaths,
    relevantDirectories,
    relevantFiles,
    keySymbols,
    relationships: relevantFiles.flatMap((file) =>
      (files[file.path]?.relationships ?? [])
        .filter((relationship) => selected.has(relationship.targetPath))
        .map((relationship) => ({
          sourcePath: file.path,
          type: relationship.type,
          targetPath: relationship.targetPath,
        }))),
    risks,
    freshness: {
      status: staleFiles.length > 0 ? "stale" : unmappedFiles.length > 0 ? "partial" : "fresh",
      staleFiles,
      unmappedFiles,
    },
  }
}

function collectHandoffPaths(handoffs: HandoffInputs | undefined): string[] {
  return dedupe([
    ...(handoffs?.mapReport?.relevantFiles ?? []),
    ...(handoffs?.mapReport?.symbols ?? []).filter((value) => value.includes("/")),
    ...(handoffs?.mapReport?.dependencies ?? []).filter((value) => value.includes("/")),
    ...(handoffs?.buildProposal?.stagedFiles ?? []),
    ...(handoffs?.auditReport?.findings.map((finding) => finding.file) ?? []),
    ...(handoffs?.verificationReport?.testsRun ?? []).filter((value) => value.includes("/")),
  ])
}

function matchesPathList(path: string, inputs: string[]): boolean {
  return inputs.some((input) => path === input || path.startsWith(`${input}/`))
}

function addSelection(selected: Map<string, Set<TaskMapSelectionReason>>, path: string, reason: TaskMapSelectionReason): void {
  if (!selected.has(path)) selected.set(path, new Set())
  selected.get(path)?.add(reason)
}

function tokenize(input: string): string[] {
  return input.toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
}

function normalizeInputPath(path: string): string {
  return path.replace(/^[./]+/, "").replace(/\\/g, "/")
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)].sort()
}
