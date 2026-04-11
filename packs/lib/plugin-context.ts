// Shared helpers for toolkit hook plugins.
// Kept tiny and dependency-free so capability packs can be extracted cleanly.

export function pushContext(output: unknown, text: string): void {
  const out = output as { context?: unknown }
  if (!Array.isArray(out.context)) {
    ;(out as { context: string[] }).context = []
  }
  ;(out.context as string[]).push(text)
}

const handledEvents = new WeakMap<object, Set<string>>()

export function markHandled(output: unknown, category: string): void {
  const key = output as object
  if (!handledEvents.has(key)) {
    handledEvents.set(key, new Set())
  }
  handledEvents.get(key)!.add(category)
}

export function isHandled(output: unknown, category: string): boolean {
  const key = output as object
  return handledEvents.get(key)?.has(category) ?? false
}
