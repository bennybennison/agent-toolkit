import type { Plugin } from "@opencode-ai/plugin"

import { CompactionHandlerPlugin } from "../hooks/compaction-handler"
import { CommanderEnforcementPlugin } from "../hooks/commander-enforcement"
import { CommandDispatcherPlugin } from "../hooks/command-dispatcher"
import { SessionStatePlugin } from "../hooks/session-state"
import { EnvProtectionPlugin } from "../hooks/env-protection"
import { CrossSessionMemoryPlugin } from "../hooks/cross-session-memory"
import { PromptInjectionGuardPlugin } from "../hooks/prompt-injection-guard"
import { DeleteCheckpointPlugin } from "../hooks/delete-checkpoint"
import { ShadowRootPlugin } from "../hooks/shadow-root"
import { IntegratorGatePlugin } from "../hooks/integrator-gate"
import { RepeatedReadGuardPlugin } from "../hooks/repeated-read-guard"
import { StrategicReadGuardPlugin } from "../hooks/strategic-read-guard"
import { WriteGuardPlugin } from "../hooks/write-guard"
import { StaleFileGuardPlugin } from "../hooks/stale-file-guard"
import { ContextMonitorPlugin } from "../hooks/context-monitor"
import { ModelFallbackPlugin } from "../hooks/model-fallback"
import { NotificationPlugin } from "../hooks/notification"
import { ToolOutputTruncatorPlugin } from "../hooks/tool-output-truncator"

// Language-specific hooks moved to packs (quality-python, quality-comments).
// They still exist in runtime/hooks/ for backward compatibility but are no
// longer registered in the core HOOK_REGISTRY. The pack resolver adds them
// when the corresponding pack is active.
import { PythonLintPlugin } from "../hooks/python-lint"
import { PythonTypeCheckPlugin } from "../hooks/python-typecheck"
import { CommentCheckerPlugin } from "../hooks/comment-checker"

export type HookProfile = "minimal" | "light" | "standard" | "full"

export type HookDefinition = {
  id: string
  moduleId: string
  minProfile: HookProfile
  plugin: Plugin
}

export const HOOK_REGISTRY: HookDefinition[] = [
  { id: "compaction-handler", moduleId: "hook.compaction-handler", minProfile: "minimal", plugin: CompactionHandlerPlugin },
  { id: "commander-enforcement", moduleId: "hook.commander-enforcement", minProfile: "minimal", plugin: CommanderEnforcementPlugin },
  { id: "command-dispatcher", moduleId: "hook.command-dispatcher", minProfile: "minimal", plugin: CommandDispatcherPlugin },
  { id: "session-state", moduleId: "hook.session-state", minProfile: "minimal", plugin: SessionStatePlugin },
  { id: "env-protection", moduleId: "hook.env-protection", minProfile: "minimal", plugin: EnvProtectionPlugin },
  { id: "cross-session-memory", moduleId: "hook.cross-session-memory", minProfile: "minimal", plugin: CrossSessionMemoryPlugin },
  { id: "prompt-injection-guard", moduleId: "hook.prompt-injection-guard", minProfile: "minimal", plugin: PromptInjectionGuardPlugin },
  { id: "delete-checkpoint", moduleId: "hook.delete-checkpoint", minProfile: "standard", plugin: DeleteCheckpointPlugin },
  { id: "shadow-root", moduleId: "hook.shadow-root", minProfile: "standard", plugin: ShadowRootPlugin },
  { id: "integrator-gate", moduleId: "hook.integrator-gate", minProfile: "standard", plugin: IntegratorGatePlugin },
  { id: "repeated-read-guard", moduleId: "hook.repeated-read-guard", minProfile: "standard", plugin: RepeatedReadGuardPlugin },
  { id: "strategic-read-guard", moduleId: "hook.strategic-read-guard", minProfile: "standard", plugin: StrategicReadGuardPlugin },
  { id: "write-guard", moduleId: "hook.write-guard", minProfile: "standard", plugin: WriteGuardPlugin },
  { id: "stale-file-guard", moduleId: "hook.stale-file-guard", minProfile: "standard", plugin: StaleFileGuardPlugin },
  { id: "context-monitor", moduleId: "hook.context-monitor", minProfile: "standard", plugin: ContextMonitorPlugin },
  { id: "model-fallback", moduleId: "hook.model-fallback", minProfile: "standard", plugin: ModelFallbackPlugin },
  { id: "notification", moduleId: "hook.notification", minProfile: "standard", plugin: NotificationPlugin },
  { id: "tool-output-truncator", moduleId: "hook.tool-output-truncator", minProfile: "full", plugin: ToolOutputTruncatorPlugin },
]

/**
 * Pack-provided hooks — available for dynamic registration when their pack is active.
 * These are NOT in HOOK_REGISTRY and won't load unless the pack resolver includes them.
 */
export const PACK_HOOKS: Record<string, HookDefinition> = {
  "python-lint": { id: "python-lint", moduleId: "hook.python-lint", minProfile: "standard", plugin: PythonLintPlugin },
  "python-typecheck": { id: "python-typecheck", moduleId: "hook.python-typecheck", minProfile: "standard", plugin: PythonTypeCheckPlugin },
  "comment-checker": { id: "comment-checker", moduleId: "hook.comment-checker", minProfile: "full", plugin: CommentCheckerPlugin },
}

function profileRank(profile: HookProfile): number {
  if (profile === "minimal" || profile === "light") return 1
  if (profile === "standard") return 2
  return 3
}

export function getActiveHookDefinitions(
  profile: HookProfile,
  isModuleEnabled: (moduleId: string, defaultValue?: boolean) => boolean,
): HookDefinition[] {
  const current = profileRank(profile)
  return HOOK_REGISTRY.filter((hook) => {
    return profileRank(hook.minProfile) <= current && isModuleEnabled(hook.moduleId, true)
  })
}
