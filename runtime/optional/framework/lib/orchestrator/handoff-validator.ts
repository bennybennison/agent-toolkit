import type {
  AuditReport,
  BuildProposal,
  HandoffObjectType,
  DebriefBundle,
  InteractionPolicy,
  MapReport,
  TaskBrief,
  VerificationReport,
} from "../contracts/handoff"
export type HandoffPayloadType = HandoffObjectType

type ValidationResult = {
  ok: boolean
  errors: string[]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function inRange01(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
}

function isValidStrategy(value: unknown): boolean {
  return [
    "outside-in",
    "ui-first",
    "inside-out",
    "frontend-first",
    "backend-first",
    "infra-first",
    "full-stack-staged",
    "repair-first",
  ].includes(String(value))
}

function isValidCapabilityCeiling(value: unknown): boolean {
  return ["read", "verify", "mutate"].includes(String(value))
}

function isValidInteractionPolicy(value: unknown): value is InteractionPolicy {
  return ["confirm-first", "checkpointed", "mutate-only", "final-only"].includes(String(value))
}

function isValidContractMode(value: unknown): boolean {
  return ["advisory", "required", "validated"].includes(String(value))
}

export function validateTaskBrief(payload: unknown): ValidationResult {
  const errors: string[] = []
  const p = payload as Partial<TaskBrief>

  if (!isObject(payload)) return { ok: false, errors: ["payload must be an object"] }
  if (typeof p.missionId !== "string" || !p.missionId) errors.push("missionId is required")
  if (typeof p.intent !== "string" || !p.intent) errors.push("intent is required")
  if (!isObject(p.scope)) errors.push("scope is required")
  if (isObject(p.scope)) {
    if (!isStringArray(p.scope.include)) errors.push("scope.include must be string[]")
    if (!isStringArray(p.scope.exclude)) errors.push("scope.exclude must be string[]")
  }
  if (!isStringArray(p.constraints)) errors.push("constraints must be string[]")
  if (p.operationStyle !== "interactive" && p.operationStyle !== "autonomous") {
    errors.push("operationStyle must be interactive or autonomous")
  }
  if (!isStringArray([p.mode as string])) {
    // no-op guard to keep mode validation explicit below
  }
  if (!["online", "offline", "hybrid", "autonomous", "review", "planning"].includes(String(p.mode))) {
    errors.push("mode must be a valid mode")
  }
  if (p.capabilityCeiling !== undefined && !isValidCapabilityCeiling(p.capabilityCeiling)) {
    errors.push("capabilityCeiling must be read, verify, or mutate when provided")
  }
  if (p.interactionPolicy !== undefined && !isValidInteractionPolicy(p.interactionPolicy)) {
    errors.push("interactionPolicy must be confirm-first, checkpointed, mutate-only, or final-only when provided")
  }
  if (p.contractMode !== undefined && !isValidContractMode(p.contractMode)) {
    errors.push("contractMode must be advisory, required, or validated when provided")
  }
  if (p.artifactRoot !== undefined && (typeof p.artifactRoot !== "string" || !p.artifactRoot)) {
    errors.push("artifactRoot must be a non-empty string when provided")
  }
  if (p.requiredContracts !== undefined && !isStringArray(p.requiredContracts)) {
    errors.push("requiredContracts must be string[] when provided")
  }
  if (p.strategy !== undefined && !isValidStrategy(p.strategy)) {
    errors.push("strategy must be a valid strategy when provided")
  }
  if (!inRange01(p.crThreshold)) errors.push("crThreshold must be in [0, 1]")

  return { ok: errors.length === 0, errors }
}

export function validateMapReport(payload: unknown): ValidationResult {
  const errors: string[] = []
  const p = payload as Partial<MapReport>

  if (!isObject(payload)) return { ok: false, errors: ["payload must be an object"] }
  if (typeof p.missionId !== "string" || !p.missionId) errors.push("missionId is required")
  if (!isStringArray(p.symbols)) errors.push("symbols must be string[]")
  if (!isStringArray(p.dependencies)) errors.push("dependencies must be string[]")
  if (!isStringArray(p.patterns)) errors.push("patterns must be string[]")
  if (p.existingPatterns !== undefined && !isStringArray(p.existingPatterns)) errors.push("existingPatterns must be string[] when provided")
  if (p.candidatePlacement !== undefined && !isStringArray(p.candidatePlacement)) errors.push("candidatePlacement must be string[] when provided")
  if (p.feasibilityNotes !== undefined && (typeof p.feasibilityNotes !== "string" || !p.feasibilityNotes)) errors.push("feasibilityNotes must be a non-empty string when provided")
  if (p.projectMapId !== undefined && (typeof p.projectMapId !== "string" || !p.projectMapId)) errors.push("projectMapId must be a non-empty string when provided")
  if (p.taskMapId !== undefined && (typeof p.taskMapId !== "string" || !p.taskMapId)) errors.push("taskMapId must be a non-empty string when provided")
  if (p.relevantFiles !== undefined && !isStringArray(p.relevantFiles)) errors.push("relevantFiles must be string[] when provided")
  if (p.staleFiles !== undefined && !isStringArray(p.staleFiles)) errors.push("staleFiles must be string[] when provided")
  if (!Array.isArray(p.risks)) errors.push("risks must be array")
  if (!isStringArray(p.candidateApproaches)) errors.push("candidateApproaches must be string[]")

  return { ok: errors.length === 0, errors }
}

export function validateBuildProposal(payload: unknown): ValidationResult {
  const errors: string[] = []
  const p = payload as Partial<BuildProposal>

  if (!isObject(payload)) return { ok: false, errors: ["payload must be an object"] }
  if (typeof p.missionId !== "string" || !p.missionId) errors.push("missionId is required")
  if (!isStringArray(p.stagedFiles)) errors.push("stagedFiles must be string[]")
  if (typeof p.rationale !== "string" || !p.rationale) errors.push("rationale is required")
  if (!isStringArray(p.diffSummary)) errors.push("diffSummary must be string[]")
  if (!inRange01(p.confidence)) errors.push("confidence must be in [0, 1]")

  return { ok: errors.length === 0, errors }
}

export function validateAuditReport(payload: unknown): ValidationResult {
  const errors: string[] = []
  const p = payload as Partial<AuditReport>

  if (!isObject(payload)) return { ok: false, errors: ["payload must be an object"] }
  if (typeof p.missionId !== "string" || !p.missionId) errors.push("missionId is required")
  if (typeof p.passed !== "boolean") errors.push("passed must be boolean")
  if (!Array.isArray(p.findings)) errors.push("findings must be array")
  if (!isStringArray(p.policyViolations)) errors.push("policyViolations must be string[]")
  if (!isStringArray(p.securityFlags)) errors.push("securityFlags must be string[]")
  if (typeof p.approved !== "boolean") errors.push("approved must be boolean")

  return { ok: errors.length === 0, errors }
}

export function validateVerificationReport(payload: unknown): ValidationResult {
  const errors: string[] = []
  const p = payload as Partial<VerificationReport>

  if (!isObject(payload)) return { ok: false, errors: ["payload must be an object"] }
  if (typeof p.missionId !== "string" || !p.missionId) errors.push("missionId is required")
  if (!isStringArray(p.testsRun)) errors.push("testsRun must be string[]")
  if (typeof p.passed !== "number") errors.push("passed must be number")
  if (typeof p.failed !== "number") errors.push("failed must be number")
  if (!isStringArray(p.evidence)) errors.push("evidence must be string[]")
  if (typeof p.signed !== "boolean") errors.push("signed must be boolean")

  return { ok: errors.length === 0, errors }
}

export function validateDebriefBundle(payload: unknown): ValidationResult {
  const errors: string[] = []
  const p = payload as Partial<DebriefBundle>

  if (!isObject(payload)) return { ok: false, errors: ["payload must be an object"] }
  if (typeof p.missionId !== "string" || !p.missionId) errors.push("missionId is required")

  const taskBriefResult = validateTaskBrief(p.taskBrief)
  if (!taskBriefResult.ok) {
    errors.push(...taskBriefResult.errors.map((err) => `taskBrief.${err}`))
  }

  if (p.mapReport !== undefined) {
    const mapResult = validateMapReport(p.mapReport)
    if (!mapResult.ok) errors.push(...mapResult.errors.map((err) => `mapReport.${err}`))
  }

  if (p.buildProposal !== undefined) {
    const buildResult = validateBuildProposal(p.buildProposal)
    if (!buildResult.ok) errors.push(...buildResult.errors.map((err) => `buildProposal.${err}`))
  }

  if (p.auditReport !== undefined) {
    const auditResult = validateAuditReport(p.auditReport)
    if (!auditResult.ok) errors.push(...auditResult.errors.map((err) => `auditReport.${err}`))
  }

  if (p.verificationReport !== undefined) {
    const verifyResult = validateVerificationReport(p.verificationReport)
    if (!verifyResult.ok) errors.push(...verifyResult.errors.map((err) => `verificationReport.${err}`))
  }

  if (!["completed", "blocked", "aborted"].includes(String(p.outcome))) {
    errors.push("outcome must be completed, blocked, or aborted")
  }
  if (typeof p.summary !== "string" || !p.summary) errors.push("summary is required")

  return { ok: errors.length === 0, errors }
}

export function validateHandoffPayload(type: HandoffPayloadType, payload: unknown): ValidationResult {
  switch (type) {
    case "TaskBrief":
      return validateTaskBrief(payload)
    case "MapReport":
      return validateMapReport(payload)
    case "BuildProposal":
      return validateBuildProposal(payload)
    case "AuditReport":
      return validateAuditReport(payload)
    case "VerificationReport":
      return validateVerificationReport(payload)
    case "DebriefBundle":
      return validateDebriefBundle(payload)
    default:
      return { ok: false, errors: ["unknown payload type"] }
  }
}
