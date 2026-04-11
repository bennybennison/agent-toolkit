/**
 * Unified Mode System
 *
 * Single canonical Mode type replacing the former split between ExecutionMode
 * (provider/network policy) and CommanderMode (approval/operation-style policy).
 *
 * Each mode is a full policy preset covering:
 *   - Provider/network access (which models and providers are allowed)
 *   - Operation style (interactive vs autonomous execution)
 *   - Approval gating (when human confirmation is required)
 *   - Network access label (informational; future tool-availability gating)
 *
 * Migration map from old vocabulary:
 *   ExecutionMode "online"      → Mode "online"
 *   ExecutionMode "offline"     → Mode "offline"
 *   ExecutionMode "hybrid"      → Mode "hybrid"
 *   CommanderMode "ghost"       → Mode "offline"
 *   CommanderMode "scout"       → Mode "online"
 *   CommanderMode "autocrat"    → Mode "autonomous"
 *   CommanderMode "guardian"    → Mode "review"
 *   CommanderMode "interviewer" → Mode "planning"
 */

import type { ProviderDefinition } from "./providers"
import type { ModelDefinition } from "./models"

// ── Mode Type ─────────────────────────────────────────────────────────────────

/**
 * Canonical mode vocabulary for Agent Framework.
 *
 * A mode is a full policy preset: it governs provider access, operation style,
 * approval gating, and network access in a single named concept.
 */
export type Mode =
  | "online"      // Full cloud access, interactive style, approval-gated mutations
  | "offline"     // Local models only, air-gapped, interactive style
  | "hybrid"      // Mixed cloud/local access, interactive style
  | "autonomous"  // Full cloud access, autonomous execution, minimal approval gates
  | "review"      // Full cloud access, autonomous-capable, signature-gated approvals
  | "planning"    // Full cloud access, interactive style, read-focused (blocks mutations)

// ── Network Dimension ─────────────────────────────────────────────────────────

/**
 * Internal network-access dimension used for model profile resolution.
 * Each Mode maps to one of these three network classes, which agent profiles
 * use to select the appropriate concrete model.
 */
export type NetworkDimension = "online" | "offline" | "hybrid"

/** Derive the network-access dimension from a mode. Used by the model resolver. */
export function getNetworkDimension(mode: Mode): NetworkDimension {
  if (mode === "offline") return "offline"
  if (mode === "hybrid") return "hybrid"
  return "online" // online, autonomous, review, and planning all allow cloud access
}

// ── Policy ────────────────────────────────────────────────────────────────────

export interface ModePolicy {
  readonly mode: Mode
  // Provider/network access policy
  readonly allowedProviderTypes: readonly ("cloud" | "local")[]
  readonly allowedAvailability: readonly ("online" | "offline" | "both")[]
  readonly enforceLocalOnly: boolean
  // Operation style policy
  readonly operationStyle: "interactive" | "autonomous"
  readonly approvalRequiredForMutation: boolean
  readonly escalationOnLowConfidence: "stop-and-ask" | "downshift"
  // Network access label (informational; future tool-availability gating)
  readonly networkAccess: "full" | "restricted" | "none"
}

// ── Default Mode Policies ─────────────────────────────────────────────────────

export const DEFAULT_MODE_POLICIES: Record<Mode, ModePolicy> = {
  online: {
    mode: "online",
    allowedProviderTypes: ["cloud", "local"],
    allowedAvailability: ["online", "offline", "both"],
    enforceLocalOnly: false,
    operationStyle: "interactive",
    approvalRequiredForMutation: true,
    escalationOnLowConfidence: "stop-and-ask",
    networkAccess: "full",
  },
  offline: {
    mode: "offline",
    allowedProviderTypes: ["local"],
    allowedAvailability: ["offline", "both"],
    enforceLocalOnly: true,
    operationStyle: "interactive",
    approvalRequiredForMutation: true,
    escalationOnLowConfidence: "stop-and-ask",
    networkAccess: "none",
  },
  hybrid: {
    mode: "hybrid",
    allowedProviderTypes: ["cloud", "local"],
    allowedAvailability: ["online", "offline", "both"],
    enforceLocalOnly: false,
    operationStyle: "interactive",
    approvalRequiredForMutation: true,
    escalationOnLowConfidence: "stop-and-ask",
    networkAccess: "restricted",
  },
  autonomous: {
    mode: "autonomous",
    allowedProviderTypes: ["cloud", "local"],
    allowedAvailability: ["online", "offline", "both"],
    enforceLocalOnly: false,
    operationStyle: "autonomous",
    approvalRequiredForMutation: false,
    escalationOnLowConfidence: "downshift",
    networkAccess: "full",
  },
  review: {
    mode: "review",
    allowedProviderTypes: ["cloud", "local"],
    allowedAvailability: ["online", "offline", "both"],
    enforceLocalOnly: false,
    operationStyle: "autonomous",
    approvalRequiredForMutation: true,
    escalationOnLowConfidence: "downshift",
    networkAccess: "full",
  },
  planning: {
    mode: "planning",
    allowedProviderTypes: ["cloud", "local"],
    allowedAvailability: ["online", "offline", "both"],
    enforceLocalOnly: false,
    operationStyle: "interactive",
    approvalRequiredForMutation: true,
    escalationOnLowConfidence: "stop-and-ask",
    networkAccess: "full",
  },
}

// ── Policy Functions ──────────────────────────────────────────────────────────

export function getModePolicy(mode: Mode): ModePolicy {
  return DEFAULT_MODE_POLICIES[mode]
}

export function isValidMode(value: string): value is Mode {
  return (
    value === "online" ||
    value === "offline" ||
    value === "hybrid" ||
    value === "autonomous" ||
    value === "review" ||
    value === "planning"
  )
}

export function isProviderAllowedByMode(
  provider: ProviderDefinition,
  mode: Mode,
): boolean {
  const policy = getModePolicy(mode)
  return policy.allowedProviderTypes.includes(provider.type)
}

export function isModelAllowedByMode(
  model: ModelDefinition,
  mode: Mode,
): boolean {
  const policy = getModePolicy(mode)
  return policy.allowedAvailability.includes(model.availability)
}
