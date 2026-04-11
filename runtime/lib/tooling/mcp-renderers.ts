import { getMcpToolManifests, type McpToolManifest, type ToolEnvValue, type ToolManifest } from "./tool-manifests"

export interface CodexMcpServerConfig {
  type?: string
  url?: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  note?: string
}

export interface CodexMcpConfig {
  mcpServers: Record<string, CodexMcpServerConfig>
}

export interface VSCodeInputDefinition {
  type: "promptString"
  id: string
  description: string
  password: boolean
}

export interface VSCodeMcpServerConfig {
  type?: "http" | "stdio"
  url?: string
  command?: string
  args?: string[]
  env?: Record<string, string>
}

export interface VSCodeMcpConfig {
  servers: Record<string, VSCodeMcpServerConfig>
  inputs?: VSCodeInputDefinition[]
}

function renderCodexEnvValue(value: ToolEnvValue): string {
  if (value.kind === "env-ref") return `{env:${value.envVar}}`
  return value.value
}

function toInputId(serverName: string, envVar: string): string {
  return `${serverName}-${envVar}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}

function renderVSCodeEnvValue(serverName: string, envVar: string): string {
  return `\${input:${toInputId(serverName, envVar)}}`
}

function addVSCodeInputs(inputs: Map<string, VSCodeInputDefinition>, tool: McpToolManifest): void {
  if (tool.transport.transport !== "stdio") return
  for (const envValue of Object.values(tool.transport.env)) {
    if (envValue.kind !== "env-ref") continue
    const id = toInputId(tool.serverName, envValue.envVar)
    if (inputs.has(id)) continue
    inputs.set(id, {
      type: "promptString",
      id,
      description: `${envValue.envVar} for ${tool.serverName}`,
      password: true,
    })
  }
}

export function renderCodexMcpConfig(toolManifests: ToolManifest[]): CodexMcpConfig {
  const mcpServers: Record<string, CodexMcpServerConfig> = {}

  for (const tool of getMcpToolManifests(toolManifests)) {
    if (tool.transport.transport === "http") {
      mcpServers[tool.serverName] = {
        type: "http",
        url: tool.transport.url,
        note: tool.note,
      }
      continue
    }

    mcpServers[tool.serverName] = {
      command: tool.transport.command,
      args: tool.transport.args,
      env: Object.fromEntries(
        Object.entries(tool.transport.env).map(([key, value]) => [key, renderCodexEnvValue(value)]),
      ),
      note: tool.note,
    }
  }

  return { mcpServers }
}

export function renderVSCodeMcpConfig(toolManifests: ToolManifest[]): VSCodeMcpConfig {
  const servers: Record<string, VSCodeMcpServerConfig> = {}
  const inputs = new Map<string, VSCodeInputDefinition>()

  for (const tool of getMcpToolManifests(toolManifests)) {
    if (tool.transport.transport === "http") {
      servers[tool.serverName] = {
        type: "http",
        url: tool.transport.url,
      }
      continue
    }

    addVSCodeInputs(inputs, tool)
    servers[tool.serverName] = {
      type: "stdio",
      command: tool.transport.command,
      args: tool.transport.args,
      env: Object.fromEntries(
        Object.entries(tool.transport.env).map(([key, value]) => {
          if (value.kind === "env-ref") {
            return [key, renderVSCodeEnvValue(tool.serverName, value.envVar)]
          }
          return [key, value.value]
        }),
      ),
    }
  }

  const result: VSCodeMcpConfig = { servers }
  if (inputs.size > 0) {
    result.inputs = [...inputs.values()]
  }
  return result
}
