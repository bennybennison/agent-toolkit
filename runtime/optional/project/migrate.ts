import { copyFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { CliCommandError } from "../../lib/optional-runtime-cli-core"

function readJSON(path: string): Record<string, any> {
  if (!existsSync(path)) return {}
  return JSON.parse(readFileSync(path, "utf8"))
}

export function migrateOptionalRuntimeProject(options: {
  projectDir: string
  syncProject: (projectDir: string) => void
  log?: (line: string) => void
}): void {
  const log = options.log ?? console.log
  const legacyConfig = join(options.projectDir, ".opencode", "framework.json")
  const newConfig = join(options.projectDir, ".agent", "config.json")

  log("Agent Toolkit Runtime — Migrate")
  log("================================")
  log(`Project:  ${options.projectDir}`)
  log("")

  if (existsSync(newConfig)) {
    log("✓ Already migrated (.agent/config.json exists)")
    return
  }

  if (!existsSync(legacyConfig)) {
    throw new CliCommandError("No .opencode/framework.json found. Nothing to migrate.")
  }

  log("1. Migrating config...")
  const legacy = readJSON(legacyConfig)
  mkdirSync(join(options.projectDir, ".agent", "state"), { recursive: true })
  mkdirSync(join(options.projectDir, ".agent", "state", "staging"), { recursive: true })
  if (legacy.shadow_root_path === ".agent_context/staging") {
    legacy.shadow_root_path = ".agent/state/staging"
  }
  if (legacy.modularity?.module_registry_path === ".opencode/state/modules") {
    legacy.modularity.module_registry_path = ".agent/state/modules"
  }
  delete legacy.frameworkDir
  writeFileSync(newConfig, JSON.stringify(legacy, null, 2) + "\n")
  log("   ✓ Created .agent/config.json from .opencode/framework.json")

  log("")
  log("2. Moving state files...")
  const legacyState = join(options.projectDir, ".opencode", "state", "session-state.json")
  const newState = join(options.projectDir, ".agent", "state", "session-state.json")
  if (existsSync(legacyState) && !existsSync(newState)) {
    copyFileSync(legacyState, newState)
    unlinkSync(legacyState)
    log("   ✓ Moved session-state.json")
  }
  const legacyModules = join(options.projectDir, ".opencode", "state", "modules")
  const newModules = join(options.projectDir, ".agent", "state", "modules")
  if (existsSync(legacyModules) && !existsSync(newModules)) {
    mkdirSync(newModules, { recursive: true })
    for (const file of readdirSync(legacyModules)) {
      copyFileSync(join(legacyModules, file), join(newModules, file))
    }
    log("   ✓ Copied module descriptors")
  }

  log("")
  log("3. Moving durable docs...")
  const legacyPlans = join(options.projectDir, ".opencode", "plans")
  const newPlans = join(options.projectDir, ".agent", "plans")
  if (existsSync(legacyPlans) && !existsSync(newPlans)) {
    mkdirSync(newPlans, { recursive: true })
    const copyDirRecursive = (src: string, dest: string): void => {
      for (const entry of readdirSync(src, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          mkdirSync(join(dest, entry.name), { recursive: true })
          copyDirRecursive(join(src, entry.name), join(dest, entry.name))
        } else {
          copyFileSync(join(src, entry.name), join(dest, entry.name))
        }
      }
    }
    copyDirRecursive(legacyPlans, newPlans)
    log("   ✓ Copied plans/ to .agent/plans/")
  }

  log("")
  log("4. Cleaning legacy symlinks...")
  let removedSymlinks = 0
  for (const subDir of ["commands", "agents", "contexts", "rules", "skills"]) {
    const dir = join(options.projectDir, ".opencode", subDir)
    if (!existsSync(dir)) continue
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name)
      if (entry.isSymbolicLink()) {
        unlinkSync(fullPath)
        removedSymlinks++
      }
    }
  }
  log(`   ✓ Removed ${removedSymlinks} symlinks`)

  log("")
  log("5. Regenerating adapter surfaces...")
  options.syncProject(options.projectDir)
  log("")
  log("✓ Migration complete!")
  log("  Old .opencode/ content preserved (remove manually when satisfied)")
  log("  New overlay: .agent/")
  log("")
}
