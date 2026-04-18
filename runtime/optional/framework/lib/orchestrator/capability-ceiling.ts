export type CapabilityCeiling = "read" | "verify" | "mutate"

export type SpecialistToolPermissions = {
  write: boolean
  edit: boolean
  bash: boolean
}

export const SPECIALIST_TOOL_PERMISSIONS: Record<string, SpecialistToolPermissions> = {
  "session-manager": { write: false, edit: false, bash: true },
  orchestrator: { write: true, edit: true, bash: true },
  contractor: { write: false, edit: false, bash: false },
  mapper: { write: false, edit: false, bash: false },
  builder: { write: true, edit: true, bash: true },
  auditor: { write: false, edit: false, bash: false },
  verifier: { write: false, edit: false, bash: true },
  "tdd-runner": { write: true, edit: true, bash: true },
  architect: { write: false, edit: false, bash: false },
  "audit-planner": { write: false, edit: false, bash: false },
  researcher: { write: false, edit: false, bash: true },
  "code-reviewer": { write: false, edit: false, bash: false },
  "build-fixer": { write: true, edit: true, bash: true },
  cleanup: { write: true, edit: true, bash: true },
}

export function ceilingAllowsPermissions(
  capabilityCeiling: CapabilityCeiling,
  permissions: SpecialistToolPermissions,
): boolean {
  if (capabilityCeiling === "mutate") return true
  if (capabilityCeiling === "verify") return !permissions.write && !permissions.edit
  return !permissions.write && !permissions.edit && !permissions.bash
}

export function isSpecialistAllowedForCeiling(
  capabilityCeiling: CapabilityCeiling,
  specialist: string,
): { ok: boolean; reason?: string } {
  const permissions = SPECIALIST_TOOL_PERMISSIONS[specialist]
  if (!permissions) {
    return { ok: false, reason: `Unknown specialist: ${specialist}` }
  }
  if (ceilingAllowsPermissions(capabilityCeiling, permissions)) {
    return { ok: true }
  }
  return {
    ok: false,
    reason: `Capability ceiling ${capabilityCeiling} blocks specialist ${specialist} (write=${permissions.write}, edit=${permissions.edit}, bash=${permissions.bash})`,
  }
}
