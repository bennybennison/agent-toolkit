/**
 * Runtime Model Resolver
 *
 * Takes an agent's model profile ID, the active execution mode,
 * and optional overrides, then returns a fully resolved concrete
 * model configuration. Applies mode policy, provider enablement
 * checks, and ordered fallback logic.
 *
 * Resolution rules:
 *   1. Look up preferred model for the active mode
 *   2. Validate provider is enabled and allowed by mode
 *   3. If invalid, iterate fallbacks in order (same checks)
 *   4. Never silently violate offline mode
 *   5. Fail clearly if no valid model is available
 */

import type { ProviderDefinition } from "./providers"
import { getProvider } from "./providers"
import type { ModelDefinition } from "./models"
import { getModel } from "./models"
import type { ModelProfile } from "./profiles"
import { getProfile, type AgentRole } from "./profiles"
import type { Mode } from "./modes"
import { getNetworkDimension, isProviderAllowedByMode, isModelAllowedByMode } from "./modes"

// ── Types ────────────────────────────────────────────────────────────────────

export interface ResolvedModel {
  readonly modelId: string
  readonly providerId: string
  readonly providerModelName: string
  readonly transport: string
  readonly baseUrl?: string
}

export type ResolutionErrorCode =
  | "profile_not_found"
  | "model_not_found"
  | "provider_not_found"
  | "provider_disabled"
  | "mode_violation"
  | "no_valid_model"

export interface ResolutionError {
  readonly ok: false
  readonly code: ResolutionErrorCode
  readonly message: string
  readonly profileId?: string
  readonly mode?: Mode
}

export interface ResolutionSuccess {
  readonly ok: true
  readonly model: ResolvedModel
  readonly usedFallback: boolean
}

export type ResolutionResult = ResolutionSuccess | ResolutionError

export interface ResolverOverrides {
  providerOverrides?: Record<string, Partial<ProviderDefinition>>
  profileOverrides?: Record<string, Partial<ModelProfile>>
}

// ── Resolver ─────────────────────────────────────────────────────────────────

type TryResult =
  | { ok: true; model: ResolvedModel }
  | { ok: false; code: ResolutionErrorCode; message: string }

function tryResolveModel(
  modelId: string,
  mode: Mode,
  providerOverrides?: Record<string, Partial<ProviderDefinition>>,
): TryResult {
  const model = getModel(modelId)
  if (!model) {
    return { ok: false, code: "model_not_found", message: `Model "${modelId}" not found in catalog` }
  }

  const provider = getProvider(model.providerId, providerOverrides)
  if (!provider) {
    return { ok: false, code: "provider_not_found", message: `Provider "${model.providerId}" not found for model "${modelId}"` }
  }

  if (!provider.enabled) {
    return { ok: false, code: "provider_disabled", message: `Provider "${provider.id}" is disabled` }
  }

  if (!isProviderAllowedByMode(provider, mode)) {
    return { ok: false, code: "mode_violation", message: `Provider "${provider.id}" (${provider.type}) not allowed in "${mode}" mode` }
  }

  if (!isModelAllowedByMode(model, mode)) {
    return { ok: false, code: "mode_violation", message: `Model "${modelId}" (availability: ${model.availability}) not allowed in "${mode}" mode` }
  }

  return {
    ok: true,
    model: {
      modelId: model.id,
      providerId: provider.id,
      providerModelName: model.providerModelName,
      transport: provider.transport,
      baseUrl: provider.baseUrl,
    },
  }
}

/**
 * Resolve a concrete model from a profile ID and execution mode.
 * Tries the preferred model first, then falls back through the
 * profile's fallback list. Returns a clear error if nothing works.
 */
export function resolveModel(
  profileId: string,
  mode: Mode,
  overrides?: ResolverOverrides,
): ResolutionResult {
  // Apply profile overrides if present
  let profile: ModelProfile | undefined
  if (overrides?.profileOverrides?.[profileId]) {
    const base = getProfile(profileId)
    if (!base) {
      return { ok: false, code: "profile_not_found", message: `Model profile "${profileId}" not found`, profileId, mode }
    }
    const overlay = overrides.profileOverrides[profileId]
    profile = {
      ...base,
      ...overlay,
      preferred: { ...base.preferred, ...overlay.preferred },
      fallbacks: overlay.fallbacks ?? base.fallbacks,
    } as ModelProfile
  } else {
    profile = getProfile(profileId)
  }

  if (!profile) {
    return { ok: false, code: "profile_not_found", message: `Model profile "${profileId}" not found`, profileId, mode }
  }

  // Try preferred model for this mode (map full Mode to network dimension for profile lookup)
  const preferredId = profile.preferred[getNetworkDimension(mode)]
  if (preferredId) {
    const result = tryResolveModel(preferredId, mode, overrides?.providerOverrides)
    if (result.ok) {
      return { ok: true, model: result.model, usedFallback: false }
    }
  }

  // Try fallbacks in order
  for (const fallbackId of profile.fallbacks) {
    const result = tryResolveModel(fallbackId, mode, overrides?.providerOverrides)
    if (result.ok) {
      return { ok: true, model: result.model, usedFallback: true }
    }
  }

  return {
    ok: false,
    code: "no_valid_model",
    message: `No valid model found for profile "${profileId}" in "${mode}" mode. ` +
      `Preferred: "${preferredId}", fallbacks: [${profile.fallbacks.join(", ")}]`,
    profileId,
    mode,
  }
}

/**
 * Convenience wrapper: resolve a model for a named agent role.
 * Derives the profile ID as "<role>.default".
 */
export function resolveForAgent(
  role: AgentRole,
  mode: Mode,
  overrides?: ResolverOverrides,
): ResolutionResult {
  return resolveModel(`${role}.default`, mode, overrides)
}
