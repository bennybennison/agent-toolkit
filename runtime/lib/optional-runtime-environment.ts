import { join } from "node:path"
import { createToolkitEnvironment, type ToolkitEnvironment, type ToolkitHostConventions } from "./toolkit-environment"

export const OPTIONAL_RUNTIME_HOST_CONVENTIONS: ToolkitHostConventions = {
  cliCommand: "agent-toolkit runtime",
  projectConfigPath: ".agent/config.json",
  projectStateDir: ".agent/state",
  projectPlansDir: ".agent/plans",
  projectRulesDir: ".agent/rules",
  projectRulesGlob: ".agent/rules/*.md",
  projectContextDir: ".agent_context",
  sessionStatePath: ".agent/state/session-state.json",
  checkpointsLogPath: ".agent/state/checkpoints.log",
  sessionsDir: ".agent/state/sessions",
  memoryDir: ".agent/state/memory",
  auditsDir: ".agent/plans/audits",
  specsDir: ".agent/plans/specs",
  blueprintsDir: ".agent/plans/blueprints",
  backlogPath: ".agent/plans/backlog.md",
  projectBriefPath: ".agent/plans/project-brief.md",
  portfolioPath: ".agent/plans/portfolio.md",
  gotchasPath: ".agent/plans/GOTCHAS.md",
  constitutionPath: ".agent/plans/CONSTITUTION.md",
  frictionLogPath: ".agent/plans/FRICTION_LOG.md",
  beadsReportPath: ".agent/plans/beads-report.md",
  ledgerDbPath: ".agent_context/ledger.db",
  stagingDir: ".agent_context/staging",
}

export function createOptionalRuntimeToolkitEnv(runtimeRoot: string): ToolkitEnvironment {
  return createToolkitEnvironment(runtimeRoot, {
    cliEntrypointPath: join(runtimeRoot, "bin", "runtime-main.ts"),
    hostConventions: OPTIONAL_RUNTIME_HOST_CONVENTIONS,
  })
}

export function createOptionalRuntimeCompatibilityEnv(runtimeRoot: string): ToolkitEnvironment {
  return createToolkitEnvironment(runtimeRoot, {
    packageName: "agent-framework",
    toolkitPluginName: "agent-framework",
    globalRegistryDirName: "agent-framework",
    cliEntrypointPath: join(runtimeRoot, "bin", "runtime-main.ts"),
    coreInstructionPaths: [
      join(runtimeRoot, "content", "AGENTS.md"),
      join(runtimeRoot, "content", "rules", "common", "*.md"),
    ],
    hostConventions: OPTIONAL_RUNTIME_HOST_CONVENTIONS,
  })
}
