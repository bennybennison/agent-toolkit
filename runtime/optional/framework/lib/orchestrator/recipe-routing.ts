import type { InteractionPolicy, RuntimeRecipeId } from "../contracts/handoff"
import type { OperationStyle } from "../framework-config"
import type { SpecialistName, SpecialistRoute, TaskType } from "./specialist-router"
import { normalizeTaskType } from "./specialist-router"

function includesAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value))
}

function inferRecipeFromGoal(goal: string): RuntimeRecipeId {
  const value = goal.toLowerCase()

  if (includesAny(value, [/\breview\b/, /\baudit\b/, /\bcode review\b/, /\bsecurity review\b/])) {
    return "review-and-recommend"
  }
  if (includesAny(value, [/\bwireframe\b/, /\boutside-in\b/, /\bui[- ]first\b/, /\bmock data\b/, /\bscreen flow\b/])) {
    return "wireframe-outside-in"
  }
  if (includesAny(value, [/\bmap\b/, /\bexplore\b/, /\bassess\b/, /\bfeasibility\b/, /\bplacement\b/])) {
    return "map-and-assess"
  }
  if (includesAny(value, [/\bplan\b/, /\bbrief\b/, /\bspec\b/, /\bstrategy\b/, /\broadmap\b/])) {
    return "plan-from-idea"
  }
  if (includesAny(value, [/\bfix\b/, /\bbug\b/, /\brepair\b/, /\bregression\b/, /\bfailing\b/, /\bfailure\b/])) {
    return "repair-and-verify"
  }
  if (includesAny(value, [/\bbuild\b/, /\bimplement\b/, /\bcreate\b/, /\badd\b/, /\bupdate\b/, /\bfeature\b/, /\brefactor\b/])) {
    return "implement-from-plan"
  }
  return "hold-and-justify"
}

export function selectRecipeForCommand(command: string, goal: string): RuntimeRecipeId {
  switch (command) {
    case "session":
    case "save-session":
    case "resume-session":
    case "status":
      return "session-open-close"
    case "map":
    case "explore":
      return "map-and-assess"
    case "plan":
    case "project-brief":
    case "portfolio-plan":
      return "plan-from-idea"
    case "repair":
      return "repair-and-verify"
    case "review":
    case "audit":
    case "apply-review":
      return "review-and-recommend"
    case "outside-in":
    case "ui-first":
      return "wireframe-outside-in"
    case "partner":
    case "mission":
    case "loop":
      return inferRecipeFromGoal(goal)
    default:
      return inferRecipeFromGoal(goal)
  }
}

export function getDefaultInteractionPolicyForRecipe(recipeId: RuntimeRecipeId): InteractionPolicy {
  if (recipeId === "implement-from-plan" || recipeId === "repair-and-verify") return "mutate-only"
  return "confirm-first"
}

function buildRecipeSpecialists(recipeId: RuntimeRecipeId, taskType: TaskType): SpecialistName[] {
  switch (recipeId) {
    case "hold-and-justify":
    case "session-open-close":
      return []
    case "map-and-assess":
    case "plan-from-idea":
      return ["mapper"]
    case "review-and-recommend":
      return ["mapper", "auditor"]
    case "wireframe-outside-in":
      return ["mapper", "builder", "verifier"]
    case "implement-from-plan":
    case "repair-and-verify":
      if (taskType === "tdd") {
        return ["tdd-runner", "auditor", "verifier"]
      }
      return ["builder", "auditor", "verifier"]
    default:
      return ["mapper", "builder", "auditor", "verifier"]
  }
}

export function buildRecipeRoute(
  recipeId: RuntimeRecipeId,
  intent: string,
  style: OperationStyle,
): SpecialistRoute {
  const taskType = normalizeTaskType(intent)
  return {
    taskType,
    style,
    specialists: buildRecipeSpecialists(recipeId, taskType),
  }
}
