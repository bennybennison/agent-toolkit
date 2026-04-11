import type { Plugin } from "@opencode-ai/plugin"

import { pushContext } from "../lib/plugin-context"
import { sessionState } from "../lib/session-state"

/**
 * Repeated Read Guard Hook
 *
 * Detects when the agent keeps re-reading the same small set of files without
 * making durable progress. On the 3rd+ read of the same file with no writes,
 * this hook BLOCKS the read (throws) instead of merely warning.
 * Module: hooks/repeated-read-guard
 */
export const RepeatedReadGuardPlugin: Plugin = async () => {
  const readCounts = new Map<string, number>()
  let writeCount = 0

  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "read") {
        const filePath = input.args?.filePath
        if (!filePath || typeof filePath !== "string") return

        const current = readCounts.get(filePath) ?? 0

        // Hard block on 3rd+ read of same file with no writes
        if (current >= 2 && writeCount === 0) {
          sessionState.setState(
            "blocked",
            `Blocked: rereading ${filePath} (${current + 1} times) without any durable writes`
          )
          throw new Error(
            `Repeated-read guard: BLOCKED reading "${filePath}" (attempt #${current + 1}) — ` +
              `you have read this file ${current} times without writing or editing any file. ` +
              `This means you are stuck. Either: (1) write a draft from the evidence you have, ` +
              `(2) ask ONE targeted question, or (3) name the blocker and stop. ` +
              `Do NOT retry this read.`
          )
        }
      }
    },

    "tool.execute.after": async (input, output) => {
      if (input.tool === "read") {
        const filePath = input.args?.filePath
        if (!filePath || typeof filePath !== "string") return

        const next = (readCounts.get(filePath) ?? 0) + 1
        readCounts.set(filePath, next)

        // Warn on 2nd read (block comes on 3rd via before hook)
        if (next >= 2 && writeCount === 0) {
          const repeatedFiles = [...readCounts.values()].filter(count => count >= 2).length
          pushContext(
            output,
            `Repeated-read warning: "${filePath}" read ${next} times without writes. ` +
              `Next read of this file will be BLOCKED. Write something or ask a question.`
          )

          if (repeatedFiles >= 2) {
            sessionState.setState(
              "blocked",
              "Multiple files reread without durable progress"
            )
            pushContext(
              output,
              `Multiple files reread without progress. Stop exploring. ` +
                `Write a draft with explicit assumptions, or ask for missing context.`
            )
          }
        }
      }

      if (input.tool === "write" || input.tool === "edit") {
        writeCount++
        // Reset read counts after a successful write — progress was made
        readCounts.clear()
      }
    },
  }
}
