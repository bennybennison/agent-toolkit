import { resolve } from "node:path"
import type { ContextBundle } from "../contracts/context-bundle"
import type { HandoffObjectType } from "../contracts/handoff"
import type { Learning, LearningsSnapshot, MemoryEntry } from "../contracts/memory"
import type { FileMapObject, ProjectMap, TaskMap } from "../contracts/mapping"
import type { SessionSnapshot } from "../contracts/session"
import { validateContextBundle } from "../context-bundles/validation"
import { validateHandoffPayload } from "../orchestrator/handoff-validator"
import { validateProjectFileIndex, validateProjectMap, validateTaskMap } from "../mapping/validation"
import { createJsonArtifactBackend } from "./json-backend"
import type { OrchestrationArtifactStore, StoredArtifactRef } from "./contracts"
import { getCanonicalSessionStatePath, getLegacySessionStatePath, getLearningsPath, getMemoryEntriesDir, getRelativeArtifactPath, resolveHandoffPath, resolveMemoryEntryPath } from "./pathing"
import { getProjectMapArtifactPaths, loadContextBundle as loadContextBundleFile, loadProjectMap as loadProjectMapFile, loadTaskMap as loadTaskMapFile, saveContextBundle as saveContextBundleFile, saveProjectMap as saveProjectMapFile, saveTaskMap as saveTaskMapFile } from "../mapping/storage"

let defaultStore: OrchestrationArtifactStore | null = null
let defaultStoreRoot: string | null = null

