import type { Plugin } from "@opencode-ai/plugin"

import { loadSessionStateFile } from "../lib/session-state-store"
import { writeMemory, loadRecentMemories, formatMemoriesForContext } from "../lib/memory-store"
import type { MemoryEntry } from "../lib/memory-store"
import { getLearnings, addLearning, formatLearningsForContext } from "../lib/learnings-store"
import { pushContext } from "../lib/plugin-context"

/**
 * Cross-Session Memory Plugin
 *
 * Automatically captures session knowledge on idle and injects
 * relevant memories when a new session starts.
 *
 * Write path: session.idle → snapshot session-state.json → .opencode/memory/
 * Read path: first tool call of session → load recent memories → pushContext()
 */
export const CrossSessionMemoryPlugin: Plugin = async () => {
  let memoriesInjected = false

  return {
    event: async ({ event }) => {
      if (event.type !== "session.idle") return

      // Snapshot current session state into a memory entry
      const state = loadSessionStateFile()

      // Don't write empty/default memories
      if (!state.goal && state.filesRead.length === 0 && state.phase === "discovering") {
        return
      }

      const entry: MemoryEntry = {
        timestamp: new Date().toISOString(),
        goal: state.goal,
        phase: state.phase,
        filesRead: state.filesRead.slice(0, 20), // Cap at 20 to keep entries small
        blockedReason: state.blockedReason,
        nextAction: state.nextAction,
        activeCommand: state.activeCommand,
      }

      writeMemory(entry)
    },

    "tool.execute.after": async (input, output) => {
      // Auto-capture learnings from build/test failures
      if (input.tool === "bash" || input.tool === "shell") {
        const result = typeof output.result === "string" ? output.result : ""
        if (result.length > 50 && result.length < 5000) {
          // Detect failed build commands and capture the fix pattern
          const cmd = (input.args?.command ?? input.args?.cmd ?? "") as string
          if (/\b(build|compile|make|tsc|bun build)\b/i.test(cmd) && /error|failed|FAILED/i.test(result)) {
            const firstError = result.split("\n").find(l => /error/i.test(l))?.trim()
            if (firstError) {
              addLearning("build", `\`${cmd.slice(0, 60)}\` fails with: ${firstError.slice(0, 120)}`)
            }
          }
          if (/\b(test|pytest|jest|vitest|mocha)\b/i.test(cmd) && /fail|FAIL|error|ERROR/i.test(result)) {
            const summary = result.split("\n").filter(l => /fail|error|assert/i.test(l)).slice(0, 2).join("; ").trim()
            if (summary) {
              addLearning("test", `\`${cmd.slice(0, 60)}\` failure: ${summary.slice(0, 150)}`)
            }
          }
        }
      }

      // Inject memories + learnings on first tool call
      if (memoriesInjected) return
      memoriesInjected = true

      const memories = loadRecentMemories()
      if (memories.length === 0) return

      const context = formatMemoriesForContext(memories)
      if (context) {
        pushContext(output, context)
      }

      // Also inject project-level learnings
      const learnings = getLearnings()
      const learningsContext = formatLearningsForContext(learnings)
      if (learningsContext) {
        pushContext(output, learningsContext)
      }
    },
  }
}
