import type { ConfidenceAuditor } from "../modularity/contracts"
import { getDefaultOperationStyle } from "../framework-config"

type ConfidenceInput = {
  dataFidelity?: number
  toolReliability?: number
  logicCoherence?: number
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(1, value))
}

export function createDefaultConfidenceAuditor(): ConfidenceAuditor {
  return {
    id: "confidence-auditor-default",
    version: 1,
    score(input) {
      const src = input as ConfidenceInput
      const style = getDefaultOperationStyle()
      const baseline = style === "interactive" ? 0.72 : 0.7
      const fidelity = clamp01(src.dataFidelity ?? baseline)
      const reliability = clamp01(src.toolReliability ?? baseline)
      const coherence = clamp01(src.logicCoherence ?? baseline)

      // Weighted blend prioritizing evidence quality and execution reliability.
      const cr = clamp01(fidelity * 0.4 + reliability * 0.35 + coherence * 0.25)
      const explanation = `CR=${cr.toFixed(2)} style=${style} (fidelity=${fidelity.toFixed(2)}, reliability=${reliability.toFixed(2)}, coherence=${coherence.toFixed(2)})`
      return { cr, explanation }
    },
  }
}
