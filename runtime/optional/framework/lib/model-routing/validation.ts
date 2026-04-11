/**
 * Model Routing Validation & Diagnostics
 *
 * Validates that all model routing configuration is internally
 * consistent: profile references exist, provider references exist,
 * mode constraints are satisfiable. Also provides structured
 * diagnostics for developer inspection.
 */

import { DEFAULT_PROVIDERS, getProvider, type ProviderDefinition } from "./providers"
import { DEFAULT_MODELS, getModel } from "./models"
import { DEFAULT_PROFILES, listProfiles, type ModelProfile, type ModelProfileId, AGENT_ROLES, type AgentRole } from "./profiles"
import type { NetworkDimension } from "./modes"
import { isProviderAllowedByMode, isModelAllowedByMode } from "./modes"
import { resolveModel, type ResolverOverrides, type ResolutionResult } from "./resolver"

// ── Types ────────────────────────────────────────────────────────────────────

export type ValidationSeverity = "error" | "warning"

export interface ValidationIssue {
  readonly severity: ValidationSeverity
  readonly code: string
  readonly message: string
}

export interface ValidationResult {
  readonly valid: boolean
  readonly errors: ValidationIssue[]
  readonly warnings: ValidationIssue[]
}

export interface ProviderDiagnostic {
  readonly id: string
  readonly name: string
  readonly type: string
  readonly transport: string
  readonly enabled: boolean
}

export interface ModelDiagnostic {
  readonly id: string
  readonly providerId: string
  readonly providerModelName: string
  readonly tier: string
  readonly availability: string
  readonly providerEnabled: boolean
}

export interface ProfileDiagnostic {
  readonly id: string
  readonly resolutions: Record<NetworkDimension, ResolutionResult>
}

export interface DiagnosticReport {
  readonly providers: ProviderDiagnostic[]
  readonly models: ModelDiagnostic[]
  readonly profiles: ProfileDiagnostic[]
}

// ── Validation ───────────────────────────────────────────────────────────────

