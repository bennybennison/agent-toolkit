import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import type { ToolkitEnvironment } from "../../lib/toolkit-environment"
import { applyToolkitTarget, resolveToolkitPacks, syncToolkitSharedSkills } from "../../lib/toolkit-operations"
import { shouldGenerate, type ToolSet } from "../../lib/optional-runtime-cli-core"

type AttachArtifactType = "runtime" | "adapter" | "durable"

interface AttachManifest {
  profile: string
  artifacts: Array<{ path: string }>
  directories: Array<{ path: string }>
}

interface ManifestOps<TManifest extends AttachManifest> {
  loadManifest: (projectDir: string) => TManifest | null
  createManifest: (projectDir: string, profile: string, runtimeRoot: string) => TManifest
  saveManifest: (projectDir: string, manifest: TManifest) => void
  recordArtifact: (manifest: TManifest, entry: {
    path: string
    type: AttachArtifactType
    kind: "file"
    method: "copy" | "generated" | "modified"
    hash?: string
    template?: boolean
    addedLines?: string[]
  }) => void
  recordDirectory: (manifest: TManifest, entry: { path: string; type: AttachArtifactType | "mixed" }) => void
  computeFileHash: (path: string) => string
}

function writeJSON(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n")
}

function copyIfMissing(src: string, dest: string): boolean {
  if (existsSync(dest)) return false
  mkdirSync(dirname(dest), { recursive: true })
  copyFileSync(src, dest)
  return true
}

function displayProfile(profile: string): string {
  return profile === "minimal" ? "light" : profile
}

export function normalizeOptionalRuntimeProfile(input: string): string {
  if (input === "light") return "minimal"
  if (["minimal", "standard", "full"].includes(input)) return input
  return "standard"
}

