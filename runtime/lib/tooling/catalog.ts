import { loadPackManifests } from "../pack-resolver"
import { type ToolCatalogEntry } from "./contracts"

export function listToolCatalog(packsDir: string): ToolCatalogEntry[] {
  const manifests = loadPackManifests(packsDir)
  return [...manifests.entries()]
    .map(([id, { manifest, dir }]) => ({
      id,
      name: manifest.name,
      category: manifest.category,
      provides: [...manifest.provides],
      requires: [...manifest.requires],
      profiles: manifest.profiles ? [...manifest.profiles] : [],
      always: manifest.always ?? false,
      autoDetectFiles: manifest.auto_detect?.files ? [...manifest.auto_detect.files] : [],
      sourceDir: dir,
    }))
    .sort((left, right) => {
      const categoryCompare = left.category.localeCompare(right.category)
      if (categoryCompare !== 0) return categoryCompare
      return left.id.localeCompare(right.id)
    })
}
