import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

export type DeleteCheckpointRecord = {
  path: string
  gitBlob: string
  createdAt: string
}

type DeleteCheckpointLog = {
  version: 1
  checkpoints: DeleteCheckpointRecord[]
}

function getLogPath(): string {
  return join(process.cwd(), ".agent", "state", "delete-checkpoints.json")
}

function loadLog(): DeleteCheckpointLog {
  const path = getLogPath()
  if (!existsSync(path)) {
    return { version: 1, checkpoints: [] }
  }

  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"))
    if (parsed?.version === 1 && Array.isArray(parsed.checkpoints)) {
      return {
        version: 1,
        checkpoints: parsed.checkpoints.filter((entry: any) => {
          return typeof entry?.path === "string"
            && typeof entry?.gitBlob === "string"
            && typeof entry?.createdAt === "string"
        }),
      }
    }
  } catch {
    // Fall back to a fresh log when the file is unreadable.
  }

  return { version: 1, checkpoints: [] }
}

export function appendDeleteCheckpoint(record: DeleteCheckpointRecord): void {
  const path = getLogPath()
  mkdirSync(join(process.cwd(), ".agent", "state"), { recursive: true })

  const log = loadLog()
  log.checkpoints.push(record)
  writeFileSync(path, JSON.stringify(log, null, 2) + "\n", "utf8")
}

export function getDeleteCheckpointLogPath(): string {
  return getLogPath()
}
