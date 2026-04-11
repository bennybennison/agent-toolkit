import type { AuditReport, BuildProposal, MapReport, TaskBrief, VerificationReport } from "../contracts/handoff"
import { getDefaultOperationStyle } from "../framework-config"
import type { HandoffPayloadType } from "./handoff-validator"
import { validateHandoffPayload } from "./handoff-validator"
import { prepareMissionArtifacts, updateMissionArtifacts } from "./mission-artifacts"
import { normalizeTaskType } from "./specialist-router"
import type { SessionStateFile } from "../session-state-store"
import type { SpecialistPipelineState } from "../contracts/session"
import { loadCompletedHandoffs, loadSessionStateFile, saveSessionStateFile, storeHandoffPayload } from "../session-state-store"
import { isSpecialistAllowedForCeiling } from "./capability-ceiling"
import { buildRecipeRoute } from "./recipe-routing"

export type MissionStartResult = {
  ok: boolean
  missionId: string
  pipeline: SpecialistPipelineState
  reason?: string
}

export type StageAdvanceResult = {
  ok: boolean
  completedStage: string
  nextStage: string | null
  done: boolean
  reason?: string
}

export type HandoffValidationResult = {
  ok: boolean
  stage: string
  errors: string[]
}

/**
 * Start a specialist mission pipeline for a given task intent.
 * Persists initial pipeline state into session state for resumption.
 */
export function startMission(brief: TaskBrief): MissionStartResult {
  const briefResult = validateHandoffPayload("TaskBrief", brief)
  if (!briefResult.ok) {
    return {
      ok: false,
      missionId: brief.missionId ?? "unknown",
      pipeline: { taskType: "feature", specialists: [], completedStages: [], activeStage: null, pendingHandoffType: null },
      reason: `Invalid TaskBrief: ${briefResult.errors.join(", ")}`,
    }
  }

  const taskType = normalizeTaskType(brief.intent)
  const style = brief.operationStyle ?? getDefaultOperationStyle()
  const route = brief.recipeId
    ? buildRecipeRoute(brief.recipeId, brief.intent, style)
    : {
        taskType,
        style,
        specialists: buildRecipeRoute("implement-from-plan", brief.intent, style).specialists,
      }
  const capabilityCeiling = brief.capabilityCeiling ?? "mutate"
  for (const specialist of route.specialists) {
    const allowed = isSpecialistAllowedForCeiling(capabilityCeiling, specialist)
    if (!allowed.ok) {
      return {
        ok: false,
        missionId: brief.missionId,
        pipeline: { taskType, specialists: [], completedStages: [], activeStage: null, pendingHandoffType: null },
        reason: allowed.reason,
      }
    }
  }

  const pipeline: SpecialistPipelineState = {
    taskType,
    specialists: route.specialists,
    completedStages: [],
    activeStage: route.specialists[0] ?? null,
    pendingHandoffType: resolveHandoffTypeForStage(route.specialists[0] ?? null),
  }

  let artifactRefs = {
    projectMapPath: null,
    taskMapPath: null,
    contextBundlePath: null,
    contextBundlePurpose: null,
  }
  try {
    artifactRefs = prepareMissionArtifacts(brief)
  } catch {
    // Mapping is supportive, not a hard gate for mission startup.
  }

  saveSessionStateFile({
    activeTaskBrief: brief,
    activeMissionId: brief.missionId,
    activeRecipeId: brief.recipeId ?? null,
    activeProjectMapPath: artifactRefs.projectMapPath,
    activeTaskMapPath: artifactRefs.taskMapPath,
    activeContextBundlePath: artifactRefs.contextBundlePath,
    activeContextBundles: artifactRefs.contextBundlePurpose && artifactRefs.contextBundlePath
      ? { [artifactRefs.contextBundlePurpose]: artifactRefs.contextBundlePath }
      : {},
    specialistPipeline: pipeline,
  })

  return { ok: true, missionId: brief.missionId, pipeline }
}

/**
 * Advance the pipeline to the next stage after completing the current one.
 * Validates the completed stage's handoff payload before advancing.
 */
