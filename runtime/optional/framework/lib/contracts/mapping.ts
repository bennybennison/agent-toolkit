export type MappingStatus = "unmapped" | "mapped" | "stale" | "skipped" | "error"

export type MapRefreshMode = "full" | "structure-only" | "targeted"

export type MapFreshnessStatus = "fresh" | "partial" | "stale"

export type FileRelationshipType =
  | "imports"
  | "imported-by"
  | "tests"
  | "tested-by"
  | "configures"
  | "documents"
  | "references"

export type FileRelationship = {
  type: FileRelationshipType
  targetPath: string
  detail?: string
}

export type DirectoryNode = {
  path: string
  name: string
  parentPath: string | null
  childDirectories: string[]
  filePaths: string[]
  totalFiles: number
  totalDirectories: number
  updatedAt: string
}

export type FileMapObject = {
  path: string
  name: string
  extension: string
  language: string
  sizeBytes: number
  modifiedAt: string | null
  lastSeenHash: string | null
  lastMappedAt: string | null
  mappingStatus: MappingStatus
  summary: string | null
  purpose: string | null
  keySymbols: string[]
  relationships: FileRelationship[]
  tags: string[]
  error: string | null
}

export type ProjectMapFreshness = {
  status: MapFreshnessStatus
  lastStructuralRefreshAt: string | null
  lastContentRefreshAt: string | null
  staleFileCount: number
  unmappedFileCount: number
  mappedFileCount: number
}

export type ProjectMap = {
  schemaVersion: 1
  mapId: string
  rootPath: string
  createdAt: string
  updatedAt: string
  directories: Record<string, DirectoryNode>
  fileIndexPath: string
  fileCount: number
  directoryCount: number
  languages: Record<string, number>
  tags: string[]
  freshness: ProjectMapFreshness
}

export type TaskMapSelectionReason =
  | "scope-include"
  | "intent-match"
  | "map-report"
  | "handoff"
  | "stale"
  | "relationship"

export type TaskMapSelection = {
  path: string
  reasons: TaskMapSelectionReason[]
  freshness: MappingStatus
}

export type TaskMapFreshness = {
  status: MapFreshnessStatus
  staleFiles: string[]
  unmappedFiles: string[]
}

export type TaskMap = {
  schemaVersion: 1
  taskMapId: string
  missionId: string
  projectMapId: string
  createdAt: string
  updatedAt: string
  intent: string
  include: string[]
  exclude: string[]
  relevantDirectories: string[]
  relevantFiles: TaskMapSelection[]
  keySymbols: string[]
  relationships: Array<{
    sourcePath: string
    type: FileRelationshipType
    targetPath: string
  }>
  risks: string[]
  freshness: TaskMapFreshness
}

export type MapRefreshResult = {
  mode: MapRefreshMode
  projectMap: ProjectMap
  files: Record<string, FileMapObject>
  addedFiles: string[]
  removedFiles: string[]
  changedFiles: string[]
  staleFiles: string[]
  remappedFiles: string[]
}