export function attachOptionalRuntimeProject<TManifest extends AttachManifest>(options: {
  env: ToolkitEnvironment
  runtimeRoot: string
  templateRoot: string
  projectDir: string
  profileInput: string
  tools?: ToolSet[]
  openCodeModels: { buildModel: string; planModel: string }
  addIgnoreBlock: (projectDir: string) => string[] | null
  manifestOps: ManifestOps<TManifest>
  log?: (line: string) => void
}): void {
  const log = options.log ?? console.log
  const tools = options.tools ?? ["all"]
  const profile = normalizeOptionalRuntimeProfile(options.profileInput)
  const activePacks = resolveToolkitPacks(options.env, options.projectDir, profile)

  const mkdirAndRecord = (manifest: TManifest, dirPath: string, type: AttachArtifactType | "mixed"): void => {
    mkdirSync(dirPath, { recursive: true })
    options.manifestOps.recordDirectory(manifest, {
      path: relative(options.projectDir, dirPath) + "/",
      type,
    })
  }

  const copyAndRecord = (
    manifest: TManifest,
    src: string,
    dest: string,
    type: AttachArtifactType,
    template?: boolean,
  ): void => {
    const created = copyIfMissing(src, dest)
    const relPath = relative(options.projectDir, dest)
    if (created || !manifest.artifacts.find((entry) => entry.path === relPath)) {
      options.manifestOps.recordArtifact(manifest, {
        path: relPath,
        type,
        kind: "file",
        method: "copy",
        hash: options.manifestOps.computeFileHash(dest),
        template,
      })
    }
  }

  log("Agent Toolkit Runtime — Attach")
  log("==============================")
  log(`Project:  ${options.projectDir}`)
  log(`Profile:  ${displayProfile(profile)}`)
  log(`Tools:    ${tools.join(", ")}`)
  log("")

  const sharedSkills = syncToolkitSharedSkills({
    env: options.env,
    scope: "project",
    rootDir: options.projectDir,
    activePacks,
  })
  if (sharedSkills.filesWritten > 0) {
    log(`   · Seeded ${sharedSkills.filesWritten} shared skills in .agents/skills/`)
    log("")
  }

  let manifest = options.manifestOps.loadManifest(options.projectDir)
  if (manifest) {
    manifest.profile = profile
    log("   · Re-attaching (manifest exists)")
    log("")
  } else {
    mkdirSync(join(options.projectDir, ".agent"), { recursive: true })
    manifest = options.manifestOps.createManifest(options.projectDir, profile, options.runtimeRoot)
  }

  log("1. Project overlay (.agent/)...")
  mkdirAndRecord(manifest, join(options.projectDir, ".agent"), "mixed")
  mkdirAndRecord(manifest, join(options.projectDir, ".agent", "rules"), "mixed")
  mkdirAndRecord(manifest, join(options.projectDir, ".agent", "state"), "runtime")
  mkdirAndRecord(manifest, join(options.projectDir, ".agent", "state", "staging"), "runtime")

  const agentConfigPath = join(options.projectDir, ".agent", "config.json")
  if (!existsSync(agentConfigPath)) {
    writeJSON(agentConfigPath, {
      profile,
      mode: "online",
      cr_threshold: 0.85,
      model_routing: {
        provider_overrides: {},
        profile_overrides: {},
      },
      platform: { database: "sqlite", hosting: "local", python: "3.12" },
      modularity: {
        module_registry_path: ".agent/state/modules",
        strict_module_resolution: false,
        module_flags: {
          "hook.shadow-root": false,
          "hook.integrator-gate": false,
        },
      },
      control_flow: {
        require_approval_for_feature_work: true,
        require_area_selection_in_monorepos: true,
        ask_once_then_stop_for_briefs: true,
        max_research_passes_without_write: 1,
        disable_subagents_for_strategic_docs: true,
      },
    })
    log("   ✓ Created .agent/config.json")
  } else {
    log("   · .agent/config.json exists")
  }
  options.manifestOps.recordArtifact(manifest, {
    path: ".agent/config.json",
    type: "adapter",
    kind: "file",
    method: "generated",
    hash: options.manifestOps.computeFileHash(agentConfigPath),
  })

  const statePath = join(options.projectDir, ".agent", "state", "session-state.json")
  if (!existsSync(statePath)) {
    writeJSON(statePath, {
      activeCommand: null,
      goal: null,
      phase: "discovering",
      shadowMode: "inactive",
      activeMissionId: null,
      filesRead: [],
      outputPath: null,
      nextAction: null,
      blockedReason: null,
      updatedAt: null,
    })
  }
  options.manifestOps.recordArtifact(manifest, {
    path: ".agent/state/session-state.json",
    type: "runtime",
    kind: "file",
    method: "generated",
  })

  const modulesDir = join(options.projectDir, ".agent", "state", "modules")
  mkdirAndRecord(manifest, modulesDir, "runtime")
  const templateModulesDir = join(options.templateRoot, "module-descriptors")
  if (existsSync(templateModulesDir)) {
    for (const file of readdirSync(templateModulesDir)) {
      if (!file.endsWith(".json")) continue
      copyAndRecord(manifest, join(templateModulesDir, file), join(modulesDir, file), "runtime")
    }
  }

  if (profile === "standard" || profile === "full") {
    mkdirAndRecord(manifest, join(options.projectDir, ".agent", "plans"), "mixed")
    copyAndRecord(
      manifest,
      join(options.templateRoot, "GOTCHAS.md"),
      join(options.projectDir, ".agent", "plans", "GOTCHAS.md"),
      "durable",
      true,
    )
  }
  if (profile === "full") {
    for (const dir of [".agent/plans/specs", ".agent/plans/decisions"]) {
      mkdirAndRecord(manifest, join(options.projectDir, dir), "mixed")
    }
    copyAndRecord(manifest, join(options.templateRoot, "CONSTITUTION.md"), join(options.projectDir, ".agent", "plans", "CONSTITUTION.md"), "durable", true)
    copyAndRecord(manifest, join(options.templateRoot, "FRICTION_LOG.md"), join(options.projectDir, ".agent", "plans", "FRICTION_LOG.md"), "durable", true)
    copyAndRecord(manifest, join(options.templateRoot, "FEATURE_SPEC.md"), join(options.projectDir, ".agent", "plans", "specs", "_TEMPLATE.md"), "durable", true)
    copyAndRecord(manifest, join(options.templateRoot, "ADR.md"), join(options.projectDir, ".agent", "plans", "decisions", "_TEMPLATE.md"), "durable", true)
  }

  if (shouldGenerate(tools, "opencode")) {
    log("")
    log("2. OpenCode adapter (opencode.json)...")
    const result = applyToolkitTarget({
      env: options.env,
      target: "opencode",
      scope: "project",
      rootDir: options.projectDir,
      activePacks,
      source: "attach",
      openCodeModels: options.openCodeModels,
    })
    for (const path of result.generatedPaths) {
      options.manifestOps.recordArtifact(manifest, {
        path,
        type: "adapter",
        kind: "file",
        method: "generated",
        hash: options.manifestOps.computeFileHash(join(options.projectDir, path)),
      })
    }
    log(`   ✓ ${result.filesWritten} file generated`)
  }

  if (shouldGenerate(tools, "copilot")) {
    log("")
    log("3. Copilot adapter (.github/)...")
    const result = applyToolkitTarget({
      env: options.env,
      target: "copilot",
      scope: "project",
      rootDir: options.projectDir,
      activePacks,
      source: "attach",
    })
    mkdirAndRecord(manifest, join(options.projectDir, ".github"), "adapter")
    for (const path of result.generatedPaths) {
      const dir = dirname(path)
      if (dir !== ".github") {
        mkdirAndRecord(manifest, join(options.projectDir, dir), "adapter")
      }
      options.manifestOps.recordArtifact(manifest, {
        path,
        type: "adapter",
        kind: "file",
        method: "generated",
        hash: options.manifestOps.computeFileHash(join(options.projectDir, path)),
      })
    }
    log(`   ✓ ${result.filesWritten} files generated`)
  }

  if (shouldGenerate(tools, "vscode")) {
    log("")
    log("4. VS Code adapter (.vscode/)...")
    const result = applyToolkitTarget({
      env: options.env,
      target: "vscode",
      scope: "project",
      rootDir: options.projectDir,
      activePacks,
      source: "attach",
    })
    mkdirAndRecord(manifest, join(options.projectDir, ".vscode"), "adapter")
    for (const path of result.generatedPaths) {
      options.manifestOps.recordArtifact(manifest, {
        path,
        type: "adapter",
        kind: "file",
        method: "generated",
        hash: options.manifestOps.computeFileHash(join(options.projectDir, path)),
      })
    }
    log(`   ✓ ${result.filesWritten} files generated`)
  }

  if (shouldGenerate(tools, "codex")) {
    log("")
    log("5. Codex adapter (plugins/ + marketplace)...")
    const result = applyToolkitTarget({
      env: options.env,
      target: "codex",
      scope: "project",
      rootDir: options.projectDir,
      activePacks,
      source: "attach",
    })
    for (const dir of [
      ".agents/",
      ".agents/plugins/",
      `plugins/${options.env.toolkitPluginName}/`,
      `plugins/${options.env.toolkitPluginName}/.codex-plugin/`,
    ]) {
      mkdirAndRecord(manifest, join(options.projectDir, dir), "adapter")
    }
    for (const path of result.generatedPaths) {
      options.manifestOps.recordArtifact(manifest, {
        path,
        type: "adapter",
        kind: "file",
        method: "generated",
        hash: options.manifestOps.computeFileHash(join(options.projectDir, path)),
      })
    }
    log(`   ✓ ${result.filesWritten} files generated`)
  }

  log("")
  log("6. Gitignore management...")
  const addedLines = options.addIgnoreBlock(options.projectDir)
  if (addedLines) {
    options.manifestOps.recordArtifact(manifest, {
      path: ".gitignore",
      type: "adapter",
      kind: "file",
      method: "modified",
      addedLines,
    })
    log("   ✓ Added framework ignore block to .gitignore")
  } else {
    log("   · .gitignore block already present")
  }

  options.manifestOps.saveManifest(options.projectDir, manifest)
  log("")
  log(`✓ Attached! Profile: ${displayProfile(profile)}, ${manifest.artifacts.length} artifacts tracked.`)
  log("  Overlay: .agent/")
  log("  Content: served from global install (no project symlinks)")
  log("  Manifest: .agent/framework-manifest.json")
  log("")
}
