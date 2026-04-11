---
name: "intent-gate"
description: "Classify user intent before acting to ensure the right approach, depth, and tools are used."
pack: "skills-core"
---

# Skill: Intent Gate

Classify user intent before acting to ensure the right approach, depth, and tools are used.

---

## When to Use

- At the start of every new user request
- When a request is ambiguous ("fix this", "help with X")
- Before routing to a subagent or choosing a workflow

## Why This Matters

Acting without classifying intent leads to:
- Research tasks that immediately start writing code
- Bug fixes that refactor instead of patching
- Investigations that skip reading and guess answers

The IntentGate ensures you **pause, classify, then act** — not act then backtrack.

## Intent Categories

| Intent | Signal Words | Default Approach | Depth |
|--------|-------------|------------------|-------|
| **Research** | "how does", "explain", "what is", "where is" | Read-only. Search, read files, summarise. Do NOT write code. | Thorough |
| **Implement** | "add", "create", "build", "implement", "write" | Plan first, then write code. Use `/plan` or TodoWrite. | Standard |
| **Fix** | "fix", "broken", "error", "bug", "failing" | Reproduce first. Read error, find root cause, minimal patch. | Focused |
| **Investigate** | "why", "debug", "trace", "figure out" | Read-only initially. Trace execution, log analysis. Do NOT change code until root cause is confirmed. | Deep |
| **Refactor** | "refactor", "clean up", "reorganise", "simplify" | Verify tests pass first. Small incremental changes. Verify after each. | Careful |
| **Review** | "review", "check", "audit", "look at" | Read-only. Produce structured feedback. Use `@code-reviewer` or `@architect`. | Thorough |

## Classification Process

### 1. Parse the Request

Read the user's message. Look for signal words from the table above.

### 2. Check for Mixed Intent

Some requests combine intents:
- "Why is this broken and fix it" → **Investigate** first, then **Fix**
- "Add a feature and review the code" → **Implement** first, then **Review**

For mixed intent, execute in logical order: understand → plan → act → verify.

### 3. Set Approach

Based on the classified intent:

```
Research    → Task tool (explore agent), no writes
Implement   → TodoWrite to plan, then write code
Fix         → Read error output, grep for root cause, minimal patch
Investigate → Task tool (explore agent), trace calls, read logs
Refactor    → Run tests first, incremental changes, verify after each
Review      → @code-reviewer or @architect agent, read-only
```

### 4. Announce Intent (Optional)

For ambiguous requests, briefly state the classified intent:

> "This looks like an **investigation** task — I'll trace through the code to understand the issue before making any changes."

This prevents mismatched expectations.

## Intent-Specific Rules

### Research
- Never write or edit files
- Use Task tool with explore agent for codebase questions
- Summarise findings, cite file paths with line numbers
- Ask clarifying questions if the scope is too broad

### Implement
- Always plan before writing (TodoWrite or `/plan`)
- Break into steps if more than 3 files will change
- Verify after implementation (build, tests, lint)

### Fix
- Reproduce the error first (read output, run the failing command)
- Find the root cause before patching
- Make the minimal change that fixes the issue
- Do NOT refactor while fixing

### Investigate
- Start read-only — do not modify files
- Trace the execution path from entry point to failure
- Build a mental model before proposing solutions
- Present findings and ask before making changes

### Refactor
- Run tests before starting (establish baseline)
- One refactoring step at a time
- Verify tests pass after each step
- If tests break, revert the step and try a different approach

### Review
- Read-only mode — no file modifications
- Structured output (findings, severity, file references)
- Distinguish style issues from real bugs

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Start writing code for a "why does X happen" question | Classify as investigation, read first |
| Refactor while fixing a bug | Fix first, refactor separately |
| Skip planning for an implementation request | Use TodoWrite or `/plan` first |
| Guess at intent for ambiguous requests | Ask the user or announce your classification |
| Apply the same depth to every request | Match depth to intent category |
