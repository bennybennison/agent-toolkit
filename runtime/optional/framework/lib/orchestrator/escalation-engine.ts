import type { EscalationEngine } from "../modularity/contracts"
import { getActiveModePolicy } from "../framework-config"

type EscalationInput = {
  cr: number
  threshold: number
  phase: string
}

export function createDefaultEscalationEngine(): EscalationEngine {
  return {
    id: "escalation-engine-default",
    version: 1,
    decide(input) {
      const src = input as EscalationInput
      const phase = (src.phase ?? "").toLowerCase()
      const policy = getActiveModePolicy()

      if (src.cr < src.threshold) {
        if (policy.escalationOnLowConfidence === "stop-and-ask") {
          return "stop-and-ask"
        }

        // Even in autonomous modes, discovery/planning should pause when confidence is low.
        if (phase.includes("discover") || phase.includes("plan") || phase.includes("interview")) {
          return "stop-and-ask"
        }

        return "downshift"
      }

      return "continue"
    },
  }
}
