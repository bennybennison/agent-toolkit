import type { Plugin } from "@opencode-ai/plugin"
import { execFileSync } from "node:child_process"
import { existsSync, statSync } from "node:fs"
import { resolve } from "node:path"

import { appendDeleteCheckpoint, getDeleteCheckpointLogPath } from "../lib/delete-checkpoint-store"
import { pushContext } from "../lib/plugin-context"

type DeleteApprovalMode = "git-checkpoint" | "skip"

type DeletePlan = {
  command: string
  targets: string[]
  approval: DeleteApprovalMode | null
}

const SHELL_CONTROL_OPERATORS = new Set(["&&", "||", ";", "|"])

function extractCommand(args: Record<string, unknown> | undefined): string {
  if (!args) return ""
  const value = args.command ?? args.cmd ?? args.input
  return typeof value === "string" ? value : ""
}

function tokenize(command: string): string[] {
  const tokens: string[] = []
  let current = ""
  let quote: "'" | '"' | null = null
  let escaped = false

  for (const char of command) {
    if (escaped) {
      current += char
      escaped = false
      continue
    }

    if (char === "\\") {
      escaped = true
      continue
    }

    if (quote) {
      if (char === quote) {
        quote = null
      } else {
        current += char
      }
      continue
    }

    if (char === "'" || char === "\"") {
      quote = char
      continue
    }

    if (/\s/.test(char)) {
      if (current.length > 0) {
        tokens.push(current)
        current = ""
      }
      continue
    }

    current += char
  }

  if (current.length > 0) tokens.push(current)
  return tokens
}

function isDeletionToken(tokens: string[], index: number): { start: number; kind: "rm" | "git-rm" } | null {
  if (tokens[index] === "rm") return { start: index, kind: "rm" }
  if (tokens[index] === "git" && tokens[index + 1] === "rm") return { start: index, kind: "git-rm" }
  return null
}

function parseDeletePlan(command: string): DeletePlan | null {
  const approval = command.includes("AGENT_DELETE_WITH_GIT_CHECKPOINT=1")
    ? "git-checkpoint"
    : command.includes("AGENT_DELETE_SKIP_GIT_CHECKPOINT=1")
      ? "skip"
      : null

  const tokens = tokenize(command)
  for (let index = 0; index < tokens.length; index += 1) {
    const op = isDeletionToken(tokens, index)
    if (!op) continue

    const start = op.kind === "git-rm" ? op.start + 2 : op.start + 1
    const targets: string[] = []
    for (let i = start; i < tokens.length; i += 1) {
      const token = tokens[i]
      if (SHELL_CONTROL_OPERATORS.has(token)) break
      if (!token || token.startsWith("-")) continue
      if (token.includes("*") || token.includes("?") || token.includes("[")) {
        targets.push(token)
        continue
      }
      targets.push(token)
    }

    if (targets.length === 0) return null
    return { command, targets, approval }
  }

  return null
}

function assertGitRepo(): void {
  execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd: process.cwd(),
    stdio: "ignore",
  })
}

function storeFileInGitObjectDb(filePath: string): string {
  return execFileSync("git", ["hash-object", "-w", "--", filePath], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim()
}

/**
 * Delete Checkpoint Hook
 *
 * Blocks file-deletion shell commands until the user explicitly chooses whether
 * the file should be stored in git first. The affirmative path stores the file
 * in git's object database and records the blob SHA before deletion proceeds.
 * Module: hooks/delete-checkpoint
 */
export const DeleteCheckpointPlugin: Plugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "bash" && input.tool !== "shell") return

      const command = extractCommand((output.args ?? {}) as Record<string, unknown>)
      if (!command) return

      const plan = parseDeletePlan(command)
      if (!plan) return

      const existingTargets = plan.targets
        .map((target) => ({ raw: target, resolved: resolve(process.cwd(), target) }))
        .filter((entry) => existsSync(entry.resolved))

      if (existingTargets.length === 0) return

      const invalidTargets = existingTargets.filter((entry) => {
        try {
          return !statSync(entry.resolved).isFile()
        } catch {
          return true
        }
      })

      if (invalidTargets.length > 0) {
        throw new Error(
          `Delete checkpoint guard only supports file deletions right now. ` +
            `Split directory or glob deletes into explicit file actions first: ${invalidTargets.map((entry) => entry.raw).join(", ")}.`,
        )
      }

      if (plan.approval == null) {
        throw new Error(
          `Delete checkpoint required before deleting ${existingTargets.map((entry) => `"${entry.raw}"`).join(", ")}. ` +
            `Ask the user whether to store the file in git first. ` +
            `If they say yes, retry with AGENT_DELETE_WITH_GIT_CHECKPOINT=1 prefixed to the delete command. ` +
            `If they say no, retry with AGENT_DELETE_SKIP_GIT_CHECKPOINT=1.`,
        )
      }

      if (plan.approval === "skip") {
        pushContext(
          output,
          `Delete checkpoint skipped by explicit user choice for ${existingTargets.map((entry) => entry.raw).join(", ")}.`,
        )
        return
      }

      try {
        assertGitRepo()
      } catch {
        throw new Error(
          "Delete checkpoint requested a git backup, but this directory is not an active git work tree. " +
            "Initialize git or choose the explicit skip path after user confirmation.",
        )
      }

      const saved: string[] = []
      for (const entry of existingTargets) {
        const blob = storeFileInGitObjectDb(entry.raw)
        appendDeleteCheckpoint({
          path: entry.raw,
          gitBlob: blob,
          createdAt: new Date().toISOString(),
        })
        saved.push(`${entry.raw}@${blob}`)
      }

      pushContext(
        output,
        `Delete checkpoint stored in git object database before deletion: ${saved.join(", ")}. ` +
          `Log: ${getDeleteCheckpointLogPath()}.`,
      )
    },
  }
}
