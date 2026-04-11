import type { ContextBundle } from "../contracts/context-bundle"

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

export function validateContextBundle(payload: unknown): ValidationResult {
  const errors: string[] = []
  const bundle = payload as Partial<ContextBundle>

  if (!isObject(payload)) return { ok: false, errors: ["payload must be an object"] }
  if (bundle.schemaVersion !== 1) errors.push("schemaVersion must be 1")
  if (typeof bundle.bundleId !== "string" || !bundle.bundleId) errors.push("bundleId is required")
  if (typeof bundle.missionId !== "string" || !bundle.missionId) errors.push("missionId is required")
  if (!["planning", "implementation", "review", "verification", "handoff"].includes(String(bundle.purpose))) {
    errors.push("purpose must be a valid context bundle purpose")
  }
  if (!isObject(bundle.taskBrief)) errors.push("taskBrief must be an object")
  if (!isObject(bundle.mapContext)) errors.push("mapContext must be an object")
  if (!isObject(bundle.handoffContext)) errors.push("handoffContext must be an object")
  if (!isStringArray(bundle.risks)) errors.push("risks must be string[]")
  if (!isStringArray(bundle.constraints)) errors.push("constraints must be string[]")
  if (bundle.nextAction !== null && bundle.nextAction !== undefined && typeof bundle.nextAction !== "string") {
    errors.push("nextAction must be string | null")
  }

  return { ok: errors.length === 0, errors }
}
