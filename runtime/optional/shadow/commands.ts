import { CliCommandError } from "../../lib/optional-runtime-cli-core"

export function shadowStartRuntimeCommand(
  missionId: string | undefined,
  startMission: (missionId: string) => { ok: boolean; missionId?: string; reason?: string | null },
  log?: (line: string) => void,
): void {
  const print = log ?? console.log
  const result = startMission(missionId ?? "")
  if (!result.ok) {
    throw new CliCommandError(result.reason ?? "Failed to start shadow mission")
  }
  print(`✓ Shadow mission started: ${result.missionId}`)
}

export function shadowStopRuntimeCommand(
  stopMission: () => { previousMissionId?: string | null },
  log?: (line: string) => void,
): void {
  const print = log ?? console.log
  const result = stopMission()
  if (result.previousMissionId) {
    print(`✓ Shadow mission stopped: ${result.previousMissionId}`)
  } else {
    print("✓ Shadow mission already inactive")
  }
}

export function shadowStatusRuntimeCommand(
  missionIdOverride: string | undefined,
  getStatus: (missionIdOverride?: string) => {
    ok: boolean
    reason?: string | null
    missionId?: string | null
    active?: boolean
    stagedCount?: number
  },
  log?: (line: string) => void,
): void {
  const print = log ?? console.log
  const status = getStatus(missionIdOverride)
  if (!status.ok) {
    throw new CliCommandError(`Shadow status failed: ${status.reason ?? "unknown error"}`)
  }
  if (!status.missionId) {
    print("Shadow status: inactive (no mission selected)")
    return
  }
  print(`Shadow mission: ${status.missionId}`)
  print(`Mode: ${status.active ? "staging (active)" : "inactive"}`)
  print(`Staged files: ${status.stagedCount ?? 0}`)
}

export function resolveApplyMissionIdOrThrow(missionId: string | undefined, cliCommand: string): string {
  if (typeof missionId !== "string" || missionId.length === 0) {
    throw new CliCommandError(`Usage: ${cliCommand} apply <mission-id> [--yes]`)
  }
  return missionId
}
