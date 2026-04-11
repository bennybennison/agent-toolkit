import type { FileMapObject, ProjectMap, TaskMap } from "../contracts/mapping"

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

function isFileMapObject(value: unknown): value is FileMapObject {
  if (!isObject(value)) return false
  return typeof value.path === "string" &&
    typeof value.name === "string" &&
    typeof value.extension === "string" &&
    typeof value.language === "string" &&
    typeof value.sizeBytes === "number" &&
    typeof value.mappingStatus === "string" &&
    isStringArray(value.keySymbols) &&
    isStringArray(value.tags) &&
    Array.isArray(value.relationships)
}

export function validateProjectMap(payload: unknown): ValidationResult {
  const errors: string[] = []
  const projectMap = payload as Partial<ProjectMap>

  if (!isObject(payload)) return { ok: false, errors: ["payload must be an object"] }
  if (projectMap.schemaVersion !== 1) errors.push("schemaVersion must be 1")
  if (typeof projectMap.mapId !== "string" || !projectMap.mapId) errors.push("mapId is required")
  if (typeof projectMap.rootPath !== "string" || !projectMap.rootPath) errors.push("rootPath is required")
  if (typeof projectMap.fileIndexPath !== "string" || !projectMap.fileIndexPath) errors.push("fileIndexPath is required")
  if (typeof projectMap.fileCount !== "number") errors.push("fileCount must be number")
  if (typeof projectMap.directoryCount !== "number") errors.push("directoryCount must be number")
  if (!isObject(projectMap.directories)) errors.push("directories must be an object")
  if (!isObject(projectMap.freshness)) errors.push("freshness must be an object")

  return { ok: errors.length === 0, errors }
}

export function validateTaskMap(payload: unknown): ValidationResult {
  const errors: string[] = []
  const taskMap = payload as Partial<TaskMap>

  if (!isObject(payload)) return { ok: false, errors: ["payload must be an object"] }
  if (taskMap.schemaVersion !== 1) errors.push("schemaVersion must be 1")
  if (typeof taskMap.taskMapId !== "string" || !taskMap.taskMapId) errors.push("taskMapId is required")
  if (typeof taskMap.missionId !== "string" || !taskMap.missionId) errors.push("missionId is required")
  if (typeof taskMap.projectMapId !== "string" || !taskMap.projectMapId) errors.push("projectMapId is required")
  if (typeof taskMap.intent !== "string" || !taskMap.intent) errors.push("intent is required")
  if (!isStringArray(taskMap.include)) errors.push("include must be string[]")
  if (!isStringArray(taskMap.exclude)) errors.push("exclude must be string[]")
  if (!isStringArray(taskMap.relevantDirectories)) errors.push("relevantDirectories must be string[]")
  if (!Array.isArray(taskMap.relevantFiles)) errors.push("relevantFiles must be array")
  if (!isStringArray(taskMap.keySymbols)) errors.push("keySymbols must be string[]")
  if (!isObject(taskMap.freshness)) errors.push("freshness must be an object")

  return { ok: errors.length === 0, errors }
}

export function validateProjectFileIndex(payload: unknown): ValidationResult {
  if (!isObject(payload)) return { ok: false, errors: ["payload must be an object"] }

  const entries = Object.values(payload)
  const errors = entries
    .flatMap((entry, index) => (isFileMapObject(entry) ? [] : [`entry ${index} must be a FileMapObject`]))

  return { ok: errors.length === 0, errors }
}
