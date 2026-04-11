import type { Plugin } from "@opencode-ai/plugin"

/**
 * Python Lint Hook
 *
 * Auto-runs ruff check and format after Python files are edited.
 * Module: hooks/lint
 */
export const PythonLintPlugin: Plugin = async ({ $, directory }) => {
  return {
    "file.edited": async ({ event }) => {
      const filePath = event.properties?.file ?? ""
      if (!filePath.endsWith(".py")) return

      try {
        // Run ruff check with auto-fix on the edited file
        await $`ruff check --fix ${filePath}`.cwd(directory)
        // Run ruff format on the edited file
        await $`ruff format ${filePath}`.cwd(directory)
      } catch {
        // Silently fail — ruff may not be installed or file may have
        // unfixable issues. The user will see errors on their next
        // explicit lint run.
      }
    },
  }
}
