import type { Plugin } from "@opencode-ai/plugin"

import { pushContext } from "../lib/plugin-context"
import { getActiveMissionContext, isInternalFrameworkPath, resolveProjectPath } from "../lib/shadow-root/pathing"

function isLikelyMutatingCommand(command: string): boolean {
  const cmd = command.toLowerCase()
  const patterns = [
    /(^|\s)rm\s+/,
    /(^|\s)mv\s+/,
    /(^|\s)cp\s+/,
    /(^|\s)touch\s+/,
    /sed\s+-i/,
    /perl\s+-pi/,
    /git\s+commit/,
    /apply_patch/,
    /cat\s+>/,
    /\s+tee\s+/,
  ]
  return patterns.some((pattern) => pattern.test(cmd))
}

function extractCommand(args: Record<string, unknown> | undefined): string {
  if (!args) return ""
  const value = args.command ?? args.cmd ?? args.input
  return typeof value === "string" ? value : ""
}

function isIntegratorApplyCommand(command: string): boolean {
  const cmd = command.toLowerCase()
  return cmd.includes("shadow-apply") || cmd.includes("/apply")
}

/**
 * Integrator Gate Hook
 *
 * During mission staging, blocks direct physical-root mutations unless they are
 * explicitly performed through the apply/integrator path.
 */
export const IntegratorGatePlugin: Plugin = async () => {
  return {
    "tool.execute.before": async (input: any, output: any) => {
      const mission = getActiveMissionContext()
      if (!mission.active) return

      const args = (output.args ?? {}) as Record<string, unknown>
      const tool = typeof input.tool === "string" ? input.tool : ""

      if (tool === "write" || tool === "edit") {
        if (typeof args.shadowMissionId === "string") return

        const filePath = typeof args.filePath === "string" ? args.filePath : null
        if (!filePath) return

        const resolved = resolveProjectPath(filePath)
        if (isInternalFrameworkPath(resolved)) return

        throw new Error(
          `Integrator gate blocked direct physical write during staging mission ${mission.missionId}. Use Shadow-Root staging and /apply.`
        )
      }

      if (tool === "bash" || tool === "shell") {
        const command = extractCommand(args)
        if (!command) return
        if (!isLikelyMutatingCommand(command)) return
        if (isIntegratorApplyCommand(command)) return

        pushContext(
          output,
          `Integrator gate: mutating shell command blocked during staging mission ${mission.missionId}. Use /apply for physical-root updates.`,
        )
        throw new Error("Integrator gate blocked mutating shell command during mission staging.")
      }
    },
  }
}
