export type ToolkitAgentId =
  | "session-manager"
  | "orchestrator"
  | "audit-planner"
  | "code-reviewer"
  | "researcher"
  | "build-fixer"
  | "mapper"
  | "builder"
  | "auditor"
  | "verifier"
  | "architect"
  | "cleanup"
  | "tdd-runner"

export type ToolkitAgentVisibility = "visible" | "hidden"
export type ToolkitAgentCapability = "read" | "verify" | "mutate"

export interface ToolkitAgentDefinition {
  id: ToolkitAgentId
  label: string
  visibility: ToolkitAgentVisibility
  capability: ToolkitAgentCapability
}

export const TOOLKIT_AGENT_DEFINITIONS: readonly ToolkitAgentDefinition[] = [
  { id: "session-manager", label: "Session-Manager", visibility: "visible", capability: "verify" },
  { id: "orchestrator", label: "Orchestrator", visibility: "visible", capability: "mutate" },
  { id: "audit-planner", label: "Audit Planner", visibility: "hidden", capability: "read" },
  { id: "code-reviewer", label: "Code Reviewer", visibility: "hidden", capability: "read" },
  { id: "researcher", label: "Researcher", visibility: "hidden", capability: "verify" },
  { id: "build-fixer", label: "Build Fixer", visibility: "hidden", capability: "mutate" },
  { id: "mapper", label: "Mapper", visibility: "hidden", capability: "read" },
  { id: "builder", label: "Builder", visibility: "hidden", capability: "mutate" },
  { id: "auditor", label: "Auditor", visibility: "hidden", capability: "read" },
  { id: "verifier", label: "Verifier", visibility: "hidden", capability: "verify" },
  { id: "architect", label: "Architect", visibility: "hidden", capability: "read" },
  { id: "cleanup", label: "Cleanup", visibility: "hidden", capability: "mutate" },
  { id: "tdd-runner", label: "TDD Runner", visibility: "hidden", capability: "mutate" },
] as const

export const HOST_VISIBLE_AGENT_IDS = TOOLKIT_AGENT_DEFINITIONS
  .filter((definition) => definition.visibility === "visible")
  .map((definition) => definition.id)

export const HIDDEN_SPECIALIST_AGENT_IDS = TOOLKIT_AGENT_DEFINITIONS
  .filter((definition) => definition.visibility === "hidden")
  .map((definition) => definition.id)

export function getToolkitAgentDefinition(id: string): ToolkitAgentDefinition | undefined {
  return TOOLKIT_AGENT_DEFINITIONS.find((definition) => definition.id === id)
}

export function isHostVisibleAgent(id: string): boolean {
  return HOST_VISIBLE_AGENT_IDS.includes(id as ToolkitAgentId)
}
