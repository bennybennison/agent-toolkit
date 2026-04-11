/**
 * Model Catalog
 *
 * Typed catalog of available models with stable internal IDs.
 * Each model references a provider ID from the provider registry.
 * Model IDs follow the pattern: <provider>.<shortname>
 *
 * This is the single source of truth for model capabilities —
 * no other module should embed provider-specific model names.
 */

import type { ProviderId } from "./providers"
import { PROVIDER_IDS } from "./providers"

// ── Types ────────────────────────────────────────────────────────────────────

export type ModelAvailability = "online" | "offline" | "both"

export type ModelTier = "free" | "standard" | "premium" | "ultra"

export type StrengthRating = 1 | 2 | 3 | 4 | 5

export type LatencyTier = "fast" | "medium" | "slow"

export type CostTier = "free" | "low" | "standard" | "premium" | "ultra"

export interface ModelDefinition {
  readonly id: string
  readonly providerId: ProviderId
  /** The model name the provider API expects (e.g. "claude-sonnet-4.6") */
  readonly providerModelName: string
  readonly family: string
  readonly tier: ModelTier
  readonly reasoning: StrengthRating
  readonly coding: StrengthRating
  readonly latency: LatencyTier
  readonly cost: CostTier
  readonly supportsTools: boolean
  readonly supportsStructuredOutput: boolean
  readonly availability: ModelAvailability
}

// ── Stable Model IDs ─────────────────────────────────────────────────────────

export const MODEL_IDS = {
  // GitHub Copilot (cloud) — free tier
  github_copilot_gemini3_flash: "github_copilot.gemini3_flash",
  github_copilot_haiku45: "github_copilot.haiku45",
  // GitHub Copilot (cloud) — standard tier
  github_copilot_sonnet46: "github_copilot.sonnet46",
  github_copilot_gpt41: "github_copilot.gpt41",
  github_copilot_gpt5: "github_copilot.gpt5",
  github_copilot_gemini25_pro: "github_copilot.gemini25_pro",
  // GitHub Copilot (cloud) — premium tier
  github_copilot_opus46: "github_copilot.opus46",
  // GitHub Copilot (cloud) — ultra tier
  github_copilot_opus45: "github_copilot.opus45",

  // OpenAI (cloud)
  openai_gpt51_codex: "openai.gpt51_codex",
  openai_gpt52_codex: "openai.gpt52_codex",
  openai_codex_mini: "openai.codex_mini",

  // Ollama (local)
  ollama_qwen25_coder_14b: "ollama.qwen25_coder_14b",
  ollama_deepseek_r1_14b: "ollama.deepseek_r1_14b",
  ollama_qwen3_coder_30b: "ollama.qwen3_coder_30b",
} as const

export type ModelId = (typeof MODEL_IDS)[keyof typeof MODEL_IDS]

// ── Default Model Catalog ────────────────────────────────────────────────────

