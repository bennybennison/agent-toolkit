import { createHash } from "node:crypto"

import type { ContextBundle, ContextBundlePurpose } from "../contracts/context-bundle"
import type { TaskBrief, MapReport, BuildProposal, AuditReport, VerificationReport } from "../contracts/handoff"
import type { FileMapObject, ProjectMap, TaskMap } from "../contracts/mapping"

type BundleAssemblyInput = {
  purpose: ContextBundlePurpose
  brief: TaskBrief
  projectMap: ProjectMap
  taskMap: TaskMap
  files: Record<string, FileMapObject>
  handoffs?: {
    mapReport?: MapReport
    buildProposal?: BuildProposal
    auditReport?: AuditReport
    verificationReport?: VerificationReport
  }
}

export function assembleContextBundle(input: BundleAssemblyInput): ContextBundle {
  const { purpose, brief, projectMap, taskMap, files, handoffs } = input
  const relevantPaths = pickRelevantPathsForPurpose(purpose, taskMap, handoffs)
  const relevantFiles = relevantPaths
    .map((path) => files[path])
    .filter((file): file is FileMapObject => file !== undefined)
    .map((file) => ({
      path: file.path,
      summary: file.summary,
      purpose: file.purpose,
      keySymbols: file.keySymbols.slice(0, 8),
      tags: file.tags.slice(0, 6),
      mappingStatus: file.mappingStatus,
      relationships: file.relationships
        .filter((relationship) => relevantPaths.includes(relationship.targetPath))
        .slice(0, 8)
        .map((relationship) => ({
          type: relationship.type,
          targetPath: relationship.targetPath,
        })),
    }))

  return {
    schemaVersion: 1,
    bundleId: createHash("sha256").update(`${brief.missionId}:${purpose}:${taskMap.taskMapId}`).digest("hex").slice(0, 12),
    missionId: brief.missionId,
    purpose,
    createdAt: new Date().toISOString(),
    taskBrief: {
      missionId: brief.missionId,
      intent: brief.intent,
      scope: brief.scope,
      constraints: brief.constraints,
      operationStyle: brief.operationStyle,
      mode: brief.mode,
      crThreshold: brief.crThreshold,
    },
    mapContext: {
      projectMapId: projectMap.mapId,
      taskMapId: taskMap.taskMapId,
      relevantDirectories: taskMap.relevantDirectories,
      relevantFiles,
      keySymbols: taskMap.keySymbols,
      staleFiles: taskMap.freshness.staleFiles,
      unmappedFiles: taskMap.freshness.unmappedFiles,
    },
    handoffContext: filterHandoffsForPurpose(purpose, handoffs),
    risks: pickRisksForPurpose(purpose, taskMap, handoffs),
    constraints: brief.constraints,
    nextAction: nextActionForPurpose(purpose),
  }
}

function pickRelevantPathsForPurpose(
  purpose: ContextBundlePurpose,
  taskMap: TaskMap,
  handoffs: BundleAssemblyInput["handoffs"],
): string[] {
  const base = taskMap.relevantFiles.map((file) => file.path)
  if (purpose === "review" || purpose === "verification") {
    return dedupe([...(handoffs?.buildProposal?.stagedFiles ?? []), ...base])
  }
  if (purpose === "implementation") {
    return dedupe([...(handoffs?.mapReport?.relevantFiles ?? []), ...base])
  }
  return dedupe(base)
}

function filterHandoffsForPurpose(
  purpose: ContextBundlePurpose,
  handoffs: BundleAssemblyInput["handoffs"],
): ContextBundle["handoffContext"] {
  if (!handoffs) return {}

  switch (purpose) {
    case "planning":
      return {}
    case "implementation":
      return { mapReport: handoffs.mapReport }
    case "review":
      return { mapReport: handoffs.mapReport, buildProposal: handoffs.buildProposal }
    case "verification":
      return {
        mapReport: handoffs.mapReport,
        buildProposal: handoffs.buildProposal,
        auditReport: handoffs.auditReport,
      }
    case "handoff":
      return handoffs
  }
}

function pickRisksForPurpose(
  purpose: ContextBundlePurpose,
  taskMap: TaskMap,
  handoffs: BundleAssemblyInput["handoffs"],
): string[] {
  const risks = new Set<string>(taskMap.risks)
  if (purpose === "implementation") {
    for (const risk of handoffs?.mapReport?.risks ?? []) risks.add(risk.summary)
  }
  if (purpose === "review" || purpose === "verification") {
    for (const finding of handoffs?.auditReport?.findings ?? []) risks.add(finding.message)
  }
  return [...risks].sort()
}

function nextActionForPurpose(purpose: ContextBundlePurpose): string {
  switch (purpose) {
    case "planning":
      return "Refine scope, risks, and candidate approaches."
    case "implementation":
      return "Implement the scoped change set using the mapped files."
    case "review":
      return "Review the staged changes against the mapped scope and risks."
    case "verification":
      return "Run focused verification and record reproducible evidence."
    case "handoff":
      return "Continue from the attached context bundle without broad repo rereads."
  }
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)].sort()
}
