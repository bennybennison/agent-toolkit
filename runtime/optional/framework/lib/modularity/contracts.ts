export type ModuleLayer = "governance" | "command" | "specialist" | "worker" | "foundation"

export type ModuleReplacementPolicy = "hot-swap" | "restart-required"

export type ModuleDescriptor = {
  module_id: string
  layer: ModuleLayer
  version: string
  provides: string[]
  depends_on: string[]
  config_schema_version: number
  feature_flags: string[]
  lifecycle_hooks: Array<"init" | "healthcheck" | "shutdown">
  health_contract: {
    required_checks: string[]
    severity: "warn" | "error"
  }
  replacement_policy: ModuleReplacementPolicy
}

export type CommanderPolicy = {
  id: string
  version: number
  evaluate(input: {
    intent: string
    phase: string
    confidenceThreshold: number
  }): {
    allowedProviders: string[]
    requiresManualSignature: boolean
    requiresQuestionBoost: boolean
  }
}

export type ConfidenceAuditor = {
  id: string
  version: number
  score(input: {
    dataFidelity: number
    toolReliability: number
    logicCoherence: number
  }): {
    cr: number
    explanation: string
  }
}

export type EscalationEngine = {
  id: string
  version: number
  decide(input: {
    cr: number
    threshold: number
    phase: string
  }): "continue" | "downshift" | "stop-and-ask"
}

export type LedgerStore = {
  id: string
  version: number
  append(eventType: string, payload: Record<string, unknown>): Promise<string>
}

export type SignatureGate = {
  id: string
  version: number
  verify(input: {
    tool: string
    target: string
    actor: string
    signature: string | null
  }): Promise<{ approved: boolean; reason: string }>
}

export type MemoryTierStore = {
  id: string
  version: number
  put(tier: "hot" | "warm" | "cold", key: string, payload: Record<string, unknown>): Promise<void>
}

export type IntegratorBridge = {
  id: string
  version: number
  merge(input: {
    artifacts: string[]
    governanceVerdicts: string[]
  }): Promise<{ ok: boolean; details: string }>
}
