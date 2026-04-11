import type { OperationStyle } from "../framework-config"
import { getActiveModePolicy } from "../framework-config"

export type MutationGateDecision = {
  style: OperationStyle
  requiresApproval: boolean
  escalationOnLowConfidence: "stop-and-ask" | "downshift"
}

export function getMutationGateDecision(): MutationGateDecision {
  const policy = getActiveModePolicy()
  return {
    style: policy.operationStyle,
    requiresApproval: policy.approvalRequiredForMutation,
    escalationOnLowConfidence: policy.escalationOnLowConfidence,
  }
}

export function isInteractiveStyle(): boolean {
  return getActiveModePolicy().operationStyle === "interactive"
}
