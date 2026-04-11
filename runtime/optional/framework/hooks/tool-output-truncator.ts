import type { Plugin } from "@opencode-ai/plugin"

import { pushContext } from "../lib/plugin-context"

/**
 * Tool Output Truncator Hook
 *
 * Detects excessively long tool outputs and injects context advising
 * the agent to use more targeted approaches (offset/limit reads,
 * grep instead of full reads, etc.). Works alongside the context
 * monitor but focuses on per-call output size.
 * Module: hooks/tool-output-truncator
 */
export const ToolOutputTruncatorPlugin: Plugin = async () => {
  // Per-call thresholds
  const WARN_BYTES = 50_000
  const LARGE_BYTES = 100_000

  function getOutputSize(result: unknown): number {
    if (typeof result === "string") return result.length
    if (result === null || result === undefined) return 0
    try {
      return JSON.stringify(result).length
    } catch {
      return 0
    }
  }

  function getToolAdvice(tool: string): string {
    switch (tool) {
      case "read":
        return "Use offset/limit parameters to read specific sections, or use grep to find relevant lines first."
      case "bash":
        return "Pipe output through head/tail, or redirect to a file and read specific sections."
      case "glob":
        return "Use more specific glob patterns to narrow results."
      case "grep":
        return "Use more specific regex patterns or add include filters to narrow results."
      default:
        return "Consider whether you need all this output, or if a more targeted approach would work."
    }
  }

  return {
    "tool.execute.after": async (input, output) => {
      const size = getOutputSize(output.result)

      if (size > LARGE_BYTES) {
        pushContext(
          output,
          `Large output warning: The last ${input.tool} call returned ~${Math.round(size / 1024)}KB of output. ` +
            `This wastes context window space. ${getToolAdvice(input.tool)}`
        )
      } else if (size > WARN_BYTES) {
        pushContext(
          output,
          `Output size note: The last ${input.tool} call returned ~${Math.round(size / 1024)}KB. ` +
            `${getToolAdvice(input.tool)}`
        )
      }
    },
  }
}
