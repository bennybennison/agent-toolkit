import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

export type DepGraph = {
  name: string | null
  version: string | null
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  peerDependencies: Record<string, string>
  totalDeps: number
}

/**
 * Atomic worker: read dependency graph from package.json without executing
 * package manager commands. Returns a flat dep summary for Mapper scope analysis.
 */
export function readDepGraph(rootDir: string = process.cwd()): DepGraph {
  const pkgPath = join(rootDir, "package.json")

  if (!existsSync(pkgPath)) {
    return {
      name: null,
      version: null,
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
      totalDeps: 0,
    }
  }

  try {
    const raw = readFileSync(pkgPath, "utf8")
    const pkg = JSON.parse(raw) as Record<string, unknown>
    const deps = (pkg["dependencies"] as Record<string, string>) ?? {}
    const devDeps = (pkg["devDependencies"] as Record<string, string>) ?? {}
    const peerDeps = (pkg["peerDependencies"] as Record<string, string>) ?? {}

    return {
      name: typeof pkg["name"] === "string" ? pkg["name"] : null,
      version: typeof pkg["version"] === "string" ? pkg["version"] : null,
      dependencies: deps,
      devDependencies: devDeps,
      peerDependencies: peerDeps,
      totalDeps: Object.keys(deps).length + Object.keys(devDeps).length + Object.keys(peerDeps).length,
    }
  } catch {
    return {
      name: null,
      version: null,
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
      totalDeps: 0,
    }
  }
}

/**
 * Check if a specific dependency (runtime or dev) is present.
 */
export function hasDependency(name: string, rootDir: string = process.cwd()): boolean {
  const graph = readDepGraph(rootDir)
  return (
    name in graph.dependencies ||
    name in graph.devDependencies ||
    name in graph.peerDependencies
  )
}
