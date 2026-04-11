import type { Plugin } from "@opencode-ai/plugin"

import { pushContext } from "../lib/plugin-context"
import {
  ensureShadowParent,
  getActiveMissionContext,
  getShadowPathIfStaged,
  isInternalFrameworkPath,
  resolveProjectPath,
  toShadowPath,
} from "../lib/shadow-root/pathing"
import { recordShadowStage } from "../lib/shadow-root/staging-ledger"

function isFileTool(tool: string): boolean {
  return tool === "read" || tool === "write" || tool === "edit"
}

function getFilePath(args: Record<string, unknown> | undefined): string | null {
  const value = args?.filePath
  return typeof value === "string" && value.length > 0 ? value : null
}

/**
 * Shadow Root Hook
 *
 * Redirects file tools into the per-mission shadow workspace when session state
 * is in staging mode. Reads prefer the staged version when present.
 */
export const ShadowRootPlugin: Plugin = async () => {
  return {
    "tool.execute.before": async (input: Record<string, any>, output: Record<string, any>) => {
      const tool = typeof input.tool === "string" ? input.tool : ""
      if (!isFileTool(tool)) return

      const args = (output.args ?? {}) as Record<string, unknown>
      const filePath = getFilePath(args)
      if (!filePath) return
      if (isInternalFrameworkPath(filePath)) return

      const mission = getActiveMissionContext()
      if (!mission.active || !mission.missionId) return

      if (tool === "read") {
        const shadowExisting = getShadowPathIfStaged(filePath)
        if (!shadowExisting) return
        args.shadowOriginalPath = resolveProjectPath(filePath)
        args.filePath = shadowExisting
        pushContext(output, `Shadow read redirect: using staged file for active mission ${mission.missionId}.`)
        return
      }

      const shadowPath = toShadowPath(filePath, mission.missionId)
      ensureShadowParent(shadowPath)
      args.shadowOriginalPath = resolveProjectPath(filePath)
      args.filePath = shadowPath
      args.shadowMissionId = mission.missionId
      pushContext(output, `Shadow write redirect: staging changes under mission ${mission.missionId} instead of physical root.`)
    },

    "tool.execute.after": async (input: Record<string, any>, output: Record<string, any>) => {
      const tool = typeof input.tool === "string" ? input.tool : ""
      if (tool !== "write" && tool !== "edit") return

      const mission = getActiveMissionContext()
      if (!mission.active || !mission.missionId) return

      const original = getFilePath(input.args as Record<string, unknown> | undefined)
      if (!original || isInternalFrameworkPath(original)) return

      const shadowPath = toShadowPath(original, mission.missionId)
      const originalPath = resolveProjectPath(original)
      const rationale = typeof output.result === "string" ? output.result.slice(0, 240) : null
      recordShadowStage({
        missionId: mission.missionId,
        originalPath,
        shadowPath,
        rationale,
      })
    },
  }
}
