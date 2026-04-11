import type { TaskBrief, MapReport, BuildProposal, AuditReport, VerificationReport } from "./handoff"
import type { FileRelationshipType, MappingStatus } from "./mapping"

export type ContextBundlePurpose = "planning" | "implementation" | "review" | "verification" | "handoff"

export type ContextBundleFile = {
  path: string
  summary: string | null
  purpose: string | null
  keySymbols: string[]
  tags: string[]
  mappingStatus: MappingStatus
  relationships: Array<{
    type: FileRelationshipType
    targetPath: string
  }>
}

export type ContextBundle = {
  schemaVersion: 1
  bundleId: string
  missionId: string
  purpose: ContextBundlePurpose
  createdAt: string
  taskBrief: Pick<TaskBrief, "missionId" | "intent" | "scope" | "constraints" | "operationStyle" | "mode" | "crThreshold">
  mapContext: {
    projectMapId: string
    taskMapId: string
    relevantDirectories: string[]
    relevantFiles: ContextBundleFile[]
    keySymbols: string[]
    staleFiles: string[]
    unmappedFiles: string[]
  }
  handoffContext: {
    mapReport?: MapReport
    buildProposal?: BuildProposal
    auditReport?: AuditReport
    verificationReport?: VerificationReport
  }
  risks: string[]
  constraints: string[]
  nextAction: string | null
}
