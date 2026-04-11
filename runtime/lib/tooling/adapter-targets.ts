import { type AdapterTarget, type InstallScope } from "./contracts"

export interface AdapterTargetDefinition {
  id: AdapterTarget
  label: string
  supportedScopes: InstallScope[]
  defaultProjectPaths: string[]
}

export const ADAPTER_TARGETS: Record<AdapterTarget, AdapterTargetDefinition> = {
  opencode: {
    id: "opencode",
    label: "OpenCode",
    supportedScopes: ["global", "project"],
    defaultProjectPaths: ["opencode.json"],
  },
  copilot: {
    id: "copilot",
    label: "GitHub Copilot",
    supportedScopes: ["global", "project"],
    defaultProjectPaths: [
      ".github/copilot-instructions.md",
      ".github/instructions",
      ".github/agents",
      ".github/prompts",
    ],
  },
  vscode: {
    id: "vscode",
    label: "VS Code",
    supportedScopes: ["global", "project"],
    defaultProjectPaths: [".vscode/settings.json", ".vscode/mcp.json"],
  },
  codex: {
    id: "codex",
    label: "Codex",
    supportedScopes: ["global", "project"],
    defaultProjectPaths: [
      ".agents/plugins/marketplace.json",
      "plugins",
    ],
  },
}

export function isAdapterTarget(value: string): value is AdapterTarget {
  return value === "opencode" || value === "copilot" || value === "vscode" || value === "codex"
}

export function getAdapterTargets(): AdapterTarget[] {
  return ["opencode", "copilot", "vscode", "codex"]
}
