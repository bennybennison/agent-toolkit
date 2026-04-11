import type { TaskBrief, HandoffObjectType } from "./handoff"

export type SessionPhase =
  | "discovering"
  | "planning"
  | "executing"
  | "verifying"
  | "awaiting_user"
  | "blocked"
  | "done"

export type SpecialistPipelineState = {
  taskType: "feature" | "bug" | "refactor" | "tdd"
  specialists: string[]
  completedStages: string[]
  activeStage: string | null
  pendingHandoffType: string | null
}

export type SessionSnapshot = {
  activeCommand: string | null
  activeRecipeId: string | null
  goal: string | null
  phase: SessionPhase
  shadowMode: "inactive" | "staging"
  activeTaskBrief: TaskBrief | null
  activeMissionId: string | null
  activeMissionBranch: string | null
  activeProjectMapPath: string | null
  activeTaskMapPath: string | null
  activeContextBundlePath: string | null
  activeContextBundles: Record<string, string>
  specialistPipeline: SpecialistPipelineState | null
  completedHandoffRefs: Partial<Record<HandoffObjectType, string>>
  completedHandoffs: Partial<Record<HandoffObjectType, unknown>>
  filesRead: string[]
  outputPath: string | null
  nextAction: string | null
  blockedReason: string | null
  updatedAt: string | null
}
