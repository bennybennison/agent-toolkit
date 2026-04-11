import type { MemoryEntry } from "./contracts/memory"
import { getDefaultOrchestrationArtifactStore } from "./persistence/store"

const MAX_MEMORIES_TO_INJECT = 5
const MAX_MEMORY_AGE_MS = 7 * 24 * 60 * 60 * 1000

export type { MemoryEntry } from "./contracts/memory"

export function writeMemory(entry: MemoryEntry): void {
  getDefaultOrchestrationArtifactStore().memory.writeEntry(entry)
}

export function loadRecentMemories(limit: number = MAX_MEMORIES_TO_INJECT): MemoryEntry[] {
  return getDefaultOrchestrationArtifactStore().memory.loadRecent(limit, MAX_MEMORY_AGE_MS)
}

export function formatMemoriesForContext(memories: MemoryEntry[]): string {
  if (memories.length === 0) return ""

  const lines = ["## Recent Session Memory (auto-loaded)", ""]
  for (const memory of memories) {
    const date = memory.timestamp.split("T")[0]
    const goal = memory.goal ?? "no goal recorded"
    const phase = memory.phase
    const blocked = memory.blockedReason ? ` — blocked: ${memory.blockedReason}` : ""
    const files = memory.filesRead.length > 0 ? ` (${memory.filesRead.length} files touched)` : ""
    lines.push(`- **${date}**: ${goal} → ended in \`${phase}\`${blocked}${files}`)
    if (memory.nextAction) {
      lines.push(`  - Next step was: ${memory.nextAction}`)
    }
  }
  return lines.join("\n")
}

export function getMemoryDir(): string {
  return getDefaultOrchestrationArtifactStore().memory.getEntriesDir()
}
