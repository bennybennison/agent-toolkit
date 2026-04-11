import type { Plugin } from "@opencode-ai/plugin"

/**
 * Python Type Check Hook
 *
 * Auto-runs mypy after Python files are edited.
 * Module: hooks/typecheck
 *
 * Note: mypy can be slow on large codebases. Consider running
 * on specific files rather than the whole project.
 */
export const PythonTypeCheckPlugin: Plugin = async ({ $, directory }) => {
  return {
    "file.edited": async ({ event }) => {
      const filePath = event.properties?.file ?? ""
      if (!filePath.endsWith(".py")) return

      try {
        await $`mypy ${filePath} --no-error-summary`.cwd(directory)
      } catch {
        // mypy failures are informational — the user will see
        // type errors on their next explicit type check run.
      }
    },
  }
}
