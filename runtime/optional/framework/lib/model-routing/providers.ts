/**
 * Provider Registry
 *
 * Defines model backend providers (cloud and local) with stable IDs.
 * Provider definitions live here as the single source of truth —
 * no other module should hardcode provider details.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type ProviderType = "cloud" | "local"

export type TransportType = "openai_api" | "anthropic_api" | "openai_compatible"

export interface ProviderDefinition {
  readonly id: string
  readonly name: string
  readonly type: ProviderType
  readonly transport: TransportType
  readonly baseUrl?: string
  readonly authEnvVar?: string
  enabled: boolean
}

// ── Stable Provider IDs ──────────────────────────────────────────────────────

export const PROVIDER_IDS = {
  github_copilot: "github_copilot",
  openai: "openai",
  anthropic: "anthropic",
  ollama: "ollama",
  lm_studio: "lm_studio",
} as const

export type ProviderId = (typeof PROVIDER_IDS)[keyof typeof PROVIDER_IDS]

// ── Default Provider Registry ────────────────────────────────────────────────

export const DEFAULT_PROVIDERS: Record<ProviderId, ProviderDefinition> = {
  github_copilot: {
    id: PROVIDER_IDS.github_copilot,
    name: "GitHub Copilot",
    type: "cloud",
    transport: "openai_api",
    authEnvVar: "GITHUB_TOKEN",
    enabled: true,
  },
  openai: {
    id: PROVIDER_IDS.openai,
    name: "OpenAI",
    type: "cloud",
    transport: "openai_api",
    baseUrl: "https://api.openai.com/v1",
    authEnvVar: "OPENAI_API_KEY",
    enabled: true,
  },
  anthropic: {
    id: PROVIDER_IDS.anthropic,
    name: "Anthropic",
    type: "cloud",
    transport: "anthropic_api",
    baseUrl: "https://api.anthropic.com",
    authEnvVar: "ANTHROPIC_API_KEY",
    enabled: true,
  },
  ollama: {
    id: PROVIDER_IDS.ollama,
    name: "Ollama",
    type: "local",
    transport: "openai_compatible",
    baseUrl: "http://127.0.0.1:11434/v1",
    enabled: true,
  },
  lm_studio: {
    id: PROVIDER_IDS.lm_studio,
    name: "LM Studio",
    type: "local",
    transport: "openai_compatible",
    baseUrl: "http://127.0.0.1:1234/v1",
    enabled: false,
  },
}

// ── Registry Functions ───────────────────────────────────────────────────────

export function getProvider(
  id: string,
  overrides?: Record<string, Partial<ProviderDefinition>>,
): ProviderDefinition | undefined {
  const base = DEFAULT_PROVIDERS[id as ProviderId]
  if (!base) return undefined
  const overlay = overrides?.[id]
  if (!overlay) return base
  return { ...base, ...overlay }
}

export function listProviders(
  overrides?: Record<string, Partial<ProviderDefinition>>,
): ProviderDefinition[] {
  return Object.keys(DEFAULT_PROVIDERS).map(
    (id) => getProvider(id, overrides)!,
  )
}

export function isProviderEnabled(
  id: string,
  overrides?: Record<string, Partial<ProviderDefinition>>,
): boolean {
  const provider = getProvider(id, overrides)
  return provider?.enabled ?? false
}

export function getEnabledProviders(
  overrides?: Record<string, Partial<ProviderDefinition>>,
): ProviderDefinition[] {
  return listProviders(overrides).filter((p) => p.enabled)
}
