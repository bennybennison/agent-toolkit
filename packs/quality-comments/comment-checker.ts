import type { Plugin } from "@opencode-ai/plugin"

import { pushContext } from "../lib/plugin-context"

/**
 * Comment Slop Checker Hook
 *
 * Detects and warns about AI-generated noise comments in code edits.
 * Catches patterns like "// Updated to handle...", "// Added for...",
 * "// This function does..." while preserving legitimate comments
 * (JSDoc, TODO, type directives, BDD descriptions, license headers).
 * Module: hooks/comment-checker
 */
export const CommentCheckerPlugin: Plugin = async () => {
  // Patterns that indicate AI-generated noise comments
  const SLOP_PATTERNS = [
    // Narration comments that describe what was just done
    /\/\/\s*(Updated|Added|Modified|Changed|Fixed|Removed|Created|Implemented|Refactored)\s+(to|for|the|this|a)\s/i,
    /\#\s*(Updated|Added|Modified|Changed|Fixed|Removed|Created|Implemented|Refactored)\s+(to|for|the|this|a)\s/i,
    // Self-evident comments
    /\/\/\s*(This|The)\s+(function|method|class|variable|constant|module|file)\s+(is|does|will|should|handles|returns|takes)/i,
    /\#\s*(This|The)\s+(function|method|class|variable|constant|module|file)\s+(is|does|will|should|handles|returns|takes)/i,
    // Obvious getter/setter comments
    /\/\/\s*(Get|Set|Return)s?\s+the\s+\w+\s*$/i,
    /\#\s*(Get|Set|Return)s?\s+the\s+\w+\s*$/i,
    // AI narration patterns
    /\/\/\s*Now\s+(we|I|let's|let us)\s/i,
    /\#\s*Now\s+(we|I|let's|let us)\s/i,
    // Import explanation comments
    /\/\/\s*Import(s|ing)?\s+(the|our|all|necessary|required)\s/i,
    /\#\s*Import(s|ing)?\s+(the|our|all|necessary|required)\s/i,
  ]

  // Patterns that indicate legitimate comments (never flag these)
  const LEGITIMATE_PATTERNS = [
    /\/\*\*/,             // JSDoc opening
    /\*\s*@/,             // JSDoc tags
    /\/\/\s*TODO/i,       // TODO comments
    /\/\/\s*FIXME/i,      // FIXME comments
    /\/\/\s*HACK/i,       // HACK comments
    /\/\/\s*NOTE/i,       // NOTE comments
    /\/\/\s*WARN/i,       // WARNING comments
    /\/\/\s*eslint-/,     // ESLint directives
    /\/\/\s*@ts-/,        // TypeScript directives
    /\/\/\s*noinspection/,// IDE directives
    /\/\/\s*prettier-/,   // Prettier directives
    /\#\s*type:\s*ignore/, // Python type ignore
    /\#\s*noqa/,          // Python noqa
    /\#\s*pragma/,        // Pragma directives
    /\#\s*pylint/,        // Pylint directives
    /\#\s*!/,             // Shebangs
    /\/\/\s*region/i,     // Region markers
    /\/\/\s*endregion/i,  // Region markers
    /^\s*\*\s/,           // JSDoc continuation lines
    /Copyright|License|SPDX/i, // License headers
  ]

  function isSlopComment(line: string): boolean {
    const trimmed = line.trim()

    // Skip empty lines and non-comment lines
    if (!trimmed.startsWith("//") && !trimmed.startsWith("#") && !trimmed.startsWith("*")) {
      return false
    }

    // Check legitimate patterns first — never flag these
    for (const pattern of LEGITIMATE_PATTERNS) {
      if (pattern.test(trimmed)) return false
    }

    // Check slop patterns
    for (const pattern of SLOP_PATTERNS) {
      if (pattern.test(trimmed)) return true
    }

    return false
  }

  return {
    "tool.execute.after": async (input, output) => {
      // Only check write and edit operations
      if (input.tool !== "write" && input.tool !== "edit") return

      const content = input.tool === "write"
        ? output.args?.content ?? ""
        : output.args?.newString ?? ""

      if (!content) return

      const lines = content.split("\n")
      const slopLines: string[] = []

      for (const line of lines) {
        if (isSlopComment(line)) {
          slopLines.push(line.trim())
        }
      }

      if (slopLines.length > 0) {
        pushContext(
          output,
          `Comment quality warning: ${slopLines.length} potential AI-generated noise comment(s) detected in your last edit:\n` +
            slopLines.map(l => `  ${l}`).join("\n") +
            `\n\nThese look like narration comments that describe what was done rather than why. ` +
            `Consider removing them. Good comments explain WHY, not WHAT. ` +
            `Code should be self-documenting for the WHAT.`
        )
      }
    },
  }
}
