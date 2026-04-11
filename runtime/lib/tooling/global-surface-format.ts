import { type GlobalToolInventory, type GlobalToolInventoryItem } from "./global-surface"

function extractPackId(path: string): string | null {
  const marker = "/packs/"
  const idx = path.indexOf(marker)
  if (idx < 0) return null
  const remainder = path.slice(idx + marker.length)
  const packId = remainder.split("/")[0]
  return packId || null
}

function summarizeInstructionPacks(items: GlobalToolInventoryItem[]): string[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    if (item.kind !== "instruction") continue
    const packId = extractPackId(item.value)
    if (!packId) continue
    counts.set(packId, (counts.get(packId) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([packId, count]) => `${packId} (${count})`)
}

function valuesFor(items: GlobalToolInventoryItem[], kind: GlobalToolInventoryItem["kind"]): string[] {
  return items.filter((item) => item.kind === kind).map((item) => item.value)
}

function formatList(values: string[], prefix = "- "): string[] {
  return values.map((value) => `${prefix}${value}`)
}

function summarizeRegistryDetail(detail?: string): string {
  if (!detail) return ""
  if (detail === "present" || detail === "missing") return detail
  const count = detail.split(",").map((part) => part.trim()).filter(Boolean).length
  return `${count} packs`
}

function formatNextCommands(inventory: GlobalToolInventory, cliCommand: string): string[] {
  return [
    "Next",
    `- show raw selection keys: \`${cliCommand} tools inspect ${inventory.target} --scope global --verbose\``,
    `- cleanup toolkit-managed entries: \`${cliCommand} tools cleanup ${inventory.target} --scope global --mode toolkit\``,
  ]
}

export function formatGlobalToolInventory(
  inventory: GlobalToolInventory,
  cliCommand: string,
  options?: { verbose?: boolean },
): string[] {
  const verbose = options?.verbose ?? false
  const toolkitItems = inventory.items.filter((item) => item.managedByToolkit)
  const externalItems = inventory.items.filter((item) => !item.managedByToolkit)

  if (verbose) {
    const lines = [`Inspecting ${inventory.target} (global) @ ${inventory.rootDir}`]
    if (inventory.items.length === 0) {
      lines.push("No global entries found.")
      return lines
    }
    for (const item of inventory.items) {
      const owner = item.managedByToolkit ? "toolkit" : "external"
      const detail = item.detail ? ` :: ${item.detail}` : ""
      lines.push(`[${owner}] ${item.kind} ${item.key}`)
      lines.push(`  value: ${item.value}`)
      lines.push(`  where: ${item.location}${detail}`)
    }
    return lines
  }

  const toolkitInstructionItems = toolkitItems.filter((item) => item.kind === "instruction")
  const externalInstructionItems = externalItems.filter((item) => item.kind === "instruction")
  const toolkitPacks = summarizeInstructionPacks(toolkitInstructionItems)
  const lines: string[] = [
    `Inspecting ${inventory.target} (global) @ ${inventory.rootDir}`,
    "Overview",
    `- toolkit-managed entries: ${toolkitItems.length}`,
    `- external entries: ${externalItems.length}`,
    `- total entries: ${inventory.items.length}`,
  ]

  if (toolkitItems.length > 0) {
    lines.push("Toolkit")
    const toolkitPlugins = valuesFor(toolkitItems, "plugin").concat(valuesFor(toolkitItems, "marketplace-plugin"))
    const toolkitDependencies = valuesFor(toolkitItems, "dependency")
    const toolkitPluginDirs = valuesFor(toolkitItems, "plugin-dir")
    const toolkitBaselineDirs = valuesFor(toolkitItems, "baseline-dir")
    const toolkitRegistry = toolkitItems.filter((item) => item.kind === "registry-install")

    if (toolkitPlugins.length > 0) lines.push(...formatList(toolkitPlugins.map((value) => `plugins: ${value}`)))
    if (toolkitDependencies.length > 0) lines.push(...formatList(toolkitDependencies.map((value) => `dependencies: ${value}`)))
    if (toolkitInstructionItems.length > 0) {
      lines.push(`- instructions: ${toolkitInstructionItems.length}`)
      if (toolkitPacks.length > 0) {
        lines.push(`- packs: ${toolkitPacks.join(", ")}`)
      }
    }
    if (toolkitPluginDirs.length > 0) lines.push(...formatList(toolkitPluginDirs.map((value) => `plugin dirs: ${value}`)))
    if (toolkitBaselineDirs.length > 0) lines.push(...formatList(toolkitBaselineDirs.map((value) => `baseline dirs: ${value}`)))
    if (toolkitRegistry.length > 0) {
      lines.push(...formatList(toolkitRegistry.map((item) => {
        const summary = summarizeRegistryDetail(item.detail)
        const state = summary ? ` (${summary})` : ""
        return `registry installs: ${item.value}${state}`
      })))
    }
  }

  if (externalItems.length > 0) {
    lines.push("External")
    const externalPlugins = valuesFor(externalItems, "plugin").concat(valuesFor(externalItems, "marketplace-plugin"))
    const externalDependencies = valuesFor(externalItems, "dependency")
    const externalRegistry = externalItems.filter((item) => item.kind === "registry-install")

    if (externalPlugins.length > 0) lines.push(...formatList(externalPlugins.map((value) => `plugins: ${value}`)))
    if (externalDependencies.length > 0) lines.push(...formatList(externalDependencies.map((value) => `dependencies: ${value}`)))
    if (externalInstructionItems.length > 0) {
      lines.push(`- instructions: ${externalInstructionItems.length}`)
      lines.push(...formatList(externalInstructionItems.map((item) => item.value)))
    }
    if (externalRegistry.length > 0) {
      lines.push(...formatList(externalRegistry.map((item) => {
        const summary = summarizeRegistryDetail(item.detail)
        const state = summary ? ` (${summary})` : ""
        return `registry installs: ${item.value}${state}`
      })))
    }
  }

  lines.push(...formatNextCommands(inventory, cliCommand))
  return lines
}
