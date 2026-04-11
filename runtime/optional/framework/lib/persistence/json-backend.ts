import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

export type JsonArtifactBackend = {
  read<T>(filePath: string): T | null
  write(filePath: string, payload: unknown): void
  list(dirPath: string): string[]
}

function read<T>(filePath: string): T | null {
  try {
    if (!existsSync(filePath)) return null
    return JSON.parse(readFileSync(filePath, "utf8")) as T
  } catch {
    return null
  }
}

function write(filePath: string, payload: unknown): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8")
}

function list(dirPath: string): string[] {
  if (!existsSync(dirPath)) return []
  return readdirSync(dirPath).map((entry) => join(dirPath, entry))
}

export function createJsonArtifactBackend(): JsonArtifactBackend {
  return { read, write, list }
}
