import type { ContextBundlePurpose } from "../contracts/context-bundle"
import type { AuditReport, BuildProposal, MapReport, TaskBrief, VerificationReport } from "../contracts/handoff"
import type { TaskMap } from "../contracts/mapping"
import { assembleContextBundle } from "../context-bundles/assembly"
import { refreshProjectMap, ensureProjectMap } from "../mapping/project-map"
import { resolveContextBundlePath, resolveTaskMapPath } from "../mapping/pathing"
import { buildTaskMap } from "../mapping/task-map"
import { getDefaultOrchestrationArtifactStore } from "../persistence/store"

export type MissionArtifactRefs = {
  projectMapPath: string | null
  taskMapPath: string | null
  contextBundlePath: string | null
  contextBundlePurpose: ContextBundlePurpose | null
}

type HandoffInputs = {
  mapReport?: MapReport
  buildProposal?: BuildProposal
  auditReport?: AuditReport
  verificationReport?: VerificationReport
}

export function prepareMissionArtifacts(brief: TaskBrief): MissionArtifactRefs {
  const store = getDefaultOrchestrationArtifactStore()
  const mapResult = ensureProjectMap()
  const artifactPaths = store.maps.getProjectPaths()
  const taskMap = buildTaskMap({
    brief,
    projectMap: mapResult.projectMap,
    files: mapResult.files,
  })

  const taskMapPath = resolveTaskMapPath(taskMap.taskMapId)
  store.maps.saveTask(taskMapPath, taskMap)

  const bundlePath = resolveContextBundlePath(brief.missionId, "planning")
  const bundle = assembleContextBundle({
    purpose: "planning",
    brief,
    projectMap: mapResult.projectMap,
    taskMap,
    files: mapResult.files,
  })
  store.contextBundles.save(bundlePath, bundle)

  return {
    projectMapPath: artifactPaths.projectMapPath,
    taskMapPath,
    contextBundlePath: bundlePath,
    contextBundlePurpose: "planning",
  }
}

export function updateMissionArtifacts(input: {
  brief: TaskBrief
  completedStage: "mapper" | "builder" | "auditor" | "verifier" | "tdd-runner"
  handoffs: HandoffInputs
  taskMapPath: string | null
}): MissionArtifactRefs {
  const store = getDefaultOrchestrationArtifactStore()
  if (!store.maps.loadProject()) {
    return prepareMissionArtifacts(input.brief)
  }
  const artifactPaths = store.maps.getProjectPaths()

  const existingTaskMap = input.taskMapPath ? store.maps.loadTask(input.taskMapPath) : null
  const remapPaths = collectRemapTargets(existingTaskMap, input.handoffs)
  const mapResult = remapPaths.length > 0
    ? refreshProjectMap({ mode: "targeted", targetPaths: remapPaths })
    : ensureProjectMap()

  const taskMap = buildTaskMap({
    brief: input.brief,
    projectMap: mapResult.projectMap,
    files: mapResult.files,
    existingTaskMap,
    handoffs: input.handoffs,
  })

  const taskMapPath = resolveTaskMapPath(taskMap.taskMapId)
  store.maps.saveTask(taskMapPath, taskMap)

  const purpose = purposeForStage(input.completedStage)
  const bundlePath = resolveContextBundlePath(input.brief.missionId, purpose)
  const bundle = assembleContextBundle({
    purpose,
    brief: input.brief,
    projectMap: mapResult.projectMap,
    taskMap,
    files: mapResult.files,
    handoffs: input.handoffs,
  })
  store.contextBundles.save(bundlePath, bundle)

  return {
    projectMapPath: artifactPaths.projectMapPath,
    taskMapPath,
    contextBundlePath: bundlePath,
    contextBundlePurpose: purpose,
  }
}

function collectRemapTargets(taskMap: TaskMap | null, handoffs: HandoffInputs): string[] {
  const targets = new Set<string>()

  for (const path of taskMap?.freshness.staleFiles ?? []) targets.add(path)
  for (const path of taskMap?.freshness.unmappedFiles ?? []) targets.add(path)
  for (const path of handoffs.mapReport?.relevantFiles ?? []) targets.add(path)
  for (const path of handoffs.buildProposal?.stagedFiles ?? []) targets.add(path)
  for (const path of handoffs.auditReport?.findings.map((finding) => finding.file) ?? []) targets.add(path)
  for (const path of handoffs.verificationReport?.testsRun.filter((value) => value.includes("/")) ?? []) targets.add(path)

  return [...targets].sort()
}

function purposeForStage(stage: "mapper" | "builder" | "auditor" | "verifier" | "tdd-runner"): ContextBundlePurpose {
  switch (stage) {
    case "mapper":
      return "implementation"
    case "builder":
    case "tdd-runner":
      return "review"
    case "auditor":
      return "verification"
    case "verifier":
      return "handoff"
  }
}
