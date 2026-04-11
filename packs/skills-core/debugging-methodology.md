---
skill: debugging-methodology
scope: universal
profile: standard, full
tags: [debugging, troubleshooting, workflow, methodology]
---

# Skill: Debugging Methodology

A systematic process for finding and fixing bugs. This skill is about the mental discipline of debugging -- not specific tools, but the approach that makes any tool effective.

---

## The 5-Step Process

### 1. Reproduce

Can you make the bug happen consistently? Define exact steps, inputs, and environment.

Why this is step one: If you cannot reproduce the bug, you cannot verify that your fix works. A fix without a reproduction is a guess. Write down the reproduction steps before doing anything else.

If the bug is intermittent, note the conditions under which it appears and look for patterns (time of day, data size, concurrency level).

### 2. Isolate

Narrow the scope. The goal is the smallest possible reproduction case.

- Binary search through the code path -- comment out half the logic, see if the bug persists
- Strip inputs down to the minimum that triggers the bug
- Remove components until you find which one is responsible

Why isolate: A bug in a 500-line function is hard to find. A bug in a 10-line reproduction is usually obvious. The time spent isolating is almost always less than the time spent staring at the full system.

### 3. Hypothesize

Form a specific, testable theory about what is wrong and why. Write it down.

Example hypothesis: "The user lookup returns None because the email comparison is case-sensitive, and the stored email has uppercase characters."

Why write it down: This prevents shotgun debugging -- changing random things and hoping something works. A written hypothesis forces clear thinking and creates a record of what you have already tried.

### 4. Verify

Design a targeted experiment to confirm or reject your hypothesis.

- If confirmed: proceed to fix
- If rejected: that is valuable information. Cross it off, form a new hypothesis based on what you learned, and try again.

Keep a log of hypotheses tested. This prevents repeating the same investigation and helps others who might debug the same area later.

### 5. Fix and Confirm

Once you know the cause:

1. Write a regression test that reproduces the bug (it should fail now)
2. Implement the fix
3. Confirm the test passes with the fix
4. Run the full test suite to check for unintended side effects

Why test-first: A regression test written after the fix might accidentally test the fix instead of the bug. Writing it first guarantees it actually catches the problem.

---

## Debugging Decision Tree

```
What kind of problem?
  |
  +-- Wrong output (logic error)
  |     -> Check inputs at each step
  |     -> Verify intermediate state (add logging or breakpoints)
  |     -> Check boundary conditions and off-by-one errors
  |
  +-- Error / exception
  |     -> Read the FULL stack trace, including "caused by" chains
  |     -> The deepest frame is usually the actual problem
  |     -> Check for None/null where a value is expected
  |
  +-- Intermittent failure
  |     -> Suspect: race condition, timing, external dependency, data-dependent
  |     -> Add logging with timestamps to find the pattern
  |     -> Try to increase failure rate (add delays, increase concurrency)
  |
  +-- Works locally, fails in CI/production
  |     -> Environment difference: env vars, dependency versions, OS, data
  |     -> Compare: python --version, env vars, installed packages
  |     -> Check for filesystem or path assumptions
  |
  +-- Regression (it used to work)
        -> git bisect to find the breaking commit
        -> Check recent changes: git log --oneline -20
```

---

## Common Root Causes

| Symptom | Likely Cause |
|---------|-------------|
| Wrong output | Logic error, off-by-one, wrong variable, operator precedence |
| Crash / exception | Null/None handling, type mismatch, missing input validation |
| Intermittent failure | Race condition, external dependency flakiness, data-dependent path |
| Slow performance | N+1 queries, unbounded loop, missing database index, large payload |
| Works locally, fails deployed | Environment config, dependency version mismatch, data difference |
| Passes alone, fails in suite | Shared mutable state between tests, test ordering dependency |

---

## Investigation Techniques

### Print / Log Debugging

Quick and effective for tracing execution flow. Use structured logging (`logger.debug`) over `print()` so output can be filtered and is automatically removed from production.

Best for: understanding execution flow, checking variable values at specific points.

### Breakpoint Debugging

Interactive debugger (`pdb`, IDE debugger) for inspecting complex state. Set a breakpoint, step through code, examine variables.

Best for: complex state inspection, understanding unfamiliar code paths.

### Git Bisect

Binary search through commit history to find exactly which commit introduced a regression. Cuts O(n) search to O(log n).

```bash
git bisect start
git bisect bad          # current commit is broken
git bisect good abc123  # this commit was working
# Git checks out the midpoint; test and mark good/bad until found
```

Best for: regressions where you know a "last known good" state.

### Rubber Duck Debugging

Explain the problem out loud -- to a colleague, a rubber duck, or an AI. The act of articulating the problem often reveals the flaw in your assumptions.

Why it works: Your internal model of the code may have gaps. Explaining forces you to make every assumption explicit.

### Read the Error Message

This sounds obvious, but it is the most skipped step. Read the entire error message, including:
- The exception type and message
- The full stack trace
- The "caused by" or "during handling of" chain
- Any error codes or links to documentation

The answer is in the error message more often than developers expect.

### Check Recent Changes

```bash
git log --oneline -20
git diff HEAD~5
```

If it was working recently, something changed. Find what.

---

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Shotgun debugging (random changes) | Wastes time, can introduce new bugs | Form a hypothesis first, test it deliberately |
| Fixing symptoms, not root cause | Bug returns in a different form | Trace to the actual cause, even if it takes longer |
| No regression test | Same bug reappears weeks later | Write a test that fails without the fix |
| "Works on my machine" | Dismisses the bug instead of investigating | Investigate the environment difference -- it is real |
| Ignoring warnings in the bug area | Compiler/linter warnings often point to the problem | Check and resolve warnings near the bug |
| Blaming the framework first | Wastes time investigating the wrong layer | Check your own code first -- frameworks are used by thousands |
| Debugging by reading, not running | Mental simulation misses runtime state | Run the code with instrumentation and observe actual behaviour |

---

## See Also

- [verification-loop](verification-loop.md) -- pre-commit checks to catch bugs before they ship
- [tdd-workflow](tdd-workflow.md) -- writing regression tests as part of bug fixes
- [git-commit-discipline](git-commit-discipline.md) -- History Archaeologist mode for tracing regressions
