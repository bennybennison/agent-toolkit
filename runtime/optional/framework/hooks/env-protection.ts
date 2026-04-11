import type { Plugin } from "@opencode-ai/plugin"

/**
 * Environment File Protection Hook
 *
 * Prevents the agent from reading .env files and other secret files.
 * Understands dotenvx conventions: .env.vault is safe, .env.keys is secret.
 * Module: hooks/env-protect
 */
export const EnvProtectionPlugin: Plugin = async () => {
  const PROTECTED_EXACT = [
    ".env",
    ".env.local",
    ".env.production",
    ".env.staging",
    ".env.development",
    ".env.keys",
    "credentials.json",
    "service-account.json",
    "secrets.yaml",
    "secrets.yml",
    "token.json",
    ".npmrc",
    ".pypirc",
  ]

  // Files that are safe to read (dotenvx encrypted vault, example files)
  const SAFE_PATTERNS = [".env.example", ".env.vault"]

  function isProtected(filePath: string): boolean {
    const fileName = filePath.split("/").pop() ?? ""

    // Allow safe files explicitly
    if (SAFE_PATTERNS.some((safe) => fileName === safe)) {
      return false
    }

    return (
      PROTECTED_EXACT.some((pattern) => fileName === pattern) ||
      fileName.startsWith(".env.") ||
      fileName.endsWith(".pem") ||
      fileName.endsWith(".key") ||
      fileName.endsWith(".secret") ||
      fileName === "id_rsa" ||
      fileName === "id_ed25519" ||
      fileName.endsWith("_rsa") ||
      fileName.endsWith("_ed25519")
    )
  }

  return {
    "tool.execute.before": async (input, output) => {
      const filePath = output.args?.filePath
      if (typeof filePath !== "string") return

      // Block reading protected files
      if (input.tool === "read" && isProtected(filePath)) {
        throw new Error(
          `Blocked: reading ${filePath} — this file likely contains secrets. ` +
            `If you need to check its structure, read .env.example instead.`,
        )
      }

      // Block writing to protected files
      if (input.tool === "write" && isProtected(filePath)) {
        throw new Error(
          `Blocked: writing to ${filePath} — this file contains secrets. ` +
            `Never write credentials to files. Use environment variables.`,
        )
      }

      // Block editing protected files
      if (input.tool === "edit" && isProtected(filePath)) {
        throw new Error(
          `Blocked: editing ${filePath} — this file contains secrets.`,
        )
      }
    },
  }
}
