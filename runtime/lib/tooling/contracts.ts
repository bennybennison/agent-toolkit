export type AdapterTarget = "opencode" | "copilot" | "vscode" | "codex"
export type InstallScope = "global" | "project"
export type InstallSource = "attach" | "sync" | "install" | "inferred"
export type CommandSurface = "user" | "user-agent" | "internal"
export type InteractionPolicy = "confirm-first" | "checkpointed" | "mutate-only" | "final-only"
export type CapabilityCeiling = "read" | "verify" | "mutate"
export type ContractMode = "advisory" | "required" | "validated"

export interface ToolCatalogEntry {
  id: string
  name: string
  category: string
  provides: string[]
  requires: string[]
  profiles: string[]
  always: boolean
  autoDetectFiles: string[]
  sourceDir: string
}

export interface CommandCatalogEntry {
  id: string
  description: string
  source: "pack" | "legacy"
  sourcePath: string
  packId?: string
  surface: CommandSurface
  delegatedAgent: string | null
  subtask: boolean
}

export interface RecipeCatalogEntry {
  id: string
  description: string
  sourcePath: string
  interactionPolicy: InteractionPolicy
  capabilityCeiling: CapabilityCeiling
  contractMode: ContractMode
  artifactRoot: string
  requiredContracts: string[]
  suggestedSkills: string[]
  allowedSpecialists: string[]
}

export interface InstalledTargetRecord {
  target: AdapterTarget
  scope: InstallScope
  rootDir: string
  installedAt: string
  updatedAt: string
  source: InstallSource
  generatedPaths: string[]
  generatedFileHashes?: Record<string, string>
  activePackIds: string[]
}

export interface ToolInstallRegistry {
  version: number
  installs: InstalledTargetRecord[]
}

export interface PrunableTarget {
  target: AdapterTarget
  paths: string[]
}

export interface BlockedTargetRemoval {
  target: AdapterTarget
  reason: string
  paths: string[]
}

export interface ProjectTargetPrunePlan {
  desiredTargets: AdapterTarget[]
  installedTargets: AdapterTarget[]
  removable: PrunableTarget[]
  blocked: BlockedTargetRemoval[]
}

export interface ProjectTargetPruneResult {
  removedTargets: AdapterTarget[]
  removedPaths: string[]
  blocked: BlockedTargetRemoval[]
}
