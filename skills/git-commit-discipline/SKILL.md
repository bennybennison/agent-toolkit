---
name: "git-commit-discipline"
description: "Three operating modes for working with git history: writing it, cleaning it, and reading it."
pack: "skills-ops"
---

# Skill: Git Commit Discipline

Three operating modes for working with git history: writing it, cleaning it, and reading it.

---

## Mode 1: Commit Architect (default)

Use this mode whenever you are making commits during normal development.

### Step 1: Detect Project Style

Before your first commit in a session, sample the project's conventions:

```bash
git log --oneline -20
```

| Pattern Detected | Commit Style |
|------------------|-------------|
| `feat:`, `fix:`, `chore:` | Conventional Commits |
| Imperative mood, no prefix | Imperative (Linux-kernel style) |
| Past tense (`Added`, `Fixed`) | Past tense (match it) |
| Non-English messages | Match the project's language |

If fewer than 5 commits exist, default to **imperative mood** in English.

### Step 2: Review Staged Changes

Always inspect what you are about to commit. Never commit blind.

```bash
git diff --cached --stat    # overview
git diff --cached           # full diff
```

Ask yourself:
- Is this one logical change, or am I bundling unrelated work?
- Are there debug artifacts (`print()`, `console.log()`) that should not ship?
- Are there files staged that should not be committed (`.env`, credentials)?

### Step 3: Compose the Message

**Decision tree for conventional commit prefixes** (when project uses them):

```
What kind of change?
  +-- New user-facing capability         -> feat:
  +-- Bug fix                            -> fix:
  +-- Code restructure, no behavior change -> refactor:
  +-- Documentation only                 -> docs:
  +-- Test addition or fix               -> test:
  +-- Build, CI, tooling, deps           -> chore:
  +-- Performance improvement            -> perf:
```

**Message rules:**
- Subject line: explain *why*, not *what* (the diff shows what)
- Under 72 characters for the subject
- Body (optional): context, trade-offs, alternatives considered
- Reference issue numbers when applicable (`closes #42`)

### Step 4: Scope the Commit

One logical change per commit. This is the most important rule because it makes
`git revert`, `git bisect`, and code review dramatically easier.

| Scenario | Action |
|----------|--------|
| Changed a function and its tests | One commit (they are logically coupled) |
| Reformatted a file and added a feature | Two commits (split them) |
| Renamed a variable across 10 files | One commit (single logical change) |
| Fixed a bug while refactoring | Two commits (fix first, then refactor) |

### Anti-Patterns

| Bad | Why | Better |
|-----|-----|--------|
| "fix stuff" | Says nothing about intent | "fix: prevent null dereference in user lookup" |
| "update code" | Every commit updates code | "refactor: extract validation into dedicated module" |
| "WIP" as a final commit | Unfinished work in history | Squash WIP commits before merging |
| Mixing refactors with features | Impossible to revert one without the other | Separate commits |
| Mega-commit with 30 files | Unreviewable | Split into logical units |

---

## Mode 2: Rebase Surgeon

Use when cleaning up branch history before merge, or when asked to reorganize commits.

### Interactive Rebase Workflow

```bash
git rebase -i main    # or target branch
```

**When to squash vs keep separate:**

| Keep Separate | Squash Together |
|---------------|-----------------|
| Distinct logical changes | Fixup commits (`fix typo`, `forgot file`) |
| Changes others may want to revert independently | WIP commits that form one logical unit |
| Infrastructure changes that precede features | Review feedback iterations on the same change |

### Ordering Strategy

Arrange commits so the branch tells a logical story:

1. Infrastructure / dependency changes first
2. Core logic / domain changes next
3. Integration / wiring changes
4. Tests alongside or after their implementation
5. Documentation last

This ordering minimizes conflicts and makes the branch reviewable commit-by-commit.

### Conflict Resolution

When rebasing produces conflicts:

1. Read the conflict markers carefully -- understand both sides
2. Check `git log --oneline --all` to understand the timeline
3. Resolve in favor of the intent, not just the newer code
4. Run tests after each conflict resolution (`git rebase --continue` only after verifying)
5. If a rebase becomes painful (5+ conflicts), consider `git rebase --abort` and a different strategy

---

## Mode 3: History Archaeologist

Use when investigating how code got to its current state or finding when a bug was introduced.

### Search Strategies

| Goal | Command | Notes |
|------|---------|-------|
| Find commits mentioning a term | `git log --grep="term"` | Searches commit messages |
| Find who changed a line | `git blame file.py` | Add `-w` to ignore whitespace |
| Find when code moved between files | `git blame -M file.py` | Detects moved blocks |
| Find when a string was added/removed | `git log -S "string"` | Pickaxe search -- powerful |
| Track a renamed file | `git log --follow -- old/path` | Follows across renames |
| Find commits by author | `git log --author="name"` | Partial match works |
| Find commits in a date range | `git log --since="2024-01-01" --until="2024-06-01"` | |

### Bisect Workflow

When you know something works in an old commit and is broken now:

```bash
git bisect start
git bisect bad                  # current commit is broken
git bisect good <known-good>    # last known working commit
# git checks out a midpoint -- test it, then:
git bisect good   # or
git bisect bad
# repeat until the offending commit is found
git bisect reset                # return to original branch
```

Automate with a test script: `git bisect run pytest tests/test_specific.py`

---

## Branch Naming

| Prefix | Use |
|--------|-----|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `refactor/` | Code restructuring |
| `docs/` | Documentation changes |

Format: `{prefix}{short-description}` using kebab-case. Example: `feature/user-export-csv`.

## PR Description Guidelines

A good PR description answers three questions:

1. **What** changed? (1-3 bullet summary)
2. **Why** did it change? (link to issue, explain motivation)
3. **How** should it be reviewed? (call out risky areas, suggest review order)

Include before/after screenshots for UI changes and test evidence for behavioral changes.

---

**See also:** [verification-loop](../verification-loop/SKILL.md) -- run verification before committing.
