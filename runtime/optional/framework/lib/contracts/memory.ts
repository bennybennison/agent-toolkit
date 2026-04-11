export type MemoryEntry = {
  timestamp: string
  goal: string | null
  phase: string
  filesRead: string[]
  blockedReason: string | null
  nextAction: string | null
  activeCommand: string | null
}

export type LearningCategory = "build" | "test" | "pattern" | "gotcha" | "convention"

export type Learning = {
  id: string
  category: LearningCategory
  text: string
  confidence: number
  createdAt: string
  confirmedCount: number
}

export type LearningsSnapshot = {
  version: 1
  learnings: Learning[]
}
