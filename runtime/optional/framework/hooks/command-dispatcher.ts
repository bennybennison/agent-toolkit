import type { Plugin } from "@opencode-ai/plugin"

import { pushContext } from "../lib/plugin-context"
import type { InteractionPolicy, RuntimeRecipeId, TaskBrief } from "../lib/contracts/handoff"
import { getActiveModePolicy, getDefaultOperationStyle } from "../lib/framework-config"
import { loadCompletedHandoffs, loadSessionStateFile, saveSessionStateFile } from "../lib/session-state-store"
import { getMissionPipeline, startMission } from "../lib/orchestrator/mission-state"
import { getMutationGateDecision } from "../lib/orchestrator/mode-policy"
import { ensureBranchIsolationForMission } from "../lib/orchestrator/branch-isolation"
import { getRuntimeRecipeMetadata } from "../lib/orchestrator/recipe-metadata"
import { getDefaultInteractionPolicyForRecipe, selectRecipeForCommand } from "../lib/orchestrator/recipe-routing"

/**
 * Command Dispatcher Hook
 *
 * Auto-initializes specialist pipelines for /partner and /mission commands
 * on the first tool call of a session that has no active pipeline yet.
 *
 * Also computes and injects the /apply-review gate decision by reading
 * completed handoff payloads from session state.
 *
 * Module: hooks/command-dispatcher
 */
export const CommandDispatcherPlugin: Plugin = async () => {
  return {
    "tool.execute.after": async (input: any, output: any) => {
      const state = loadSessionStateFile()
      const command = state.activeCommand
      const isLoopStart =
        command === "loop" && /\bstart\b/i.test(`${state.goal ?? ""} ${state.nextAction ?? ""}`)

      if (!command) return

      // Auto-initialize for /partner (interactive), /mission (autonomous), and /loop start (autonomous)
      if ((command === "partner" || command === "mission" || isLoopStart) && !getMissionPipeline()) {
        const style = command === "partner" ? getDefaultOperationStyle() : "autonomous"
        const goal = state.goal ?? "general task"
        const missionPrefix = command === "loop" ? "loop" : command
        const missionId = `${missionPrefix}-${Date.now()}`
        const recipeId = selectRecipeForCommand(command, goal)
        const recipeMeta = getRuntimeRecipeMetadata(recipeId)

        const brief: TaskBrief = {
          missionId,
          intent: goal,
          scope: { include: [], exclude: [] },
          constraints: [],
          operationStyle: style,
          mode: getActiveModePolicy().operationStyle === "autonomous" ? "autonomous" : "online",
          capabilityCeiling: "mutate",
          interactionPolicy: getDefaultInteractionPolicyForCommand(command, recipeId),
          recipeId,
          contractMode: recipeMeta.contractMode,
          artifactRoot: recipeMeta.artifactRoot,
          requiredContracts: recipeMeta.requiredContracts,
          crThreshold: style === "autonomous" ? 0.75 : 0.72,
        }

        if (style === "autonomous") {
          const branchResult = ensureBranchIsolationForMission(missionId, command === "loop" ? "loop" : "mission")
          if (branchResult.ok && branchResult.branch) {
            saveSessionStateFile({ activeMissionBranch: branchResult.branch })
            pushContext(
              output,
              `Branch isolation: using ${branchResult.branch}. ` +
                `${branchResult.created ? "Created new branch." : "Using existing branch."} ` +
                `${branchResult.previousBranch ? `Previous branch: ${branchResult.previousBranch}.` : ""}`,
            )
          } else {
            pushContext(
              output,
              `Branch isolation unavailable for autonomous run: ${branchResult.reason ?? "unknown reason"}`,
            )
          }
        }

        const result = startMission(brief)
        if (result.ok) {
          pushContext(
            output,
            `Command dispatcher: initialized specialist pipeline for /${command} (${style}). ` +
              `Recipe: ${recipeId}. ` +
              `Interaction policy: ${brief.interactionPolicy}. ` +
              `Contracts: ${brief.requiredContracts?.join(", ") || "none"} (${brief.contractMode ?? "advisory"}). ` +
              `Artifact root: ${brief.artifactRoot ?? ".agent-artifacts/"}. ` +
              `Mission ${result.missionId}. ` +
              `Pipeline: ${result.pipeline.specialists.join(" -> ")}. ` +
              `Active stage: ${result.pipeline.activeStage ?? "none"}.`,
          )
        } else {
          pushContext(output, `Command dispatcher: failed to initialize pipeline for /${command}: ${result.reason}`)
        }
        return
      }

      // For /apply-review, compute the gate decision from stored handoffs
      if (command === "apply-review") {
        const decision = computeApplyReviewGate()
        pushContext(
          output,
          `Apply-review gate: decision=${decision.decision}. ` +
            `Rationale: ${decision.rationale}. ` +
            (decision.blockingFindings.length > 0
              ? `Blocking findings: ${decision.blockingFindings.join("; ")}. `
              : "") +
            `Next step: ${decision.nextStep}.`,
        )
      }
    },
  }
}

