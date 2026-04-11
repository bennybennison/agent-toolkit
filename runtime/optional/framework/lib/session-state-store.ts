import type { HandoffObjectType } from "./contracts/handoff"
import type { SessionSnapshot, SpecialistPipelineState } from "./contracts/session"
import { getDefaultOrchestrationArtifactStore } from "./persistence/store"

export type SessionStateFile = SessionSnapshot

function defaultState(): SessionStateFile {
  return {
    activeCommand: null,
    activeRecipeId: null,
    goal: null,
    phase: "discovering",
    shadowMode: "inactive",
    activeTaskBrief: null,
    activeMissionId: null,
    activeMissionBranch: null,
    activeProjectMapPath: null,
    activeTaskMapPath: null,
    activeContextBundlePath: null,
    activeContextBundles: {},
    specialistPipeline: null,
    completedHandoffRefs: {},
    completedHandoffs: {},
    filesRead: [],
    outputPath: null,
    nextAction: null,
    blockedReason: null,
    updatedAt: null,
  }
}

export function loadSessionStateFile(): SessionStateFile {
  return {
    ...defaultState(),
    ...getDefaultOrchestrationArtifactStore().sessions.loadCurrent(),
  }
}

export function saveSessionStateFile(patch: Partial<SessionStateFile>): SessionStateFile {
  const store = getDefaultOrchestrationArtifactStore()
  const current = loadSessionStateFile()
  const next: SessionStateFile = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  const persistedRefs: Partial<Record<HandoffObjectType, string>> = patch.completedHandoffs !== undefined
    ? { ...(patch.completedHandoffRefs ?? {}) }
    : {
        ...current.completedHandoffRefs,
        ...(patch.completedHandoffRefs ?? {}),
      }

  if (patch.completedHandoffs) {
    for (const [type, payload] of Object.entries(patch.completedHandoffs) as Array<[HandoffObjectType, unknown]>) {
      try {
        const ref = store.handoffs.save(type, payload)
        persistedRefs[type] = ref.path
      } catch {
        // Keep backward-compatible inline payloads even if persistence fails.
      }
    }
  }

  return store.sessions.saveCurrent({
    ...next,
    completedHandoffRefs: persistedRefs,
  })
}

export function getSessionStatePath(): string {
  return getDefaultOrchestrationArtifactStore().sessions.getCurrentPath()
}

export function isStrategicCommand(command: string | null): boolean {
  return command === "project-brief" || command === "portfolio-plan" || command === "plan"
}

/**
 * Persist a completed specialist handoff payload into session state by type name.
 * Used by advanceStage() so /apply-review can later read the stored evidence.
 */
export function storeHandoffPayload(type: string, payload: unknown): void {
  const handoffType = type as HandoffObjectType
  const state = loadSessionStateFile()
  try {
    const ref = getDefaultOrchestrationArtifactStore().handoffs.save(handoffType, payload)
    saveSessionStateFile({
      completedHandoffRefs: { ...state.completedHandoffRefs, [handoffType]: ref.path },
    })
  } catch {
    saveSessionStateFile({
      completedHandoffs: { ...state.completedHandoffs, [handoffType]: payload },
    })
  }
}

/**
 * Retrieve all completed handoff payloads from session state.
 */
export function loadCompletedHandoffs(): Record<string, unknown> {
  const state = loadSessionStateFile()
  const persisted = getDefaultOrchestrationArtifactStore().handoffs.loadMany(state.completedHandoffRefs)
  return {
    ...state.completedHandoffs,
    ...persisted,
  }
}

/**
 * Reset session state if it looks stale (from a previous session/task).
 * Called once at plugin init. If the updatedAt timestamp is older than
 * the staleness threshold, reset to defaults so hooks don't act on
 * leftover state from a prior task.
 */
export function resetIfStale(maxAgeMs: number = 10 * 60 * 1000): boolean {
  const state = loadSessionStateFile()
  if (!state.updatedAt) return false

  const age = Date.now() - new Date(state.updatedAt).getTime()
  if (age > maxAgeMs) {
    const fresh = { ...defaultState(), updatedAt: new Date().toISOString() }
    getDefaultOrchestrationArtifactStore().sessions.saveCurrent(fresh)
    return true
  }
  return false
}
