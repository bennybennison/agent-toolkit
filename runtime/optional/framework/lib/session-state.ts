import type { SessionPhase } from "./contracts/session"

export type SessionState = SessionPhase

type ToolInput = {
  tool?: unknown
  args?: Record<string, unknown>
}

export type SessionSnapshot = {
  state: SessionState
  reason: string | null
}

class SessionStateTracker {
  private state: SessionState = "discovering"
  private reason: string | null = null
  private writeCount = 0

  getSnapshot(): SessionSnapshot {
    return {
      state: this.state,
      reason: this.reason,
    }
  }

  setState(next: SessionState, reason: string | null = null): boolean {
    const changed = this.state !== next || this.reason !== reason
    this.state = next
    this.reason = reason
    return changed
  }

  getReason(): string | null {
    return this.reason
  }

  observeTool(input: ToolInput): boolean {
    const tool = typeof input.tool === "string" ? input.tool : ""
    const command = this.extractCommand(input.args)

    if (tool === "read") {
      if (this.state === "awaiting_user" || this.state === "blocked" || this.state === "executing") {
        return false
      }
      return this.setState("discovering", null)
    }

    if (tool === "write" || tool === "edit") {
      this.writeCount += 1
      return this.setState("executing", null)
    }

    if (tool === "bash") {
      if (this.isVerificationCommand(command)) {
        return this.setState("verifying", null)
      }
      if (this.isPlanningCommand(command)) {
        return this.setState("planning", null)
      }
    }

    return false
  }

  getAllowedActions(): string {
    if (this.state === "awaiting_user") {
      return "Restate the pending question briefly and stop. Do not make more tool calls."
    }
    if (this.state === "blocked") {
      return "Name the blocker, cite the last useful evidence, and stop unless you have a genuinely new approach."
    }
    if (this.state === "verifying") {
      return "Finish verification, report failures concretely, then decide whether execution can continue."
    }
    if (this.state === "executing") {
      return "Continue the next concrete implementation step. Do not restart planning."
    }
    if (this.state === "planning") {
      return "Complete the plan or ask for missing scope details, then stop for approval when required."
    }
    return "Do one meaningful read pass, then either progress or ask for the missing information."
  }

  private extractCommand(args: Record<string, unknown> | undefined): string {
    if (!args) {
      return ""
    }

    const candidates = [args.command, args.cmd, args.script, args.input]
    for (const value of candidates) {
      if (typeof value === "string") {
        return value
      }
    }

    return ""
  }

  private isPlanningCommand(command: string): boolean {
    return command.includes("/plan") || command.includes("/project-brief") || command.includes("/portfolio-plan")
  }

  private isVerificationCommand(command: string): boolean {
    return (
      command.includes("/verify") ||
      command.includes("pytest") ||
      command.includes("ruff") ||
      command.includes("mypy")
    )
  }
}

export const sessionState = new SessionStateTracker()
