import type { Plugin } from "@opencode-ai/plugin"

import { pushContext } from "../lib/plugin-context"
import { getControlFlow } from "../lib/framework-config"
import { isStrategicCommand, loadSessionStateFile, saveSessionStateFile } from "../lib/session-state-store"

function inferCommandFromPath(filePath: string): string | null {
  if (filePath.endsWith("plan/project-brief.md")) return "project-brief"
  if (filePath.endsWith("plan/portfolio.md")) return "portfolio-plan"
  if (filePath.includes(".opencode/plans/")) return "plan"
  return null
}

export const StrategicReadGuardPlugin: Plugin = async () => {
  const config = getControlFlow()

  return {
    "tool.execute.before": async (input, output) => {
      const state = loadSessionStateFile()

      // Block non-write tools when strategic command has a pending write
      if (
        isStrategicCommand(state.activeCommand) &&
        state.nextAction?.startsWith("write ") &&
        input.tool !== "write" &&
        input.tool !== "edit"
      ) {
        throw new Error(
          `Strategic fast-path: active command is "${state.activeCommand}" and the next action is "${state.nextAction}". ` +
            `Cannot use ${String(input.tool)} now — write the target file instead.`
        )
      }

      if (input.tool === "read") {
        const filePath = input.args?.filePath
        if (!filePath || typeof filePath !== "string") return

        const strategicRead =
          filePath.endsWith("/AGENTS.md") ||
          filePath.endsWith("/plan/CONSTITUTION.md") ||
          filePath.endsWith("/plan/project-brief.md") ||
          filePath.endsWith("/plan/portfolio.md")

        if (!strategicRead) return

        // Hard block if file was already read and write is pending
        if (state.nextAction?.startsWith("write ") && state.filesRead.includes(filePath)) {
          throw new Error(
            `Strategic read BLOCKED: "${filePath}" already read. ` +
              `Next action is "${state.nextAction}". Write the target file now.`
          )
        }
        return
      }

      if (input.tool === "write") {
        const filePath = input.args?.filePath
        if (!filePath || typeof filePath !== "string") return

        const command = inferCommandFromPath(filePath)
        if (!command) return

        saveSessionStateFile({
          activeCommand: command,
          outputPath: filePath,
          nextAction: `write ${filePath}`,
          goal: `Create or update ${filePath}`,
        })
      }
    },
    "tool.execute.after": async (input, output) => {
      const state = loadSessionStateFile()

      if (input.tool === "read") {
        const filePath = input.args?.filePath
        if (!filePath || typeof filePath !== "string") return

        const filesRead = state.filesRead.includes(filePath) ? state.filesRead : [...state.filesRead, filePath]
        const nextPatch: {
          filesRead: string[]
          nextAction?: string
          blockedReason?: string | null
        } = { filesRead }

        // Use framework.json max_research_passes_without_write
        const maxPasses = config.max_research_passes_without_write
        if (isStrategicCommand(state.activeCommand) && state.outputPath && filesRead.length >= maxPasses + 1 && !state.nextAction?.startsWith("write ")) {
          nextPatch.nextAction = `write ${state.outputPath}`
          nextPatch.blockedReason = null
          pushContext(
            output,
            `Strategic task: ${filesRead.length} files read (limit: ${maxPasses + 1}). Next action is now "write ${state.outputPath}". Write now.`
          )
        }

        saveSessionStateFile(nextPatch)
        return
      }

      if (input.tool === "write" || input.tool === "edit") {
        const filePath = input.args?.filePath
        if (!filePath || typeof filePath !== "string") return

        if (state.outputPath === filePath) {
          saveSessionStateFile({
            nextAction: null,
            blockedReason: null,
          })
        }
      }
    },
  }
}
