import type { SignatureGate } from "../modularity/contracts"
import {
  appendDecisionRecord,
  hasFreshSignatureRecord,
  recordSignatureApproval,
} from "../ledger/adapter"

function hasExplicitSignature(signature: string | null): boolean {
  return typeof signature === "string" && signature.trim().length >= 8
}

function isSignatureBoundToAction(signature: string, actor: string, target: string, tool: string): boolean {
  const normalized = signature.toLowerCase()
  return (
    normalized.includes(actor.toLowerCase()) &&
    normalized.includes(target.toLowerCase()) &&
    normalized.includes(tool.toLowerCase())
  )
}

export function createDefaultSignatureGate(): SignatureGate {
  return {
    id: "signature-gate-default",
    version: 1,
    async verify(input) {
      const signature = input.signature
      if (hasExplicitSignature(signature)) {
        const token = signature!

        if (!isSignatureBoundToAction(token, input.actor, input.target, input.tool)) {
          appendDecisionRecord("guardian.signature.verify", {
            approved: false,
            actor: input.actor,
            target: input.target,
            tool: input.tool,
            reason: "Signature token is not bound to actor+target+tool",
          })
          return {
            approved: false,
            reason: "Signature token must include actor, target, and tool for chain validation",
          }
        }

        const record = recordSignatureApproval({
          actor: input.actor,
          target: input.target,
          tool: input.tool,
          signature: token,
          ttlMinutes: 15,
        })

        if (!record.ok) {
          const reason = `Signature provided but ledger record failed: ${record.reason}`
          appendDecisionRecord("guardian.signature.verify", {
            approved: false,
            actor: input.actor,
            target: input.target,
            tool: input.tool,
            reason,
          })
          return {
            approved: false,
            reason,
          }
        }

        const freshCheck = hasFreshSignatureRecord({
          actor: input.actor,
          target: input.target,
          tool: input.tool,
          signature: token,
        })

        if (!freshCheck.ok || !freshCheck.approved) {
          const reason = !freshCheck.ok
            ? `Signature verification query failed: ${freshCheck.reason}`
            : freshCheck.reason
          appendDecisionRecord("guardian.signature.verify", {
            approved: false,
            actor: input.actor,
            target: input.target,
            tool: input.tool,
            reason,
          })
          return {
            approved: false,
            reason,
          }
        }

        const reason = "Signature chain verified (actor+target+tool bound, fresh record in SQLite ledger)"

        appendDecisionRecord("guardian.signature.verify", {
          approved: true,
          actor: input.actor,
          target: input.target,
          tool: input.tool,
          reason,
        })

        return { approved: true, reason }
      }

      appendDecisionRecord("guardian.signature.verify", {
        approved: false,
        actor: input.actor,
        target: input.target,
        tool: input.tool,
        reason: "Missing manual signature token",
      })

      return {
        approved: false,
        reason: "Missing manual signature token (guardian mode requires per-change approval)",
      }
    },
  }
}