export function advanceStage(completedPayload: unknown): StageAdvanceResult {
  const state = loadSessionStateFile()
  const pipeline = state.specialistPipeline

  if (!pipeline) {
    return { ok: false, completedStage: "none", nextStage: null, done: false, reason: "No active pipeline" }
  }

  const activeStage = pipeline.activeStage
  if (!activeStage) {
    return { ok: false, completedStage: "none", nextStage: null, done: true, reason: "Pipeline already done" }
  }

  const handoffType = pipeline.pendingHandoffType
  if (handoffType) {
    const validation = validateHandoffPayload(handoffType as HandoffPayloadType, completedPayload)
    if (!validation.ok) {
      return {
        ok: false,
        completedStage: activeStage,
        nextStage: activeStage,
        done: false,
        reason: `Handoff validation failed for stage ${activeStage}: ${validation.errors.join(", ")}`,
      }
    }
  }

  const completedStages = [...pipeline.completedStages, activeStage]
  const remainingSpecialists = pipeline.specialists.slice(completedStages.length)
  const nextStage = remainingSpecialists[0] ?? null

  const updatedPipeline: SpecialistPipelineState = {
    ...pipeline,
    completedStages,
    activeStage: nextStage,
    pendingHandoffType: resolveHandoffTypeForStage(nextStage),
  }

  // Persist the completed handoff payload by its type for later gate checks (e.g. /apply-review)
  if (handoffType) {
    storeHandoffPayload(handoffType, completedPayload)
  }

  let artifactPatch: Partial<SessionStateFile> = {}
  if (state.activeTaskBrief) {
    try {
      const persistedHandoffs = loadCompletedHandoffs()
      const completedHandoffs = {
        mapReport: handoffType === "MapReport" ? completedPayload as MapReport : persistedHandoffs["MapReport"] as MapReport | undefined,
        buildProposal: handoffType === "BuildProposal" ? completedPayload as BuildProposal : persistedHandoffs["BuildProposal"] as BuildProposal | undefined,
        auditReport: handoffType === "AuditReport" ? completedPayload as AuditReport : persistedHandoffs["AuditReport"] as AuditReport | undefined,
        verificationReport:
          handoffType === "VerificationReport"
            ? completedPayload as VerificationReport
            : persistedHandoffs["VerificationReport"] as VerificationReport | undefined,
      }
      const refs = updateMissionArtifacts({
        brief: state.activeTaskBrief,
        completedStage: activeStage as "mapper" | "builder" | "auditor" | "verifier" | "tdd-runner",
        handoffs: completedHandoffs,
        taskMapPath: state.activeTaskMapPath,
      })
      artifactPatch = {
        activeProjectMapPath: refs.projectMapPath,
        activeTaskMapPath: refs.taskMapPath,
        activeContextBundlePath: refs.contextBundlePath,
        activeContextBundles: refs.contextBundlePurpose && refs.contextBundlePath
          ? { ...state.activeContextBundles, [refs.contextBundlePurpose]: refs.contextBundlePath }
          : state.activeContextBundles,
      }
    } catch {
      artifactPatch = {}
    }
  }

  saveSessionStateFile({ specialistPipeline: updatedPipeline, ...artifactPatch })

  return { ok: true, completedStage: activeStage, nextStage, done: nextStage === null }
}

/**
 * Load the current active pipeline from session state.
 */
export function getMissionPipeline(): SpecialistPipelineState | null {
  return loadSessionStateFile().specialistPipeline
}

/**
 * Clear mission pipeline state from session state.
 */
export function clearMission(): void {
  saveSessionStateFile({
    activeTaskBrief: null,
    activeMissionId: null,
    activeRecipeId: null,
    activeProjectMapPath: null,
    activeTaskMapPath: null,
    activeContextBundlePath: null,
    activeContextBundles: {},
    specialistPipeline: null,
  })
}

function resolveHandoffTypeForStage(stage: string | null): string | null {
  switch (stage) {
    case "mapper":
      return "MapReport"
    case "builder":
    case "tdd-runner":
      return "BuildProposal"
    case "auditor":
      return "AuditReport"
    case "verifier":
      return "VerificationReport"
    default:
      return null
  }
}
