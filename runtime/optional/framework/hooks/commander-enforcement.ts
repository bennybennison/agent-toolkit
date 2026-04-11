import type { Plugin } from "@opencode-ai/plugin"

import { getModeConfig, getActiveModePolicy } from "../lib/framework-config"
import { createDefaultSignatureGate } from "../lib/governance/signature-gate"
import { appendDecisionRecord } from "../lib/ledger/adapter"
import { createDefaultConfidenceAuditor } from "../lib/orchestrator/confidence-auditor"
import { createDefaultEscalationEngine } from "../lib/orchestrator/escalation-engine"

function isLocalModel(model: string): boolean {
  const normalized = model.trim().toLowerCase()
  return normalized.startsWith("ollama/") || normalized.startsWith("local/")
}

function extractCommand(args: Record<string, unknown> | undefined): string {
  if (!args) return ""
  const value = args.command ?? args.cmd ?? args.input
  return typeof value === "string" ? value : ""
}

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
    /npm\s+install/,
    /pip\s+install/,
  ]
  return patterns.some((pattern) => pattern.test(cmd))
}

/**
 * Commander Enforcement Hook
 *
 * Enforces mode-specific runtime policies.
 * - Ghost: local-only model usage when model is explicitly provided.
 * - Interviewer: blocks write/edit tool usage and likely mutating shell commands.
 */
export const CommanderEnforcementPlugin: Plugin = async () => {
  const confidenceAuditor = createDefaultConfidenceAuditor()
  const escalationEngine = createDefaultEscalationEngine()
  const signatureGate = createDefaultSignatureGate()

  return {
    "tool.execute.before": async (input, output) => {
      const { mode, cr_threshold } = getModeConfig()
      const policy = getActiveModePolicy()
      const args = (output.args ?? {}) as Record<string, unknown>
      const dataFidelity = typeof args.dataFidelity === "number" ? args.dataFidelity : 0.7
      const toolReliability = typeof args.toolReliability === "number" ? args.toolReliability : 0.7
      const logicCoherence = typeof args.logicCoherence === "number" ? args.logicCoherence : 0.7
      const confidence = confidenceAuditor.score({
        dataFidelity,
        toolReliability,
        logicCoherence,
      })
      const escalation = escalationEngine.decide({
        cr: confidence.cr,
        threshold: cr_threshold,
        phase: mode,
      })

      appendDecisionRecord("commander.confidence.score", {
        mode,
        tool: input.tool,
        cr: confidence.cr,
        threshold: cr_threshold,
        explanation: confidence.explanation,
      })

      appendDecisionRecord("commander.escalation.decision", {
        mode,
        tool: input.tool,
        decision: escalation,
        cr: confidence.cr,
        threshold: cr_threshold,
      })

      if (escalation === "stop-and-ask") {
        throw new Error(
          `Commander escalation requires clarification before execution (${confidence.explanation}, threshold=${cr_threshold.toFixed(2)}).`,
        )
      }

      if (policy.enforceLocalOnly) {
        const modelArg = args.model
        if (typeof modelArg === "string" && !isLocalModel(modelArg)) {
          throw new Error(
            `Mode policy blocked model "${modelArg}". Offline mode requires ollama/local models.`,
          )
        }

        const command = extractCommand(args)
        const modelMatch = command.match(/(?:^|\s)-m\s+([^\s]+)/)
        if (modelMatch && !isLocalModel(modelMatch[1])) {
          throw new Error(
            `Mode policy blocked CLI model "${modelMatch[1]}". Offline mode requires ollama/local models.`,
          )
        }
      }

      if (mode === "review") {
        const signatureArg = typeof args.signature === "string" ? args.signature : null
        const actorArg = typeof args.actor === "string" ? args.actor : process.env.USER ?? "unknown"
        const target = typeof args.filePath === "string" ? args.filePath : input.tool
        const decision = await signatureGate.verify({
          tool: input.tool,
          target,
          actor: actorArg,
          signature: signatureArg,
        })

        if (!decision.approved) {
          throw new Error(`Mode policy denied operation in review mode: ${decision.reason}.`)
        }
      }

      if (mode === "planning") {
        if (input.tool === "write" || input.tool === "edit") {
          throw new Error(
            "Mode policy blocked file modification: planning mode is read-focused. Ask clarifying questions before making changes.",
          )
        }

        if (input.tool === "bash" || input.tool === "shell") {
          const command = extractCommand(args)
          if (command && isLikelyMutatingCommand(command)) {
            throw new Error(
              "Mode policy blocked mutating shell command: planning mode is read-focused.",
            )
          }
        }
      }
    },
  }
}
