/**
 * Copilot Adapter — generates .github/ surface for GitHub Copilot
 *
 * ARCHITECTURE NOTE: This adapter is intentionally content-driven.
 * Unlike the OpenCode adapter, it does NOT use runtime model routing.
 *
 * Reason: GitHub Copilot does not support programmatic model assignment.
 * Users select models through the Copilot UI (model picker). The adapter
 * copies static instruction/prompt templates and renders the shared toolkit
 * agent catalog into Copilot agent files. These files define behavior and
 * constraints, not model selection.
 *
 * If Copilot adds programmatic model selection in the future, this
 * adapter should be updated to consume runtime model routing like
 * the OpenCode adapter does.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs"
import { basename, join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { HOST_VISIBLE_AGENT_IDS } from "../../runtime/lib/tooling/agent-catalog"

export interface CopilotSyncResult {
  filesWritten: number
  paths: string[]
}

export interface CopilotGenerateOptions {
  templateTokens?: Record<string, string>
  mode?: "project" | "global"
}

/**
 * Get the copilot templates directory (relative to this file's location).
 */
function getTemplatesDir(): string {
  const dir = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))
  return join(dir, "templates")
}

function getToolkitAgentsDir(): string {
  const dir = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))
  return join(dir, "..", "..", "content", "agents")
}

/**
 * Generate the Copilot adapter surface in a project directory.
 * Copies templates from adapters/copilot/templates/ into .github/.
 */
export function generateCopilotSurface(projectDir: string, options?: CopilotGenerateOptions): CopilotSyncResult {
  const templatesDir = getTemplatesDir()
  const toolkitAgentsDir = getToolkitAgentsDir()
  const mode = options?.mode ?? "project"
  const githubDir = mode === "global" ? projectDir : join(projectDir, ".github")
  const result: CopilotSyncResult = { filesWritten: 0, paths: [] }

  mkdirSync(githubDir, { recursive: true })

  // copilot-instructions.md
  const ciSrc = join(templatesDir, "copilot-instructions.md")
  if (existsSync(ciSrc)) {
    const dest = join(githubDir, "copilot-instructions.md")
    writeRenderedFile(ciSrc, dest, options?.templateTokens)
    result.filesWritten++
    result.paths.push(mode === "global" ? "copilot-instructions.md" : ".github/copilot-instructions.md")
  }

  // .github/instructions/
  copyTemplateDir(templatesDir, "instructions", githubDir, ".instructions.md", result, options?.templateTokens, mode)

  // .github/agents/
  syncCopilotAgents(toolkitAgentsDir, templatesDir, githubDir, result, options?.templateTokens, mode)

  // .github/prompts/
  copyTemplateDir(templatesDir, "prompts", githubDir, ".prompt.md", result, options?.templateTokens, mode)

  return result
}

function writeRenderedFile(src: string, dest: string, templateTokens?: Record<string, string>): void {
  const content = renderContent(readFileSync(src, "utf8"), templateTokens)
  writeFileSync(dest, content, "utf8")
}

function renderContent(content: string, templateTokens?: Record<string, string>): string {
  let rendered = content
  for (const [token, value] of Object.entries(templateTokens ?? {}).sort(([left], [right]) => right.length - left.length)) {
    rendered = rendered.split(token).join(value)
  }
  return rendered
}

function parseAgentDescription(raw: string): string {
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return "Toolkit specialist agent."
  for (const line of match[1].split("\n")) {
    const pair = line.trim().match(/^description:\s*(.+)$/)
    if (pair) return pair[1].trim()
  }
  return "Toolkit specialist agent."
}

function stripFrontmatter(raw: string): string {
  return raw.replace(/^---\n[\s\S]*?\n---\n*/, "").trim()
}

function buildGeneratedCopilotAgent(raw: string, templateTokens?: Record<string, string>): string {
  const description = renderContent(parseAgentDescription(raw), templateTokens)
  const body = renderContent(stripFrontmatter(raw), templateTokens)
  return [
    "---",
    `description: ${JSON.stringify(description)}`,
    "tools:",
    "  - codebase",
    "  - fetch",
    "---",
    "",
    body,
    "",
  ].join("\n")
}

function recordGeneratedPath(
  result: CopilotSyncResult,
  mode: "project" | "global",
  subPath: string,
): void {
  result.filesWritten++
  result.paths.push(mode === "global" ? subPath : `.github/${subPath}`)
}

function syncCopilotAgents(
  toolkitAgentsDir: string,
  templatesDir: string,
  githubDir: string,
  result: CopilotSyncResult,
  templateTokens?: Record<string, string>,
  mode: "project" | "global" = "project",
): void {
  const agentsDir = join(githubDir, "agents")
  mkdirSync(agentsDir, { recursive: true })

  const overrideDir = join(templatesDir, "agents")
  const agentIds = new Set<string>(HOST_VISIBLE_AGENT_IDS)

  if (existsSync(agentsDir)) {
    for (const file of readdirSync(agentsDir)) {
      if (!file.endsWith(".agent.md")) continue
      const agentId = file.replace(/\.agent\.md$/, "")
      if (!agentIds.has(agentId)) {
        unlinkSync(join(agentsDir, file))
      }
    }
  }

  for (const agentId of [...agentIds].sort()) {
    const overridePath = join(overrideDir, `${agentId}.agent.md`)
    const toolkitSourcePath = join(toolkitAgentsDir, `${agentId}.md`)
    const destPath = join(agentsDir, `${agentId}.agent.md`)

    if (existsSync(overridePath)) {
      writeRenderedFile(overridePath, destPath, templateTokens)
      recordGeneratedPath(result, mode, `agents/${agentId}.agent.md`)
      continue
    }

    if (!existsSync(toolkitSourcePath)) continue

    const raw = readFileSync(toolkitSourcePath, "utf8")
    writeFileSync(destPath, buildGeneratedCopilotAgent(raw, templateTokens), "utf8")
    recordGeneratedPath(result, mode, `agents/${agentId}.agent.md`)
  }
}

function copyTemplateDir(
  templatesDir: string,
  subDir: string,
  githubDir: string,
  ext: string,
  result: CopilotSyncResult,
  templateTokens?: Record<string, string>,
  mode: "project" | "global" = "project",
): void {
  const src = join(templatesDir, subDir)
  if (!existsSync(src)) return

  const dest = join(githubDir, subDir)
  mkdirSync(dest, { recursive: true })

  for (const file of readdirSync(src)) {
    if (!file.endsWith(ext)) continue
    writeRenderedFile(join(src, file), join(dest, file), templateTokens)
    recordGeneratedPath(result, mode, `${subDir}/${basename(file)}`)
  }
}
