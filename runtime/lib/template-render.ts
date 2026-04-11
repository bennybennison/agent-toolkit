import { type ToolkitEnvironment } from "./toolkit-environment"

export function getToolkitTemplateTokens(env: ToolkitEnvironment): Record<string, string> {
  const host = env.hostConventions
  return {
    "{{CLI_COMMAND}}": host.cliCommand,
    "{{PROJECT_CONFIG_PATH}}": host.projectConfigPath,
    "{{PROJECT_STATE_DIR}}": host.projectStateDir,
    "{{PROJECT_PLANS_DIR}}": host.projectPlansDir,
    "{{PROJECT_RULES_DIR}}": host.projectRulesDir,
    "{{PROJECT_RULES_GLOB}}": host.projectRulesGlob,
    "{{PROJECT_CONTEXT_DIR}}": host.projectContextDir,
    "{{SESSION_STATE_PATH}}": host.sessionStatePath,
    "{{CHECKPOINTS_LOG_PATH}}": host.checkpointsLogPath,
    "{{SESSIONS_DIR}}": host.sessionsDir,
    "{{MEMORY_DIR}}": host.memoryDir,
    "{{AUDITS_DIR}}": host.auditsDir,
    "{{SPECS_DIR}}": host.specsDir,
    "{{BLUEPRINTS_DIR}}": host.blueprintsDir,
    "{{BACKLOG_PATH}}": host.backlogPath,
    "{{PROJECT_BRIEF_PATH}}": host.projectBriefPath,
    "{{PORTFOLIO_PATH}}": host.portfolioPath,
    "{{GOTCHAS_PATH}}": host.gotchasPath,
    "{{CONSTITUTION_PATH}}": host.constitutionPath,
    "{{FRICTION_LOG_PATH}}": host.frictionLogPath,
    "{{BEADS_REPORT_PATH}}": host.beadsReportPath,
    "{{LEDGER_DB_PATH}}": host.ledgerDbPath,
    "{{STAGING_DIR}}": host.stagingDir,
  }
}

export function renderToolkitTemplate(text: string, env: ToolkitEnvironment): string {
  let rendered = text
  for (const [token, value] of Object.entries(getToolkitTemplateTokens(env)).sort(([left], [right]) => right.length - left.length)) {
    rendered = rendered.split(token).join(value)
  }
  return rendered
}
