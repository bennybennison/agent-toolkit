import type { Plugin } from "@opencode-ai/plugin"

import { pushContext } from "../lib/plugin-context"

/**
 * Runtime Model Fallback Hook
 *
 * Detects model API errors (429, 503, 529) and injects context suggesting
 * the agent should retry with a different approach or wait before retrying.
 * Since OpenCode handles model selection, this hook provides awareness
 * rather than automatic switching.
 * Module: hooks/model-fallback
 */
export const ModelFallbackPlugin: Plugin = async () => {
  const errorCounts = new Map<string, { count: number; lastSeen: number }>()

  // Reset error counts after 5 minutes of no errors
  const COOLDOWN_MS = 5 * 60 * 1000

  function trackError(errorType: string): number {
    const now = Date.now()
    const existing = errorCounts.get(errorType)

    if (existing && now - existing.lastSeen < COOLDOWN_MS) {
      existing.count++
      existing.lastSeen = now
      return existing.count
    }

    errorCounts.set(errorType, { count: 1, lastSeen: now })
    return 1
  }

  return {
    "tool.execute.after": async (input, output) => {
      // Only monitor tool execution results for error patterns
      const result = output.result ?? ""
      if (typeof result !== "string") return

      // Detect rate limiting
      if (result.includes("429") || result.includes("rate limit") || result.includes("Too Many Requests")) {
        const count = trackError("rate-limit")
        pushContext(
          output,
          `Rate limit detected (occurrence #${count} in this session). ` +
            `Consider: (1) waiting 30-60 seconds before retrying, ` +
            `(2) reducing the scope of the current task, ` +
            `(3) batching fewer parallel operations.`
        )
      }

      // Detect service unavailability
      if (result.includes("503") || result.includes("529") || result.includes("Service Unavailable") || result.includes("overloaded")) {
        const count = trackError("service-unavailable")
        pushContext(
          output,
          `Service unavailability detected (occurrence #${count}). ` +
            `The model provider may be experiencing high load. ` +
            `Wait 60 seconds before retrying. If this persists (3+ occurrences), ` +
            `consider simplifying the task or breaking it into smaller pieces.`
        )
      }

      // Detect context length exceeded
      if (result.includes("context length") || result.includes("token limit") || result.includes("maximum context")) {
        const count = trackError("context-overflow")
        pushContext(
          output,
          `Context length exceeded (occurrence #${count}). ` +
            `The conversation is too long. Consider: ` +
            `(1) using /checkpoint to save progress, ` +
            `(2) compacting the session, ` +
            `(3) breaking remaining work into a new session.`
        )
      }
    },
  }
}
