import type { Plugin } from "@opencode-ai/plugin"

import { pushContext } from "../lib/plugin-context"

/**
 * Write-Existing-File Guard Hook
 *
 * Warns when the agent uses the Write tool on a file that likely already exists
 * without having read it first. This prevents accidental overwrites of existing
 * content. The guard tracks which files have been read in the current session.
 * Module: hooks/write-guard
 */
export const WriteGuardPlugin: Plugin = async () => {
  const readFiles = new Set<string>()

  // File extensions that indicate likely existing project files
  const CODE_EXTENSIONS = [
    ".ts", ".tsx", ".js", ".jsx", ".py", ".json", ".yaml", ".yml",
    ".toml", ".cfg", ".ini", ".html", ".css", ".scss", ".sql",
    ".sh", ".bash", ".zsh", ".md", ".txt", ".xml", ".graphql",
  ]

  function isCodeFile(filePath: string): boolean {
    return CODE_EXTENSIONS.some(ext => filePath.endsWith(ext))
  }

  // Files that are commonly created new (not overwrites)
  const NEW_FILE_PATTERNS = [
    /__pycache__/,
    /node_modules/,
    /\.next\//,
    /dist\//,
    /build\//,
    /\.git\//,
    /\.venv\//,
    /venv\//,
  ]

  function isLikelyGenerated(filePath: string): boolean {
    return NEW_FILE_PATTERNS.some(pattern => pattern.test(filePath))
  }

  return {
    // Track files that are read
    "tool.execute.after": async (input, output) => {
      if (input.tool === "read") {
        const filePath = output.args?.shadowOriginalPath ?? input.args?.filePath
        if (filePath) {
          readFiles.add(filePath)
        }
      }
    },

    // Warn on writes to unread files
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "write") return

      const filePath = output.args?.shadowOriginalPath ?? output.args?.filePath
      if (!filePath) return

      // Skip generated/build directories
      if (isLikelyGenerated(filePath)) return

      // Skip non-code files
      if (!isCodeFile(filePath)) return

      // If the file was read in this session, allow the write
      if (readFiles.has(filePath)) return

      // The Write tool itself checks if the file was read, but we add
      // context to help the agent understand why this is important
      pushContext(
        output,
        `Write guard: You are writing to "${filePath}" which you haven't read in this session. ` +
          `If this file already exists, you may be overwriting its contents. ` +
          `Use the Read tool first to see existing content, then use Edit for targeted changes. ` +
          `Only use Write for genuinely new files.`
      )
    },
  }
}
