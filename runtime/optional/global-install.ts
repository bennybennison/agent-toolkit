import { homedir } from "node:os"
import { join } from "node:path"
import type { ToolkitEnvironment } from "../lib/toolkit-environment"
import { resolveToolkitPacks, formatToolkitPackSummary } from "../lib/toolkit-operations"
import { installOpenCodeGlobal, uninstallOpenCodeGlobal } from "../lib/opencode-global-install"
import type { ExecShellFn } from "../lib/optional-runtime-tool-commands"

export function installOptionalRuntimeGlobal(options: {
  toolkitEnv: ToolkitEnvironment
  compatibilityEnv: ToolkitEnvironment
  execShell: ExecShellFn
  runtimeRoot: string
  removeLegacyShortcut?: () => boolean
  log?: (line: string) => void
}): void {
  const log = options.log ?? console.log
  log("Agent Toolkit Runtime — Global Install")
  log("======================================")
  log("")
  log("1. Installing package...")
  const result = installOpenCodeGlobal({
    env: options.compatibilityEnv,
    execShell: options.execShell,
  })
  log("   ✓ Package linked")
  log("")
  log("2. Registering plugin...")
  log(result.pluginAdded ? "   ✓ Added to plugin array" : "   · Already registered")
  log("")
  log("3. Adding instructions...")
  if (result.staleInstructionCount > 0) {
    log(`   ✓ Removed ${result.staleInstructionCount} stale instruction paths`)
  }
  const globalPacks = resolveToolkitPacks(options.toolkitEnv, options.toolkitEnv.opencodeConfigDir, "full")
  log("")
  log(`   Resolved ${globalPacks.length} packs:`)
  log(formatToolkitPackSummary(globalPacks))
  for (const path of result.addedInstructionPaths) {
    log(`   ✓ ${path}`)
  }
  log("")
  log("4. Cleaning old plugin symlinks...")
  log(result.removedLegacySymlinks > 0 ? `   ✓ Removed ${result.removedLegacySymlinks} old symlinks` : "   · No old symlinks found")
  log("")
  log("5. Installing compatibility CLI shortcut...")
  if (result.shortcutInstalled) {
    log(`   ✓ Installed ${result.shortcutPath}`)
  } else {
    log(`   ✗ Could not write to ${result.shortcutPath} — add manually or use: bun ${join(options.runtimeRoot, "bin", "runtime-main.ts")}`)
  }
  if (options.removeLegacyShortcut?.()) {
    log("   ✓ Removed legacy `af` shortcut")
  }
  log("")
  log("✓ Done! Restart OpenCode to load the plugin.")
  log("  Run `hash -r` in your current terminal, then prefer `agent-toolkit runtime` from any directory:")
  log("  agent-toolkit runtime attach . full, agent-toolkit runtime status")
  log("")
  if (result.globalConfigCreated) {
    log(`6. Created global config: ${join(homedir(), ".config", "agent-framework", "config.json")}`)
  }
}

export function uninstallOptionalRuntimeGlobal(options: {
  compatibilityEnv: ToolkitEnvironment
  execShell: ExecShellFn
  removeLegacyShortcut?: () => boolean
  log?: (line: string) => void
}): void {
  const log = options.log ?? console.log
  log("Agent Toolkit Runtime — Uninstall")
  log("=================================")
  log("")
  uninstallOpenCodeGlobal({
    env: options.compatibilityEnv,
    execShell: options.execShell,
  })
  options.removeLegacyShortcut?.()
  log("✓ Plugin removed. Restart OpenCode.")
  log("")
}