export function validateModelConfig(
  overrides?: ResolverOverrides,
): ValidationResult {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []

  // Validate all profiles
  for (const profile of listProfiles()) {
    const effectiveProfile = applyProfileOverrides(profile, overrides)

    // Check preferred model references for each mode
    for (const mode of ["online", "offline", "hybrid"] as const) {
      const modelId = effectiveProfile.preferred[mode]
      if (!modelId) {
        errors.push({
          severity: "error",
          code: "missing_preferred",
          message: `Profile "${profile.id}" has no preferred model for "${mode}" mode`,
        })
        continue
      }

      const model = getModel(modelId)
      if (!model) {
        errors.push({
          severity: "error",
          code: "invalid_model_ref",
          message: `Profile "${profile.id}" references unknown model "${modelId}" for "${mode}" mode`,
        })
        continue
      }

      const provider = getProvider(model.providerId, overrides?.providerOverrides)
      if (!provider) {
        errors.push({
          severity: "error",
          code: "invalid_provider_ref",
          message: `Model "${modelId}" references unknown provider "${model.providerId}"`,
        })
        continue
      }

      if (!provider.enabled) {
        warnings.push({
          severity: "warning",
          code: "provider_disabled",
          message: `Profile "${profile.id}" preferred model "${modelId}" uses disabled provider "${provider.id}" for "${mode}" mode`,
        })
      }

      if (!isProviderAllowedByMode(provider, mode)) {
        errors.push({
          severity: "error",
          code: "mode_provider_violation",
          message: `Profile "${profile.id}" preferred model "${modelId}" uses ${provider.type} provider "${provider.id}" which is not allowed in "${mode}" mode`,
        })
      }

      if (!isModelAllowedByMode(model, mode)) {
        errors.push({
          severity: "error",
          code: "mode_availability_violation",
          message: `Profile "${profile.id}" preferred model "${modelId}" has availability "${model.availability}" which is not allowed in "${mode}" mode`,
        })
      }
    }

    // Check fallback model references
    for (const fallbackId of effectiveProfile.fallbacks) {
      const model = getModel(fallbackId)
      if (!model) {
        errors.push({
          severity: "error",
          code: "invalid_fallback_ref",
          message: `Profile "${profile.id}" references unknown fallback model "${fallbackId}"`,
        })
        continue
      }

      const provider = getProvider(model.providerId, overrides?.providerOverrides)
      if (!provider) {
        errors.push({
          severity: "error",
          code: "invalid_provider_ref",
          message: `Fallback model "${fallbackId}" references unknown provider "${model.providerId}"`,
        })
      }
    }

    // Check that at least one model is resolvable per mode
    for (const mode of ["online", "offline", "hybrid"] as const) {
      const result = resolveModel(profile.id, mode, overrides)
      if (!result.ok) {
        warnings.push({
          severity: "warning",
          code: "unresolvable_profile",
          message: `Profile "${profile.id}" cannot resolve any model in "${mode}" mode: ${result.message}`,
        })
      }
    }
  }

  // Check all model provider references
  for (const model of Object.values(DEFAULT_MODELS)) {
    const provider = getProvider(model.providerId, overrides?.providerOverrides)
    if (!provider) {
      errors.push({
        severity: "error",
        code: "orphan_model",
        message: `Model "${model.id}" references unknown provider "${model.providerId}"`,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ── Diagnostics ──────────────────────────────────────────────────────────────

export function diagnoseModelRouting(
  overrides?: ResolverOverrides,
): DiagnosticReport {
  const providers: ProviderDiagnostic[] = Object.values(DEFAULT_PROVIDERS).map((p) => {
    const effective = getProvider(p.id, overrides?.providerOverrides) ?? p
    return {
      id: effective.id,
      name: effective.name,
      type: effective.type,
      transport: effective.transport,
      enabled: effective.enabled,
    }
  })

  const models: ModelDiagnostic[] = Object.values(DEFAULT_MODELS).map((m) => {
    const provider = getProvider(m.providerId, overrides?.providerOverrides)
    return {
      id: m.id,
      providerId: m.providerId,
      providerModelName: m.providerModelName,
      tier: m.tier,
      availability: m.availability,
      providerEnabled: provider?.enabled ?? false,
    }
  })

  const profiles: ProfileDiagnostic[] = listProfiles().map((p) => ({
    id: p.id,
    resolutions: {
      online: resolveModel(p.id, "online", overrides),
      offline: resolveModel(p.id, "offline", overrides),
      hybrid: resolveModel(p.id, "hybrid", overrides),
    },
  }))

  return { providers, models, profiles }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function applyProfileOverrides(
  profile: ModelProfile,
  overrides?: ResolverOverrides,
): ModelProfile {
  const overlay = overrides?.profileOverrides?.[profile.id]
  if (!overlay) return profile
  return {
    ...profile,
    ...overlay,
    preferred: { ...profile.preferred, ...overlay.preferred },
    fallbacks: overlay.fallbacks ?? profile.fallbacks,
  } as ModelProfile
}

// ── Agent/Profile Consistency ────────────────────────────────────────────────

export interface AgentProfileConsistency {
  readonly role: AgentRole
  readonly expectedProfileId: ModelProfileId
  readonly profileExists: boolean
}

/**
 * Validate that every known agent role has a corresponding profile
 * in the profile registry. This catches drift between the agent list
 * and the profiles table.
 */
export function validateAgentProfileConsistency(): {
  valid: boolean
  results: AgentProfileConsistency[]
  missing: AgentProfileConsistency[]
} {
  const results: AgentProfileConsistency[] = AGENT_ROLES.map((role) => {
    const expectedId = `${role}.default` as ModelProfileId
    return {
      role,
      expectedProfileId: expectedId,
      profileExists: expectedId in DEFAULT_PROFILES,
    }
  })
  const missing = results.filter((r) => !r.profileExists)
  return { valid: missing.length === 0, results, missing }
}
