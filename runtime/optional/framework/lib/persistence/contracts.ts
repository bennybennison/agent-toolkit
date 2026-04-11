import type { ContextBundle } from "../contracts/context-bundle"
import type { HandoffObjectType } from "../contracts/handoff"
import type { Learning, LearningsSnapshot, MemoryEntry } from "../contracts/memory"
import type { ProjectMap, TaskMap, FileMapObject } from "../contracts/mapping"
import type { SessionSnapshot } from "../contracts/session"

export type StoredArtifactRef = {
  kind: "session" | "handoff" | "project-map" | "task-map" | "context-bundle"
  path: string
  storedAt: string
  objectType?: string
  missionId?: string
}

export type SessionRepository = {
  loadCurrent(): SessionSnapshot
  saveCurrent(snapshot: SessionSnapshot): SessionSnapshot
  getCurrentPath(): string
}

export type HandoffRepository = {
  save(type: HandoffObjectType, payload: unknown): StoredArtifactRef
  load<T>(type: HandoffObjectType, missionId: string): T | null
  loadFromRef<T>(type: HandoffObjectType, refPath: string): T | null
  loadMany(refs: Partial<Record<HandoffObjectType, string>>): Partial<Record<HandoffObjectType, unknown>>
}

export type MapRepository = {
  loadProject(): { projectMap: ProjectMap; files: Record<string, FileMapObject> } | null
  saveProject(projectMap: ProjectMap, files: Record<string, FileMapObject>): void
  loadTask(taskMapPath: string): TaskMap | null
  saveTask(taskMapPath: string, taskMap: TaskMap): void
  getProjectPaths(): { projectMapPath: string; projectFilesPath: string }
}

export type ContextBundleRepository = {
  load(bundlePath: string): ContextBundle | null
  save(bundlePath: string, bundle: ContextBundle): void
}

export type MemoryRepository = {
  writeEntry(entry: MemoryEntry): StoredArtifactRef
  loadRecent(limit: number, maxAgeMs: number): MemoryEntry[]
  getEntriesDir(): string
  getLearnings(): Learning[]
  saveLearnings(snapshot: LearningsSnapshot): void
}

export type OrchestrationArtifactStore = {
  sessions: SessionRepository
  handoffs: HandoffRepository
  maps: MapRepository
  contextBundles: ContextBundleRepository
  memory: MemoryRepository
}
