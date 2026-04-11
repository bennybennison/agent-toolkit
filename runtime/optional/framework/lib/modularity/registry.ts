import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { ModuleDescriptor } from "./contracts"

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function isModuleDescriptor(value: unknown): value is ModuleDescriptor {
  if (typeof value !== "object" || value === null) return false
  const mod = value as Record<string, unknown>
  return (
    typeof mod.module_id === "string" &&
    typeof mod.layer === "string" &&
    typeof mod.version === "string" &&
    isStringArray(mod.provides) &&
    isStringArray(mod.depends_on) &&
    typeof mod.config_schema_version === "number" &&
    isStringArray(mod.feature_flags) &&
    Array.isArray(mod.lifecycle_hooks) &&
    typeof mod.health_contract === "object" &&
    mod.health_contract !== null &&
    typeof (mod.health_contract as any).severity === "string" &&
    isStringArray((mod.health_contract as any).required_checks) &&
    typeof mod.replacement_policy === "string"
  )
}

export function loadModuleDescriptors(projectRoot: string, registryPath: string): ModuleDescriptor[] {
  const fullPath = join(projectRoot, registryPath)
  if (!existsSync(fullPath)) return []

  const files = readdirSync(fullPath).filter((name) => name.endsWith(".json"))
  const descriptors: ModuleDescriptor[] = []

  for (const fileName of files) {
    const filePath = join(fullPath, fileName)
    try {
      const raw = readFileSync(filePath, "utf8")
      const parsed = JSON.parse(raw)
      if (isModuleDescriptor(parsed)) descriptors.push(parsed)
    } catch {
      // Invalid descriptor files are ignored to keep startup resilient.
    }
  }

  descriptors.sort((a, b) => a.module_id.localeCompare(b.module_id))
  return descriptors
}

export function resolveModuleByInterface(
  descriptors: ModuleDescriptor[],
  interfaceId: string,
): ModuleDescriptor | null {
  for (const descriptor of descriptors) {
    if (descriptor.provides.includes(interfaceId)) return descriptor
  }
  return null
}

export function listProvidedInterfaces(descriptors: ModuleDescriptor[]): string[] {
  const all = new Set<string>()
  for (const descriptor of descriptors) {
    for (const iface of descriptor.provides) all.add(iface)
  }
  return [...all].sort((a, b) => a.localeCompare(b))
}

export function validateRequiredInterfaces(
  descriptors: ModuleDescriptor[],
  requiredInterfaces: string[],
): string[] {
  const provided = new Set(listProvidedInterfaces(descriptors))
  return requiredInterfaces.filter((iface) => !provided.has(iface))
}

export function listModuleDependencyGaps(descriptors: ModuleDescriptor[]): string[] {
  const provided = new Set(listProvidedInterfaces(descriptors))
  const missing: string[] = []

  for (const descriptor of descriptors) {
    for (const dep of descriptor.depends_on) {
      if (!provided.has(dep)) {
        missing.push(`${descriptor.module_id} -> ${dep}`)
      }
    }
  }

  return missing.sort((a, b) => a.localeCompare(b))
}