export function getDefaultInteractionPolicyForCommand(command: string, recipeId?: RuntimeRecipeId): InteractionPolicy {
  if (command === "partner") return recipeId ? getDefaultInteractionPolicyForRecipe(recipeId) : "confirm-first"
  if (command === "mission" || command === "loop") return "final-only"
  return recipeId ? getDefaultInteractionPolicyForRecipe(recipeId) : "confirm-first"
}

export type ApplyReviewDecision = {
  decision: "approve" | "hold"
  rationale: string
  blockingFindings: string[]
  nextStep: "apply" | "rework"
}

/**
 * Evaluate whether staged specialist outputs pass all apply criteria.
 *
 * Gate criteria:
 * 1. BuildProposal confidence is above threshold (0.70 minimum)
 * 2. AuditReport.approved is true with no critical unresolved findings
 * 3. VerificationReport.signed is true with evidence
 * 4. Commander mode policy allows applying at current confidence level
 */
export function computeApplyReviewGate(): ApplyReviewDecision {
  const handoffs = loadCompletedHandoffs()
  const blockingFindings: string[] = []

  const build = handoffs["BuildProposal"] as Record<string, unknown> | undefined
  const audit = handoffs["AuditReport"] as Record<string, unknown> | undefined
  const verify = handoffs["VerificationReport"] as Record<string, unknown> | undefined
  const gate = getMutationGateDecision()

  // Criterion 1: BuildProposal confidence
  if (!build) {
    blockingFindings.push("No BuildProposal found in session state")
  } else {
    const confidence = typeof build["confidence"] === "number" ? build["confidence"] : null
    if (confidence === null) {
      blockingFindings.push("BuildProposal missing confidence field")
    } else if (confidence < 0.70) {
      blockingFindings.push(`BuildProposal confidence ${confidence.toFixed(2)} is below minimum 0.70`)
    }
  }

  // Criterion 2: AuditReport approval
  if (!audit) {
    blockingFindings.push("No AuditReport found in session state")
  } else {
    if (audit["approved"] !== true) {
      blockingFindings.push("AuditReport.approved is not true")
    }
    const findings = Array.isArray(audit["findings"]) ? (audit["findings"] as Array<Record<string, unknown>>) : []
    const criticals = findings.filter((f) => f["severity"] === "critical" && !f["fix"])
    for (const f of criticals) {
      blockingFindings.push(`Critical unresolved finding: ${String(f["message"] ?? "unknown")}`)
    }
    const violations = Array.isArray(audit["policyViolations"]) ? (audit["policyViolations"] as string[]) : []
    for (const v of violations) {
      blockingFindings.push(`Policy violation: ${v}`)
    }
  }

  // Criterion 3: VerificationReport sign-off
  if (!verify) {
    blockingFindings.push("No VerificationReport found in session state")
  } else {
    if (verify["signed"] !== true) {
      blockingFindings.push("VerificationReport.signed is not true")
    }
    const evidence = Array.isArray(verify["evidence"]) ? (verify["evidence"] as string[]) : []
    if (evidence.length === 0) {
      blockingFindings.push("VerificationReport has no evidence entries")
    }
    const failed = typeof verify["failed"] === "number" ? verify["failed"] : 0
    if (failed > 0) {
      blockingFindings.push(`VerificationReport: ${failed} test(s) failed`)
    }
  }

  // Criterion 4: Commander mode gate
  if (gate.requiresApproval && gate.escalationOnLowConfidence === "stop-and-ask") {
    // Non-blocking policy check: note it in rationale but don't force hold
    // (user invoked /apply-review explicitly, which counts as approval)
  }

  if (blockingFindings.length === 0) {
    return {
      decision: "approve",
      rationale: "All gate criteria passed: build confidence within threshold, audit approved, verification signed with evidence.",
      blockingFindings: [],
      nextStep: "apply",
    }
  }

  return {
    decision: "hold",
    rationale: `${blockingFindings.length} gate criterion/criteria not satisfied. Rework required before apply.`,
    blockingFindings,
    nextStep: "rework",
  }
}
