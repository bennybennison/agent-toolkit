// Shared helpers for OpenCode hook plugins.
// Keep this tiny and dependency-free.

export function pushContext(output: unknown, text: string): void {
  const out = output as { context?: unknown }
  if (!Array.isArray(out.context)) {
    ;(out as { context: string[] }).context = []
  }
  ;(out.context as string[]).push(text)
}

/**
 * Lightweight hook coordination.
 *
 * Hooks can mark an event as "handled" so lower-priority hooks
 * know to skip their processing for the same event type.
 * Uses a WeakMap keyed by the output object (unique per event).
 */
const handledEvents = new WeakMap<object, Set<string>>()

/** Mark an event category as handled by this hook. */
export function markHandled(output: unknown, category: string): void {
  const key = output as object
  if (!handledEvents.has(key)) {
    handledEvents.set(key, new Set())
  }
  handledEvents.get(key)!.add(category)
}

/** Check if a higher-priority hook already handled this event category. */
export function isHandled(output: unknown, category: string): boolean {
  const key = output as object
  return handledEvents.get(key)?.has(category) ?? false
}
