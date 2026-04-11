/**
 * Agent Model Profiles
 *
 * Maps agent roles to model preferences per execution mode.
 * Agents reference a profile ID (e.g., "mapper.default") rather
 * than embedding raw model strings. The resolver uses these
 * profiles to pick the concrete model at runtime.
 */

import { MODEL_IDS, type ModelId } from "./models"
import type { NetworkDimension } from "./modes"

// ── Types ────────────────────────────────────────────────────────────────────

export type AgentRole =
  | "session-manager"
  | "orchestrator"
  | "mapper"
  | "builder"
  | "auditor"
  | "verifier"
  | "tdd-runner"
  | "architect"
  | "audit-planner"
  | "researcher"
  | "code-reviewer"
  | "build-fixer"
  | "cleanup"

export type ModelProfileId = `${AgentRole}.default`

export interface ModelProfile {
  readonly id: ModelProfileId
  readonly preferred: Record<NetworkDimension, ModelId>
  readonly fallbacks: readonly ModelId[]
}

// ── Default Profiles ─────────────────────────────────────────────────────────

const M = MODEL_IDS

export const DEFAULT_PROFILES: Record<ModelProfileId, ModelProfile> = {
  // ── Standard-tier agents (1x) ──
  "session-manager.default": {
    id: "session-manager.default",
    preferred: {
      online: M.github_copilot_sonnet46,
      offline: M.ollama_qwen25_coder_14b,
      hybrid: M.github_copilot_sonnet46,
    },
    fallbacks: [M.github_copilot_gpt41, M.ollama_deepseek_r1_14b],
  },
  "orchestrator.default": {
    id: "orchestrator.default",
    preferred: {
      online: M.github_copilot_sonnet46,
      offline: M.ollama_qwen3_coder_30b,
      hybrid: M.github_copilot_sonnet46,
    },
    fallbacks: [M.github_copilot_gpt5, M.ollama_qwen25_coder_14b],
  },
  "mapper.default": {
    id: "mapper.default",
    preferred: {
      online: M.github_copilot_sonnet46,
      offline: M.ollama_qwen25_coder_14b,
      hybrid: M.github_copilot_sonnet46,
    },
    fallbacks: [M.github_copilot_gpt41, M.ollama_qwen3_coder_30b],
  },
  "builder.default": {
    id: "builder.default",
    preferred: {
      online: M.github_copilot_sonnet46,
      offline: M.ollama_qwen3_coder_30b,
      hybrid: M.github_copilot_sonnet46,
    },
    fallbacks: [M.github_copilot_gpt5, M.ollama_qwen25_coder_14b],
  },
  "auditor.default": {
    id: "auditor.default",
    preferred: {
      online: M.github_copilot_sonnet46,
      offline: M.ollama_deepseek_r1_14b,
      hybrid: M.github_copilot_sonnet46,
    },
    fallbacks: [M.github_copilot_gpt41, M.ollama_qwen25_coder_14b],
  },
  "verifier.default": {
    id: "verifier.default",
    preferred: {
      online: M.github_copilot_sonnet46,
      offline: M.ollama_qwen25_coder_14b,
      hybrid: M.github_copilot_sonnet46,
    },
    fallbacks: [M.github_copilot_gemini3_flash, M.ollama_deepseek_r1_14b],
  },
  "tdd-runner.default": {
    id: "tdd-runner.default",
    preferred: {
      online: M.github_copilot_sonnet46,
      offline: M.ollama_qwen3_coder_30b,
      hybrid: M.github_copilot_sonnet46,
    },
    fallbacks: [M.github_copilot_gpt41, M.ollama_qwen25_coder_14b],
  },
  "code-reviewer.default": {
    id: "code-reviewer.default",
    preferred: {
      online: M.github_copilot_sonnet46,
      offline: M.ollama_deepseek_r1_14b,
      hybrid: M.github_copilot_sonnet46,
    },
    fallbacks: [M.github_copilot_gpt41, M.ollama_qwen25_coder_14b],
  },
  "build-fixer.default": {
    id: "build-fixer.default",
    preferred: {
      online: M.github_copilot_sonnet46,
      offline: M.ollama_qwen25_coder_14b,
      hybrid: M.github_copilot_sonnet46,
    },
    fallbacks: [M.github_copilot_gpt41, M.ollama_qwen3_coder_30b],
  },
  "audit-planner.default": {
    id: "audit-planner.default",
    preferred: {
      online: M.github_copilot_sonnet46,
      offline: M.ollama_deepseek_r1_14b,
      hybrid: M.github_copilot_sonnet46,
    },
    fallbacks: [M.github_copilot_gpt5, M.ollama_qwen3_coder_30b],
  },
  "researcher.default": {
    id: "researcher.default",
    preferred: {
      online: M.github_copilot_sonnet46,
      offline: M.ollama_deepseek_r1_14b,
      hybrid: M.github_copilot_sonnet46,
    },
    fallbacks: [M.github_copilot_gpt41, M.ollama_qwen25_coder_14b],
  },

  // ── Free-tier agent (0.33x) ──
  "cleanup.default": {
    id: "cleanup.default",
    preferred: {
      online: M.github_copilot_gemini3_flash,
      offline: M.ollama_qwen25_coder_14b,
      hybrid: M.github_copilot_gemini3_flash,
    },
    fallbacks: [M.github_copilot_haiku45, M.ollama_deepseek_r1_14b],
  },

  // ── Premium-tier agent (3x) ──
  "architect.default": {
    id: "architect.default",
    preferred: {
      online: M.github_copilot_opus46,
      offline: M.ollama_qwen3_coder_30b,
      hybrid: M.github_copilot_opus46,
    },
    fallbacks: [M.github_copilot_sonnet46, M.ollama_deepseek_r1_14b],
  },
}

// ── Profile Functions ────────────────────────────────────────────────────────

export function getProfile(id: string): ModelProfile | undefined {
  return DEFAULT_PROFILES[id as ModelProfileId]
}

export function listProfiles(): ModelProfile[] {
  return Object.values(DEFAULT_PROFILES)
}

export function getProfileForAgent(role: AgentRole): ModelProfile | undefined {
  return getProfile(`${role}.default`)
}

export const AGENT_ROLES: readonly AgentRole[] = [
  "session-manager", "orchestrator",
  "mapper", "builder", "auditor", "verifier", "tdd-runner",
  "architect", "audit-planner", "researcher", "code-reviewer",
  "build-fixer", "cleanup",
]

export function isValidAgentRole(value: string): value is AgentRole {
  return AGENT_ROLES.includes(value as AgentRole)
}
