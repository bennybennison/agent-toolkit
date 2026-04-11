---
description: Initialize layered project context and generate hierarchical AGENTS.md files
---

Analyse the project directory structure, scaffold layered planning/context docs, and generate AGENTS.md files for packages/directories that are missing them.

## Process

1. **Capture repo context first** — Determine whether this is a single-area repo or a monorepo/multi-area repo. Identify:
   - repo purpose
   - key business/domain context
   - likely major areas/apps
   - major future directions that should influence current design

2. **Create compact top-level planning docs if missing**:
   - `{{PROJECT_BRIEF_PATH}}` using the framework template
   - `{{PORTFOLIO_PATH}}` for multi-area repos using the framework template

3. **Scan the directory structure** — Use the glob tool to find all directories that contain source code (`.py`, `.ts`, `.tsx`, `.js`, `.jsx` files). Ignore `node_modules/`, `__pycache__/`, `.venv/`, `venv/`, `dist/`, `build/`, `.git/`, `.next/`.

4. **Find existing AGENTS.md files** — Identify which directories already have AGENTS.md. Never overwrite existing ones.

5. **Identify gaps** — Directories that have 3+ source files but no AGENTS.md are candidates.

6. **Read each candidate directory** — For each candidate, read the source files to understand:
   - What the package/module does (purpose)
   - Key files and their roles
   - Public API (exports, main functions/classes)
   - Dependencies (what it imports from)
   - Patterns in use (architecture layer, design patterns)

7. **Generate AGENTS.md** — For each candidate, create an AGENTS.md following the template from the toolkit package. Each generated file should include:
   - Purpose (one-sentence summary)
   - Key files table (file → purpose)
   - Architecture layer this package belongs to
   - Dependencies (what this package depends on)
   - Constraints (what to watch out for)

8. **Verify hierarchy** — Ensure child AGENTS.md files don't contradict parent AGENTS.md files. Child files should be more specific, not more general.

9. **Report** — List all generated files and summarise what was created.

## Rules

- NEVER overwrite existing AGENTS.md files
- NEVER overwrite existing `{{PROJECT_BRIEF_PATH}}` or `{{PORTFOLIO_PATH}}` without reading and updating them carefully
- Keep each generated AGENTS.md under 200 lines
- Keep `project-brief.md` and `portfolio.md` compact and highly scannable
- Use the project's existing governance style if AGENTS.md files already exist somewhere
- If the project has a CONSTITUTION.md, ensure generated files align with it
- Skip test directories unless they have complex test infrastructure

## Target

$ARGUMENTS
