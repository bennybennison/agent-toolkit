import type { Plugin } from "@opencode-ai/plugin"

import { pushContext, markHandled } from "../lib/plugin-context"
import { sessionState } from "../lib/session-state"
import { loadSessionStateFile, getSessionStatePath, isStrategicCommand } from "../lib/session-state-store"
import { loadFrameworkConfig } from "../lib/framework-config"
import type { CompactionStrategy } from "../lib/framework-config"

/**
 * Unified Compaction Handler
 *
 * Single hook that handles ALL compaction context injection.
 * Replaces the competing compaction handlers that previously lived in:
 * - compaction-loop-detector.ts
 * - continuation.ts
 * - todo-enforcer.ts
 * - session-state.ts
 * - session-memory.ts
 *
 * Produces ONE coherent message per compaction based on priority:
 *   1. Hard-stop loop detection (highest priority — overrides everything)
 *   2. Loop warning
 *   3. Normal continuation with state-appropriate guidance
 */
// Thresholds per strategy
const STRATEGY_THRESHOLDS: Record<CompactionStrategy, { window: number; warn: number; stop: number }> = {
  normal:       { window: 5 * 60_000, warn: 3, stop: 5 },
  aggressive:   { window: 3 * 60_000, warn: 2, stop: 3 },   // Triggers faster, stops sooner
  conservative: { window: 10 * 60_000, warn: 5, stop: 8 },  // More tolerance for long sessions
}

export const CompactionHandlerPlugin: Plugin = async () => {
  let compactionCount = 0
  let lastCompactionAt = 0

  const { compaction_strategy } = loadFrameworkConfig()
  const { window: WINDOW_MS, warn: WARNING_COUNT, stop: HARD_STOP_COUNT } = STRATEGY_THRESHOLDS[compaction_strategy]
  const windowLabel = `~${Math.round(WINDOW_MS / 60_000)} min`

  return {
    "experimental.session.compacting": async (_input, output) => {
      const now = Date.now()
      if (now - lastCompactionAt > WINDOW_MS) {
        compactionCount = 0
      }
      compactionCount++
      lastCompactionAt = now

      // Signal to other hooks that compaction context is handled
      markHandled(output, "compaction")

      const snapshot = sessionState.getSnapshot()
      const persisted = loadSessionStateFile()
      const statePath = getSessionStatePath()
      const strategicFastPath = isStrategicCommand(persisted.activeCommand)

      // --- Priority 1: Hard-stop loop ---
      if (compactionCount >= HARD_STOP_COUNT) {
        sessionState.setState("blocked", `Compaction loop: ${compactionCount} compactions in ${windowLabel}`)
        pushContext(
          output,
          `## COMPACTION LOOP HARD-STOP (${compactionCount} in ${windowLabel})

Normal continuation has failed. In the next response:
1. Do NOT restate the goal, plan, or project brief.
2. Do NOT treat a generic "continue" as a new task.
3. Name the blocker in one sentence.
4. Propose ONE concrete next experiment OR ask ONE targeted question, then stop.
5. Do NOT make more tool calls until you have changed approach.

State: \`blocked\` | Reason: compaction loop
Active command: ${persisted.activeCommand ?? "none"} | Next action: ${persisted.nextAction ?? "none"}
State file: ${statePath}`
        )
        return
      }

      // --- Priority 2: Loop warning ---
      if (compactionCount >= WARNING_COUNT) {
        sessionState.setState("blocked", `Compaction loop risk: ${compactionCount} compactions in ${windowLabel}`)
        pushContext(
          output,
          `## Compaction Loop Warning (${compactionCount} in ${windowLabel})

You are likely repeating. On resume:
1. Do NOT restart with "## Goal" or "## Plan".
2. Continue from the last unfinished concrete step only.
3. If the user only said "continue", treat it as confirmation — do not replan.
4. If no concrete next step exists, name the blocker and stop.

State: \`blocked\` | Reason: loop risk
Active command: ${persisted.activeCommand ?? "none"} | Next action: ${persisted.nextAction ?? "none"}
State file: ${statePath}`
        )
        return
      }

      // --- Priority 3: Normal compaction summary ---

      // Strategic fast-path: skip todo enforcement, keep it tight
      const todoSection = strategicFastPath
        ? `Active command is "${persisted.activeCommand}". Finish it before creating/reviewing todos.`
        : `Check outstanding todos before starting new work. Only ONE todo in-progress at a time. Mark completed immediately.`

      pushContext(
        output,
        `## Compaction Summary

### State
- State: \`${snapshot.state}\` | Reason: ${snapshot.reason ?? "none"}
- Active command: ${persisted.activeCommand ?? "none"}
- Output path: ${persisted.outputPath ?? "none"}
- Next action: ${persisted.nextAction ?? "none"}
- State file: ${statePath}

### Continuation Rules
- State \`${snapshot.state}\` means: ${sessionState.getAllowedActions()}
- Generic "continue" / "keep going" = confirmation only. Not a new task. Do not restate the goal.
- Do NOT start with "## Goal" or "## Plan" unless the user explicitly asked for a fresh plan.
- If state is \`awaiting_user\` or \`blocked\`: restate the pending question/blocker and stop.
- If state is \`executing\`: do the next concrete implementation step. Do not restart planning.

### Todos
${todoSection}

### Summary Format
- Keep <= 25 lines. Delta-oriented: what changed, what remains, what's next.
- Do not copy the original user request verbatim if it already appeared in a prior summary.
- Preserve discovered gotchas, key decisions, and files modified.
- Include one "Exact Next Step" line.`
      )
    },
  }
}