export const DEFAULT_MODELS: Record<ModelId, ModelDefinition> = {
  // ── GitHub Copilot: Free tier ──
  [MODEL_IDS.github_copilot_gemini3_flash]: {
    id: MODEL_IDS.github_copilot_gemini3_flash,
    providerId: PROVIDER_IDS.github_copilot,
    providerModelName: "gemini-3-flash",
    family: "gemini",
    tier: "free",
    reasoning: 2,
    coding: 2,
    latency: "fast",
    cost: "free",
    supportsTools: true,
    supportsStructuredOutput: true,
    availability: "online",
  },
  [MODEL_IDS.github_copilot_haiku45]: {
    id: MODEL_IDS.github_copilot_haiku45,
    providerId: PROVIDER_IDS.github_copilot,
    providerModelName: "claude-haiku-4.5",
    family: "claude",
    tier: "free",
    reasoning: 2,
    coding: 3,
    latency: "fast",
    cost: "free",
    supportsTools: true,
    supportsStructuredOutput: true,
    availability: "online",
  },

  // ── GitHub Copilot: Standard tier ──
  [MODEL_IDS.github_copilot_sonnet46]: {
    id: MODEL_IDS.github_copilot_sonnet46,
    providerId: PROVIDER_IDS.github_copilot,
    providerModelName: "claude-sonnet-4.6",
    family: "claude",
    tier: "standard",
    reasoning: 4,
    coding: 4,
    latency: "medium",
    cost: "standard",
    supportsTools: true,
    supportsStructuredOutput: true,
    availability: "online",
  },
  [MODEL_IDS.github_copilot_gpt41]: {
    id: MODEL_IDS.github_copilot_gpt41,
    providerId: PROVIDER_IDS.github_copilot,
    providerModelName: "gpt-4.1",
    family: "gpt",
    tier: "standard",
    reasoning: 3,
    coding: 4,
    latency: "medium",
    cost: "standard",
    supportsTools: true,
    supportsStructuredOutput: true,
    availability: "online",
  },
  [MODEL_IDS.github_copilot_gpt5]: {
    id: MODEL_IDS.github_copilot_gpt5,
    providerId: PROVIDER_IDS.github_copilot,
    providerModelName: "gpt-5",
    family: "gpt",
    tier: "standard",
    reasoning: 4,
    coding: 4,
    latency: "medium",
    cost: "standard",
    supportsTools: true,
    supportsStructuredOutput: true,
    availability: "online",
  },
  [MODEL_IDS.github_copilot_gemini25_pro]: {
    id: MODEL_IDS.github_copilot_gemini25_pro,
    providerId: PROVIDER_IDS.github_copilot,
    providerModelName: "gemini-2.5-pro",
    family: "gemini",
    tier: "standard",
    reasoning: 4,
    coding: 3,
    latency: "medium",
    cost: "standard",
    supportsTools: true,
    supportsStructuredOutput: true,
    availability: "online",
  },

  // ── GitHub Copilot: Premium tier ──
  [MODEL_IDS.github_copilot_opus46]: {
    id: MODEL_IDS.github_copilot_opus46,
    providerId: PROVIDER_IDS.github_copilot,
    providerModelName: "claude-opus-4.6",
    family: "claude",
    tier: "premium",
    reasoning: 5,
    coding: 5,
    latency: "slow",
    cost: "premium",
    supportsTools: true,
    supportsStructuredOutput: true,
    availability: "online",
  },

  // ── GitHub Copilot: Ultra tier ──
  [MODEL_IDS.github_copilot_opus45]: {
    id: MODEL_IDS.github_copilot_opus45,
    providerId: PROVIDER_IDS.github_copilot,
    providerModelName: "claude-opus-4.5",
    family: "claude",
    tier: "ultra",
    reasoning: 5,
    coding: 5,
    latency: "slow",
    cost: "ultra",
    supportsTools: true,
    supportsStructuredOutput: true,
    availability: "online",
  },

  // ── OpenAI (direct) ──
  [MODEL_IDS.openai_gpt51_codex]: {
    id: MODEL_IDS.openai_gpt51_codex,
    providerId: PROVIDER_IDS.openai,
    providerModelName: "gpt-5.1-codex",
    family: "gpt",
    tier: "standard",
    reasoning: 4,
    coding: 5,
    latency: "medium",
    cost: "standard",
    supportsTools: true,
    supportsStructuredOutput: true,
    availability: "online",
  },
  [MODEL_IDS.openai_gpt52_codex]: {
    id: MODEL_IDS.openai_gpt52_codex,
    providerId: PROVIDER_IDS.openai,
    providerModelName: "gpt-5.2-codex",
    family: "gpt",
    tier: "premium",
    reasoning: 5,
    coding: 5,
    latency: "medium",
    cost: "premium",
    supportsTools: true,
    supportsStructuredOutput: true,
    availability: "online",
  },
  [MODEL_IDS.openai_codex_mini]: {
    id: MODEL_IDS.openai_codex_mini,
    providerId: PROVIDER_IDS.openai,
    providerModelName: "codex-mini",
    family: "gpt",
    tier: "free",
    reasoning: 2,
    coding: 3,
    latency: "fast",
    cost: "low",
    supportsTools: true,
    supportsStructuredOutput: true,
    availability: "online",
  },

  // ── Ollama (local) ──
  [MODEL_IDS.ollama_qwen25_coder_14b]: {
    id: MODEL_IDS.ollama_qwen25_coder_14b,
    providerId: PROVIDER_IDS.ollama,
    providerModelName: "qwen2.5-coder:14b",
    family: "qwen",
    tier: "standard",
    reasoning: 3,
    coding: 4,
    latency: "medium",
    cost: "free",
    supportsTools: false,
    supportsStructuredOutput: true,
    availability: "offline",
  },
  [MODEL_IDS.ollama_deepseek_r1_14b]: {
    id: MODEL_IDS.ollama_deepseek_r1_14b,
    providerId: PROVIDER_IDS.ollama,
    providerModelName: "deepseek-r1:14b",
    family: "deepseek",
    tier: "standard",
    reasoning: 4,
    coding: 3,
    latency: "medium",
    cost: "free",
    supportsTools: false,
    supportsStructuredOutput: true,
    availability: "offline",
  },
  [MODEL_IDS.ollama_qwen3_coder_30b]: {
    id: MODEL_IDS.ollama_qwen3_coder_30b,
    providerId: PROVIDER_IDS.ollama,
    providerModelName: "qwen3-coder:30b",
    family: "qwen",
    tier: "premium",
    reasoning: 4,
    coding: 5,
    latency: "slow",
    cost: "free",
    supportsTools: false,
    supportsStructuredOutput: true,
    availability: "offline",
  },
}

// ── Catalog Functions ────────────────────────────────────────────────────────

export function getModel(id: string): ModelDefinition | undefined {
  return DEFAULT_MODELS[id as ModelId]
}

export function listModels(): ModelDefinition[] {
  return Object.values(DEFAULT_MODELS)
}

export function getModelsByProvider(providerId: string): ModelDefinition[] {
  return listModels().filter((m) => m.providerId === providerId)
}

export function getModelsByAvailability(availability: ModelAvailability): ModelDefinition[] {
  return listModels().filter(
    (m) => m.availability === availability || m.availability === "both",
  )
}

export function getModelsByTier(tier: ModelTier): ModelDefinition[] {
  return listModels().filter((m) => m.tier === tier)
}
