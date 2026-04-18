import type { CapabilityCeiling } from "../orchestrator/capability-ceiling"
import type { ContractMode } from "../../../lib/tooling/contracts"

export type CommanderMode = "ghost" | "scout" | "autocrat" | "guardian" | "interviewer"
export type InteractionPolicy = "confirm-first" | "checkpointed" | "mutate-only" | "final-only"
export type RuntimeRecipeId =
  | "hold-and-justify"
  | "session-open-close"
  | "map-and-assess"
  | "plan-from-idea"
  | "implement-from-plan"
  | "repair-and-verify"
  | "review-and-recommend"
  | "wireframe-outside-in"

export type HandoffObjectType =
  | "TaskBrief"
  | "MapReport"
  | "BuildProposal"
  | "AuditReport"
  | "VerificationReport"
  | "DebriefBundle"

export type TaskBrief = {
  missionId: string
  intent: string
  scope: {
    include: string[]
    exclude: string[]
  }
  constraints: string[]
  operationStyle: "interactive" | "autonomous"
  /** Unified mode governing provider access, approval gating, and operation style. */
  mode: "online" | "offline" | "hybrid" | "autonomous" | "review" | "planning"
  capabilityCeiling?: CapabilityCeiling
  /** Controls when the orchestrator must pause and confirm direction with the user. */
  interactionPolicy?: InteractionPolicy
  /** Explicit orchestration recipe chosen for the current task. */
  recipeId?: RuntimeRecipeId
  /** How strongly the selected recipe depends on contract-backed artifacts. */
  contractMode?: ContractMode
  /** Default repo-relative output root for durable recipe artifacts. */
  artifactRoot?: string
  /** Canonical contract ids expected by the selected recipe. */
  requiredContracts?: string[]
  strategy?:
    | "outside-in"
    | "ui-first"
    | "inside-out"
    | "frontend-first"
    | "backend-first"
    | "infra-first"
    | "full-stack-staged"
    | "repair-first"
  crThreshold: number
}

export type MapReport = {
  missionId: string
  symbols: string[]
  dependencies: string[]
  patterns: string[]
  existingPatterns?: string[]
  candidatePlacement?: string[]
  feasibilityNotes?: string
  projectMapId?: string
  taskMapId?: string
  relevantFiles?: string[]
  staleFiles?: string[]
  risks: Array<{
    severity: "low" | "medium" | "high"
    summary: string
  }>
  candidateApproaches: string[]
}

export type BuildProposal = {
  missionId: string
  stagedFiles: string[]
  rationale: string
  diffSummary: string[]
  confidence: number
}

export type AuditReport = {
  missionId: string
  passed: boolean
  findings: Array<{
    severity: "critical" | "warning" | "suggestion"
    file: string
    message: string
    fix?: string
  }>
  policyViolations: string[]
  securityFlags: string[]
  approved: boolean
}

export type VerificationReport = {
  missionId: string
  testsRun: string[]
  passed: number
  failed: number
  evidence: string[]
  signed: boolean
}

export type DebriefBundle = {
  missionId: string
  taskBrief: TaskBrief
  mapReport?: MapReport
  buildProposal?: BuildProposal
  auditReport?: AuditReport
  verificationReport?: VerificationReport
  outcome: "completed" | "blocked" | "aborted"
  summary: string
}
