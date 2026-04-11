import type { OperationStyle } from "../framework-config"

export type SpecialistName = "mapper" | "builder" | "auditor" | "verifier" | "tdd-runner"

export type TaskType = "feature" | "bug" | "refactor" | "tdd"

export type SpecialistRoute = {
  taskType: TaskType
  style: OperationStyle
  specialists: SpecialistName[]
}

export function buildSpecialistRoute(taskType: TaskType, style: OperationStyle): SpecialistRoute {
  if (taskType === "tdd") {
    return {
      taskType,
      style,
      specialists: ["mapper", "tdd-runner", "auditor", "verifier"],
    }
  }

  const base: SpecialistName[] = ["mapper", "builder", "auditor", "verifier"]

  // Interactive mode can optionally short-circuit verifier for tiny scoped edits,
  // but default route keeps verifier for consistency until confidence-based skips are implemented.
  return {
    taskType,
    style,
    specialists: base,
  }
}

export function normalizeTaskType(input: string): TaskType {
  const value = input.toLowerCase()
  if (value.includes("bug") || value.includes("fix")) return "bug"
  if (value.includes("refactor")) return "refactor"
  if (value.includes("tdd") || value.includes("test")) return "tdd"
  return "feature"
}