function defaultSessionSnapshot(): SessionSnapshot {
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

function normalizeSessionSnapshot(payload: Partial<SessionSnapshot> | null): SessionSnapshot {
  const base = defaultSessionSnapshot()
  if (!payload) return base
  return {
    ...base,
    ...payload,
    activeContextBundles:
      payload.activeContextBundles != null && typeof payload.activeContextBundles === "object" && !Array.isArray(payload.activeContextBundles)
        ? Object.fromEntries(Object.entries(payload.activeContextBundles).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
        : {},
    completedHandoffRefs:
      payload.completedHandoffRefs != null && typeof payload.completedHandoffRefs === "object" && !Array.isArray(payload.completedHandoffRefs)
        ? Object.fromEntries(Object.entries(payload.completedHandoffRefs).filter((entry): entry is [HandoffObjectType, string] => typeof entry[1] === "string"))
        : {},
    completedHandoffs:
      payload.completedHandoffs != null && typeof payload.completedHandoffs === "object" && !Array.isArray(payload.completedHandoffs)
        ? payload.completedHandoffs
        : {},
    filesRead: Array.isArray(payload.filesRead) ? payload.filesRead.filter((value): value is string => typeof value === "string") : [],
  }
}

function extractMissionId(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null
  const missionId = (payload as { missionId?: unknown }).missionId
  return typeof missionId === "string" && missionId.length > 0 ? missionId : null
}

function normalizeLearnings(payload: LearningsSnapshot | null): LearningsSnapshot {
  if (!payload || payload.version !== 1 || !Array.isArray(payload.learnings)) {
    return { version: 1, learnings: [] }
  }
  return {
    version: 1,
    learnings: payload.learnings.filter((learning): learning is Learning => {
      return typeof learning?.id === "string"
        && typeof learning?.category === "string"
        && typeof learning?.text === "string"
        && typeof learning?.confidence === "number"
        && typeof learning?.createdAt === "string"
        && typeof learning?.confirmedCount === "number"
    }),
  }
}

function saveHandoffRef(type: HandoffObjectType, payload: unknown, rootDir: string): StoredArtifactRef | null {
  const missionId = extractMissionId(payload)
  if (!missionId) return null
  const validation = validateHandoffPayload(type, payload)
  if (!validation.ok) return null

  const backend = createJsonArtifactBackend()
  const path = resolveHandoffPath(type, missionId, rootDir)
  backend.write(path, payload)
  return {
    kind: "handoff",
    path: getRelativeArtifactPath(rootDir, path),
    storedAt: new Date().toISOString(),
    objectType: type,
    missionId,
  }
}

function loadHandoffByPath<T>(type: HandoffObjectType, refPath: string, rootDir: string): T | null {
  const backend = createJsonArtifactBackend()
  const absolutePath = refPath.startsWith(rootDir) ? refPath : resolve(rootDir, refPath)
  const payload = backend.read<T>(absolutePath)
  if (!payload) return null
  return validateHandoffPayload(type, payload).ok ? payload : null
}

export function createOrchestrationArtifactStore(rootDir: string = process.cwd()): OrchestrationArtifactStore {
  const backend = createJsonArtifactBackend()

  return {
    sessions: {
      loadCurrent(): SessionSnapshot {
        const canonical = backend.read<Partial<SessionSnapshot>>(getCanonicalSessionStatePath(rootDir))
        if (canonical) return normalizeSessionSnapshot(canonical)
        const legacy = backend.read<Partial<SessionSnapshot>>(getLegacySessionStatePath(rootDir))
        return normalizeSessionSnapshot(legacy)
      },
      saveCurrent(snapshot: SessionSnapshot): SessionSnapshot {
        const normalized = normalizeSessionSnapshot({
          ...snapshot,
          updatedAt: new Date().toISOString(),
        })
        backend.write(getCanonicalSessionStatePath(rootDir), normalized)
        backend.write(getLegacySessionStatePath(rootDir), normalized)
        return normalized
      },
      getCurrentPath(): string {
        return getLegacySessionStatePath(rootDir)
      },
    },
    handoffs: {
      save(type: HandoffObjectType, payload: unknown): StoredArtifactRef {
        const ref = saveHandoffRef(type, payload, rootDir)
        if (!ref) {
          throw new Error(`Unable to persist ${type} handoff payload`)
        }
        return ref
      },
      load<T>(type: HandoffObjectType, missionId: string): T | null {
        return loadHandoffByPath<T>(type, resolveHandoffPath(type, missionId, rootDir), rootDir)
      },
      loadFromRef<T>(type: HandoffObjectType, refPath: string): T | null {
        return loadHandoffByPath<T>(type, refPath, rootDir)
      },
      loadMany(refs: Partial<Record<HandoffObjectType, string>>): Partial<Record<HandoffObjectType, unknown>> {
        const loaded: Partial<Record<HandoffObjectType, unknown>> = {}
        for (const [type, refPath] of Object.entries(refs) as Array<[HandoffObjectType, string]>) {
          const payload = loadHandoffByPath(type, refPath, rootDir)
          if (payload != null) loaded[type] = payload
        }
        return loaded
      },
    },
    maps: {
      loadProject(): { projectMap: ProjectMap; files: Record<string, FileMapObject> } | null {
        const loaded = loadProjectMapFile()
        if (!loaded) return null
        return validateProjectMap(loaded.projectMap).ok && validateProjectFileIndex(loaded.files).ok ? loaded : null
      },
      saveProject(projectMap: ProjectMap, files: Record<string, FileMapObject>): void {
        saveProjectMapFile(projectMap, files)
      },
      loadTask(taskMapPath: string): TaskMap | null {
        const loaded = loadTaskMapFile(taskMapPath)
        return loaded && validateTaskMap(loaded).ok ? loaded : null
      },
      saveTask(taskMapPath: string, taskMap: TaskMap): void {
        saveTaskMapFile(taskMapPath, taskMap)
      },
      getProjectPaths(): { projectMapPath: string; projectFilesPath: string } {
        return getProjectMapArtifactPaths()
      },
    },
    contextBundles: {
      load(bundlePath: string): ContextBundle | null {
        const loaded = loadContextBundleFile(bundlePath)
        return loaded && validateContextBundle(loaded).ok ? loaded : null
      },
      save(bundlePath: string, bundle: ContextBundle): void {
        saveContextBundleFile(bundlePath, bundle)
      },
    },
    memory: {
      writeEntry(entry: MemoryEntry): StoredArtifactRef {
        const path = resolveMemoryEntryPath(entry.timestamp, rootDir)
        backend.write(path, entry)
        return {
          kind: "session",
          path: getRelativeArtifactPath(rootDir, path),
          storedAt: new Date().toISOString(),
          objectType: "MemoryEntry",
        }
      },
      loadRecent(limit: number, maxAgeMs: number): MemoryEntry[] {
        const cutoff = Date.now() - maxAgeMs
        const files = backend.list(getMemoryEntriesDir(rootDir))
          .filter((filePath) => filePath.endsWith(".json"))
          .sort()
          .reverse()

        const entries: MemoryEntry[] = []
        for (const filePath of files) {
          if (entries.length >= limit) break
          const entry = backend.read<MemoryEntry>(filePath)
          if (!entry || typeof entry.timestamp !== "string") continue
          if (new Date(entry.timestamp).getTime() >= cutoff) {
            entries.push(entry)
          }
        }
        return entries
      },
      getEntriesDir(): string {
        return getMemoryEntriesDir(rootDir)
      },
      getLearnings(): Learning[] {
        const snapshot = normalizeLearnings(backend.read<LearningsSnapshot>(getLearningsPath(rootDir)))
        return snapshot.learnings.slice().sort((left, right) => right.confidence - left.confidence)
      },
      saveLearnings(snapshot: LearningsSnapshot): void {
        backend.write(getLearningsPath(rootDir), normalizeLearnings(snapshot))
      },
    },
  }
}

export function getDefaultOrchestrationArtifactStore(rootDir: string = process.cwd()): OrchestrationArtifactStore {
  const resolvedRoot = resolve(rootDir)
  if (!defaultStore || defaultStoreRoot !== resolvedRoot) {
    defaultStore = createOrchestrationArtifactStore(rootDir)
    defaultStoreRoot = resolvedRoot
  }
  return defaultStore
}
