import type { Plugin } from "@opencode-ai/plugin"

import { pushContext } from "../lib/plugin-context"
import { isStrategicCommand, loadSessionStateFile } from "../lib/session-state-store"

/**
 * Context Window Monitor Hook
 *
 * Tracks tool calls and output volume in the session. When thresholds are
 * exceeded, injects context advising the agent to compact or reduce scope.
 * Prevents runaway sessions that hit context limits unexpectedly.
 * Module: hooks/context-monitor
 */
export const ContextMonitorPlugin: Plugin = async () => {
  let toolCallCount = 0
  let estimatedOutputBytes = 0

  // Thresholds — tuned for typical 128k-200k context windows
  const TOOL_CALL_WARNING = 40
  const TOOL_CALL_CRITICAL = 70
  const OUTPUT_BYTES_WARNING = 200_000
  const OUTPUT_BYTES_CRITICAL = 400_000

  function estimateBytes(value: unknown): number {
    if (typeof value === "string") return value.length
    if (value === null || value === undefined) return 0
    try {
      return JSON.stringify(value).length
    } catch {
      return 0
    }
  }

  return {
    "tool.execute.after": async (_input, output) => {
      const state = loadSessionStateFile()
      const strategicFastPath = isStrategicCommand(state.activeCommand)

      toolCallCount++
      estimatedOutputBytes += estimateBytes(output.result)

      if (strategicFastPath) {
        if (toolCallCount === 6) {
          pushContext(
            output,
            `Strategic fast-path warning: ${toolCallCount} tool calls have already been used for "${state.activeCommand}". ` +
              `This command should usually finish in a few reads plus one write. ` +
              `Do not compact or broaden scope; write the target file now if enough context is loaded.`
          )
        }
        return
      }

      // Critical threshold — strongly recommend compaction
      if (toolCallCount === TOOL_CALL_CRITICAL) {
        pushContext(
          output,
          `CONTEXT CRITICAL: ${toolCallCount} tool calls in this session with ~${Math.round(estimatedOutputBytes / 1024)}KB of output. ` +
            `You are likely near the context limit. IMMEDIATELY: ` +
            `(1) Save progress by updating todos with current state, ` +
            `(2) compact the session, or ` +
            `(3) break remaining work into a new session. ` +
            `Do NOT continue making tool calls without addressing this.`
        )
        return
      }

      // Warning threshold — advise awareness
      if (toolCallCount === TOOL_CALL_WARNING) {
        pushContext(
          output,
          `Context monitor: ${toolCallCount} tool calls so far with ~${Math.round(estimatedOutputBytes / 1024)}KB of output. ` +
            `Consider whether you need to compact soon. ` +
            `Avoid reading large files in full — use targeted grep or offset/limit reads.`
        )
        return
      }

      // Output volume warning (independent of call count)
      if (estimatedOutputBytes > OUTPUT_BYTES_CRITICAL && toolCallCount % 5 === 0) {
        pushContext(
          output,
          `Context monitor: ~${Math.round(estimatedOutputBytes / 1024)}KB of tool output accumulated. ` +
            `This is a large amount of context. Consider compacting or starting a new session.`
        )
      } else if (estimatedOutputBytes > OUTPUT_BYTES_WARNING && estimatedOutputBytes <= OUTPUT_BYTES_CRITICAL && toolCallCount % 10 === 0) {
        pushContext(
          output,
          `Context monitor: ~${Math.round(estimatedOutputBytes / 1024)}KB of tool output accumulated. ` +
            `Be mindful of context usage — prefer targeted reads over full file reads.`
        )
      }
    },
  }
}
