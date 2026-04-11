import type { Learning, LearningCategory, LearningsSnapshot } from "./contracts/memory"
import { getDefaultOrchestrationArtifactStore } from "./persistence/store"

const MAX_LEARNINGS = 50

export type { Learning } from "./contracts/memory"

function makeId(text: string): string {
  return text.slice(0, 60).replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").toLowerCase()
}

function loadSnapshot(): LearningsSnapshot {
  return {
    version: 1,
    learnings: getDefaultOrchestrationArtifactStore().memory.getLearnings(),
  }
}

function saveSnapshot(snapshot: LearningsSnapshot): void {
  getDefaultOrchestrationArtifactStore().memory.saveLearnings(snapshot)
}

export function addLearning(category: LearningCategory, text: string): void {
  const snapshot = loadSnapshot()
  const id = makeId(text)
  const existing = snapshot.learnings.find((learning) => learning.id === id)

  if (existing) {
    existing.confidence = Math.min(1.0, existing.confidence + 0.1)
    existing.confirmedCount += 1
    saveSnapshot(snapshot)
    return
  }

  snapshot.learnings.push({
    id,
    category,
    text,
    confidence: 0.5,
    createdAt: new Date().toISOString(),
    confirmedCount: 1,
  })

  if (snapshot.learnings.length > MAX_LEARNINGS) {
    snapshot.learnings.sort((left, right) => right.confidence - left.confidence)
    snapshot.learnings = snapshot.learnings.slice(0, MAX_LEARNINGS)
  }

  saveSnapshot(snapshot)
}

export function getLearnings(): Learning[] {
  return loadSnapshot().learnings.slice().sort((left, right) => right.confidence - left.confidence)
}

export function formatLearningsForContext(learnings: Learning[]): string {
  if (learnings.length === 0) return ""

  const lines = ["## Project Learnings (auto-loaded)", ""]
  const grouped = new Map<string, Learning[]>()
  for (const learning of learnings) {
    const group = grouped.get(learning.category) || []
    group.push(learning)
    grouped.set(learning.category, group)
  }

  for (const [category, items] of grouped) {
    lines.push(`### ${category}`)
    for (const item of items) {
      const confidence = item.confidence >= 0.8 ? "★" : item.confidence >= 0.5 ? "●" : "○"
      lines.push(`- ${confidence} ${item.text}`)
    }
    lines.push("")
  }

  return lines.join("\n")
}
