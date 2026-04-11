import type { Plugin } from "@opencode-ai/plugin"

import { pushContext } from "../lib/plugin-context"
import { sessionState } from "../lib/session-state"
import { getSessionStatePath, loadSessionStateFile, saveSessionStateFile, resetIfStale } from "../lib/session-state-store"
import { getMissionPipeline } from "../lib/orchestrator/mission-state"

/**
 * Session State Hook
 *
 * Tracks a small control-flow state machine so continuation behavior can be
 * driven by session state instead of generic "keep going" momentum.
 * Module: hooks/session-state
 */
export const SessionStatePlugin: Plugin = async () => {
  // Clear stale state from previous sessions (>10 min old)
  resetIfStale()

  return {
    "tool.execute.after": async (input, output) => {
      const changed = sessionState.observeTool(input as { tool?: unknown; args?: Record<string, unknown> })
      const snapshot = sessionState.getSnapshot()
      const tool = typeof input.tool === "string" ? input.tool : ""

      saveSessionStateFile({
        phase: snapshot.state,
        blockedReason: snapshot.reason,
      })

      if (!changed) {
        if (snapshot.state === "awaiting_user" || snapshot.state === "blocked") {
          pushContext(
            output,
            `Session state is ${snapshot.state}. ${sessionState.getAllowedActions()} Reason: ${snapshot.reason ?? "none"}.`
          )
        }
        return
      }

      pushContext(output, `Session state updated: ${snapshot.state}. ${sessionState.getAllowedActions()}`)

      if (snapshot.state === "executing") {
        pushContext(
          output,
          "Execution priority: if the exact next step is to create or update a known file, prefer the write/edit tool now. Do not reread source files or summarize before the write."
        )
      }

      const persisted = loadSessionStateFile()
      if (persisted.activeCommand) {
        pushContext(
          output,
          `Hard session state file: ${getSessionStatePath()}. Active command: ${persisted.activeCommand}. ` +
            `Next action: ${persisted.nextAction ?? "none"}.`
        )
      }

      const pipeline = getMissionPipeline()
      if (pipeline?.activeStage) {
        pushContext(
          output,
          `Active specialist pipeline: ${pipeline.specialists.join(" -> ")}. ` +
            `Currently executing: ${pipeline.activeStage}. ` +
            `Completed: [${pipeline.completedStages.join(", ")}]. ` +
            `Expected handoff payload: ${pipeline.pendingHandoffType ?? "none"}.`
        )
      }

      if (tool === "write" || tool === "edit") {
        pushContext(output, "A durable write occurred. Prefer completing the active command before switching tasks.")
      }
    },
  }
}
