import { OPTIONAL_RUNTIME_DISPLAY_NAME, OPTIONAL_RUNTIME_PREFERRED_CLI } from "./optional-runtime-identity"

export interface OptionalRuntimeStatusData {
  profile: string
  compaction: string
  activeHooks: number
  availableHooks: number
  hookFiles: number
  skillsCount: number
  skillsSource: string
  agentsCount: number
  agentsSource: string
  legacyCommandsCount: number
  legacyCommandsSource: string
  userCommandsCount: number
  userAgentCommandsCount: number
  internalCommandsCount: number
  memoryCount: number
  learningsCount: number
  configLabel: string
  packsLabel: string
  attachment:
    | { attached: false }
    | {
        attached: true
        attachedDate: string
        artifactCount: number
        runtimeArtifactCount: number
        adapterArtifactCount: number
        durableArtifactCount: number
        trackedDirectories: number
      }
  sandboxLabel: string
  staleFileGuardLabel: string
}

export function displayOptionalRuntimeProfile(profile: string): string {
  switch (profile) {
    case "light":
    case "minimal":
      return "light"
    case "standard":
      return "standard"
    case "full":
      return "full"
    default:
      return profile || "standard"
  }
}

export function formatOptionalRuntimeStatus(data: OptionalRuntimeStatusData): string[] {
  const lines: string[] = []
  lines.push("")
  lines.push(`${OPTIONAL_RUNTIME_DISPLAY_NAME} Status`)
  lines.push("=".repeat(OPTIONAL_RUNTIME_DISPLAY_NAME.length + 7))
  lines.push(`Profile:     ${displayOptionalRuntimeProfile(data.profile)}`)
  lines.push(`Compaction:  ${data.compaction}`)
  lines.push(`Hooks:       ${data.activeHooks} active / ${data.availableHooks} available (${data.hookFiles} files)`)
  lines.push(`Skills:      ${data.skillsCount} from ${data.skillsSource}`)
  lines.push(`Agents:      ${data.agentsCount} from ${data.agentsSource}`)
  lines.push(`Legacy cmds: ${data.legacyCommandsCount} still in ${data.legacyCommandsSource}`)
  lines.push(`Commands:    ${data.userCommandsCount} user, ${data.userAgentCommandsCount} agent-backed, ${data.internalCommandsCount} internal`)
  lines.push(`Memories:    ${data.memoryCount} entries`)
  lines.push(`Learnings:   ${data.learningsCount} entries`)
  lines.push(`Config:      ${data.configLabel}`)
  lines.push("")
  lines.push(data.packsLabel)

  lines.push("")
  lines.push("Attachment")
  if (data.attachment.attached) {
    lines.push(`  Attached:     ✓ (${data.attachment.attachedDate})`)
    lines.push(
      `  Artifacts:    ${data.attachment.artifactCount} total (${data.attachment.runtimeArtifactCount} runtime, ${data.attachment.adapterArtifactCount} adapter, ${data.attachment.durableArtifactCount} durable)`,
    )
    lines.push(`  Directories:  ${data.attachment.trackedDirectories} tracked`)
    lines.push(`  Detach:       ${OPTIONAL_RUNTIME_PREFERRED_CLI} detach . --dry-run`)
  } else {
    lines.push(`  Attached:     ✗ (no manifest — use \`${OPTIONAL_RUNTIME_PREFERRED_CLI} attach .\` to create one)`)
  }

  lines.push("")
  lines.push("Security")
  lines.push("  Env protection:      ✓ (always active)")
  lines.push("  Injection guard:     ✓ (always active)")
  lines.push(`  Path sandbox:        ${data.sandboxLabel}`)
  lines.push(`  Stale file guard:    ${data.staleFileGuardLabel}`)
  lines.push("  Dangerous cmd block: ✓ (always active)")
  lines.push("")
  return lines
}
