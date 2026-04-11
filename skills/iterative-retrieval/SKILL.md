---
name: "iterative-retrieval"
description: "Gather codebase context through progressive multi-cycle search instead of guessing upfront."
pack: "skills-core"
---

# Skill: Iterative Retrieval

Gather codebase context through progressive multi-cycle search instead of guessing upfront.

---

## When to Use

- Starting work in an unfamiliar area of the codebase
- A subagent needs to understand code it hasn't seen before
- The first search didn't find what you expected (wrong terminology)
- Investigating a bug across multiple files or layers

## Why Not Single-Pass Search

Single searches fail when:
- You don't know the project's terminology yet (it uses "throttle" not "rate limit")
- The relevant code spans multiple files/layers
- The answer depends on understanding patterns you haven't seen

## Process

### 1. Broad Initial Search

Cast a wide net with multiple strategies simultaneously:

- **Grep for keywords** — Search for the obvious terms related to the task
- **Glob for file patterns** — Find files by naming conventions (`*_service.py`, `*Controller.ts`)
- **Read AGENTS.md** — Check the nearest AGENTS.md for key files and patterns
- **Check directory structure** — Understand the layout before diving into files

### 2. Evaluate Results

For each result from step 1, score relevance:

| Score | Meaning | Action |
|-------|---------|--------|
| Direct hit | Exactly what was needed | Read and use |
| Related | Same domain, different aspect | Note for next cycle |
| Terminology clue | Reveals project naming conventions | Update search terms |
| Irrelevant | False positive | Discard |

### 3. Refine Search Terms

Key insight: the first search reveals the codebase's own vocabulary. Update your search:

- Replace generic terms with project-specific ones found in step 2
- Search for function/class names discovered in related files
- Follow import chains from files already found
- Check test files for the same area (tests reveal expected behaviour)

### 4. Loop or Stop

**Stop when:**
- You have enough context to start the task
- Results from the latest cycle are all duplicates of previous cycles
- You've done 3 cycles (hard max — if 3 passes aren't enough, the task needs to be broken down)

**Loop when:**
- You found new terminology that might lead to more relevant code
- You found a file that imports unknown modules you should understand
- You still have unanswered questions about how the code works

## Checklist

- [ ] Read AGENTS.md for the target area before searching
- [ ] Used at least 2 different search strategies (grep, glob, directory read)
- [ ] Updated search terms based on project vocabulary discovered
- [ ] Stopped after 3 cycles maximum
- [ ] Documented what was found (files, patterns, terminology) for the session context

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Read every file in a directory hoping to find something | Search with targeted patterns |
| Give up after one search that returns nothing | Try different terminology, check AGENTS.md |
| Do 5+ search cycles endlessly refining | Stop at 3 cycles, break the task down if needed |
| Pre-load all context "just in case" | Load on demand, only read files you'll actually use |
| Ignore test files | Tests reveal expected behaviour and usage patterns |

---

## See Also

- [search-first](../search-first/SKILL.md) — Simple search-before-asking principle
