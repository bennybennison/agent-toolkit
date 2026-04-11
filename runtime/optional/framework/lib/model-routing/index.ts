/**
 * Model Routing — Public API
 *
 * Barrel export for the model routing system.
 * Consumers should import from this module rather than
 * reaching into individual files.
 */

// Providers
export {
  type ProviderType,
  type TransportType,
  type ProviderDefinition,
  type ProviderId,
  PROVIDER_IDS,
  DEFAULT_PROVIDERS,
  getProvider,
  listProviders,
  isProviderEnabled,
  getEnabledProviders,
} from "./providers"

// Models
export {
  type ModelAvailability,
  type ModelTier,
  type StrengthRating,
  type LatencyTier,
  type CostTier,
  type ModelDefinition,
  type ModelId,
  MODEL_IDS,
  DEFAULT_MODELS,
  getModel,
  listModels,
  getModelsByProvider,
  getModelsByAvailability,
  getModelsByTier,
} from "./models"

// Profiles
export {
  type AgentRole,
  type ModelProfileId,
  type ModelProfile,
  DEFAULT_PROFILES,
  AGENT_ROLES,
  getProfile,
  listProfiles,
  getProfileForAgent,
  isValidAgentRole,
} from "./profiles"

// Modes
export {
  type Mode,
  type NetworkDimension,
  type ModePolicy,
  DEFAULT_MODE_POLICIES,
  getModePolicy,
  getNetworkDimension,
  isProviderAllowedByMode,
  isModelAllowedByMode,
  isValidMode,
} from "./modes"

// Resolver
export {
  type ResolvedModel,
  type ResolutionErrorCode,
  type ResolutionError,
  type ResolutionSuccess,
  type ResolutionResult,
  type ResolverOverrides,
  resolveModel,
  resolveForAgent,
} from "./resolver"

// Validation
export {
  type ValidationSeverity,
  type ValidationIssue,
  type ValidationResult,
  type ProviderDiagnostic,
  type ModelDiagnostic,
  type ProfileDiagnostic,
  type DiagnosticReport,
  type AgentProfileConsistency,
  validateModelConfig,
  diagnoseModelRouting,
  validateAgentProfileConsistency,
} from "./validation"
