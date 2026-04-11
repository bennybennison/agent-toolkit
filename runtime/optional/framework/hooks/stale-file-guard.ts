import type { Plugin } from "@opencode-ai/plugin"
import { createHash } from "node:crypto"
import { readFileSync, existsSync } from "node:fs"

import { pushContext } from "../lib/plugin-context"

/**
 * Stale File Guard Hook
 *
 * Tracks content hashes of files when the agent reads them. Before an edit,
 * checks whether the file has been modified externally since the last read.
 * If so, warns the agent to re-read before editing — preventing edits based
 * on stale context.
 *
 * Lighter than OmO's full LINE#ID hash system but catches the same class of bug:
 * the agent's mental model of a file diverging from reality.
 */
export const StaleFileGuardPlugin: Plugin = async () => {
  // Map of filePath → hash at last read time
  const readHashes = new Map<string, string>()

  function hashFile(filePath: string): string | null {
    try {
      if (!existsSync(filePath)) return null
      const content = readFileSync(filePath, "utf8")
      return createHash("sha256").update(content).digest("hex").slice(0, 16)
    } catch {
      return null
    }
  }

  return {
    // Capture hash on read; update after edits/writes to prevent false positives
    "tool.execute.after": async (input, output) => {
      const filePath = output.args?.shadowOriginalPath ?? input.args?.filePath
      if (typeof filePath !== "string") return

      if (input.tool === "read" || input.tool === "edit" || input.tool === "write") {
        const hash = hashFile(filePath)
        if (hash) readHashes.set(filePath, hash)
      }
    },

    // Before edit, verify file hasn't changed since last read
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "edit") return

      const filePath = output.args?.shadowOriginalPath ?? output.args?.filePath
      if (typeof filePath !== "string") return

      const lastHash = readHashes.get(filePath)
      if (!lastHash) return // Never read — write-guard.ts handles this case

      const currentHash = hashFile(filePath)
      if (!currentHash) return // File deleted — let the edit tool handle the error

      if (lastHash !== currentHash) {
        pushContext(
          output,
          `⚠️ **Stale file detected:** "${filePath}" has been modified since you last read it. ` +
            `Your edit may target the wrong content. Re-read the file before editing to ensure ` +
            `your oldString matches the current content.`
        )
        // Update hash so we don't warn again for the same state
        readHashes.set(filePath, currentHash)
      }
    },
  }
}
