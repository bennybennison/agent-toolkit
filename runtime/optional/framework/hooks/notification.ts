import type { Plugin } from "@opencode-ai/plugin"

/**
 * Notification Hook
 *
 * Sends a macOS system notification when a session goes idle (task complete)
 * or when a session error occurs. Useful when running long tasks in the
 * background so you know when to return to the terminal.
 * Module: hooks/notification
 */
export const NotificationPlugin: Plugin = async ({ $ }) => {
  async function notify(title: string, message: string): Promise<void> {
    try {
      const escaped = message.replace(/"/g, '\\"')
      await $`osascript -e ${"display notification \"" + escaped + "\" with title \"" + title + "\""}`
    } catch {
      // osascript may fail in non-macOS environments or headless mode — ignore
    }
  }

  return {
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        await notify("OpenCode", "Session idle — task may be complete")
      }

      if (event.type === "session.error") {
        const message = event.properties?.error ?? "Unknown error"
        await notify("OpenCode Error", String(message))
      }
    },
  }
}
