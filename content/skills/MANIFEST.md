# Skills Manifest

> **How to use this file:** Scan the table below to find the right skill, then read the full file only when you need it. Do NOT read skill files speculatively — only load a skill when you are about to perform that kind of work.
>
> Skills marked with ✗ have unmet requirements on this machine. They will still work if the required tools are installed before use.

Generated: 2026-03-18 | Skills: 46

## Universal Skills

| Skill | Profile | Requires | Summary |
|-------|---------|----------|---------|
| [agent-harness-design](agent-harness-design.md) | full | | Principles for designing systems, tools, and APIs that agents can work with effectively. |
| [agent-orchestration](agent-orchestration.md) | standard, full | | Patterns for chaining agents into structured workflows with handoff documents between stages. |
| [api-design](api-design.md) | standard, full | | Design consistent, predictable REST APIs. Good API design reduces integration friction and prevents an entire class of frontend/backend… |
| [autonomous-loops](autonomous-loops.md) | standard, full | | Patterns for running agents in loops with proper safety mechanisms. |
| [beads-workflow](beads-workflow.md) | standard | | Use `bd` (Beads) for persistent task tracking that survives session boundaries, compaction, and multi-agent handoffs. Beads stores tasks in a Dolt… |
| [blueprint](blueprint.md) | standard, full | | Turn a one-line objective into a step-by-step construction plan where every step has a self-contained context brief. Designed for work that spans… |
| [connector-dev](connector-dev.md) | standard, full | | How to build and extend external API connectors. |
| [continuous-learning](continuous-learning.md) | standard, full | | Extract reusable patterns from sessions and codify them as framework additions. |
| [cost-tracking](cost-tracking.md) | all | | Awareness of token usage and cost to make informed decisions about model selection, context management, and when to compact. |
| [database-patterns](database-patterns.md) | standard, full | | Platform-agnostic patterns for database schema design, migrations, queries, and data access. These patterns apply regardless of which database… |
| [debugging-methodology](debugging-methodology.md) | standard, full | | A systematic process for finding and fixing bugs. This skill is about the mental discipline of debugging -- not specific tools, but the approach… |
| [deployment-patterns](deployment-patterns.md) | standard, full | | Platform-agnostic patterns for containerization, CI/CD pipelines, and deployment strategies. These patterns apply regardless of hosting provider… |
| [doc-coauthoring](doc-coauthoring.md) | standard, full | | A structured three-stage workflow for creating documentation that is actually useful. Most docs fail not because of bad writing, but because the… |
| [document-ownership](document-ownership.md) | standard, full | | Define clear ownership and hierarchy for governance documents to prevent duplication and contradiction. |
| [environment-management](environment-management.md) | standard, full | | Configuration and environment management patterns for applications. Covers how to structure configuration across environments using… |
| [eval-driven-development](eval-driven-development.md) | standard, full | | Validate agent behaviour changes by defining expected outcomes before making changes. |
| [git-commit-discipline](git-commit-discipline.md) | standard, full | | Three operating modes for working with git history: writing it, cleaning it, and reading it. |
| [intent-gate](intent-gate.md) | all | | Classify user intent before acting to ensure the right approach, depth, and tools are used. |
| [iterative-retrieval](iterative-retrieval.md) | all | | Gather codebase context through progressive multi-cycle search instead of guessing upfront. |
| [model-routing](model-routing.md) | all | | Choose the right model tier for each task to balance quality and cost. |
| [monorepo-navigation](monorepo-navigation.md) | standard, full | | Patterns for navigating and maintaining boundaries in monorepo projects. Works with the `/focus` command to scope agent context to specific areas. |
| [multi-perspective-analysis](multi-perspective-analysis.md) | standard, full | | Analyze code or decisions from multiple specialist viewpoints to catch blind spots. |
| [portfolio-management](portfolio-management.md) | standard, full | | Manage monorepo work as visible portfolio, app, feature, and task layers instead of a flat stream of chat requests. |
| [post-work-update](post-work-update.md) | standard, full | | After completing any work, update docs so the project keeps learning. |
| [progressive-disclosure](progressive-disclosure.md) | standard, full | | Load context in layers — start minimal, deepen only when needed. This prevents context bloat and keeps the agent focused. |
| [prompt-optimizer](prompt-optimizer.md) | standard, full | | Modern LLMs respond better to reasoning and context than rigid commands. A prompt that explains WHY a rule exists is more reliably followed than… |
| [request-skill](request-skill.md) | standard, full | | Meta-skill for recognizing when a new skill is needed and initiating its creation. This is the "demand side" -- it identifies gaps and articulates… |
| [review-specs](review-specs.md) | full | | Structured workflow for finding and resolving duplicate, overlapping, or conflicting specifications. Extracted from spec management practices in… |
| [search-first](search-first.md) | standard, full | | Research before coding. Understand what exists before building. |
| [security-review](security-review.md) | standard, full | | Structured security review process based on OWASP Top 10. Run this before merging any change that touches trust boundaries. |
| [skill-creator](skill-creator.md) | standard | | This is the meta-skill -- it teaches how to build skills that AI agents can activate and follow. Use this whenever you need to capture a… |
| [spec-lifecycle](spec-lifecycle.md) | full | | Manage specifications through a structured hierarchy and lifecycle — from epic vision to actionable tasks. |
| [split-large-file](split-large-file.md) | standard, full | | Safely split source files exceeding the 300-line cap. |
| [strategic-compact](strategic-compact.md) | all | | What to preserve and what to discard when context gets large. |
| [tdd-workflow](tdd-workflow.md) | standard, full | | Test-driven development for application code. This skill covers methodology -- for Python-specific tooling, see… |
| [terminal-execution](terminal-execution.md) | all | | Safe patterns for running Python and shell commands in the terminal. |
| [verification-loop](verification-loop.md) | standard, full | | Comprehensive verification system to run before committing, creating PRs, or shipping. |

## Python Skills

| Skill | Profile | Requires | Summary |
|-------|---------|----------|---------|
| [cli-conventions](cli-conventions.md) | standard | `python3` ✓, `uv` ✓ | Standardizes how command-line tools are structured with `argparse`. Following these conventions keeps flags predictable across tools so users (and… |
| [concurrency-async](concurrency-async.md) | standard, full | `python3` ✓, `uv` ✓ | When and how to use `asyncio`, threading, and multiprocessing in Python. The wrong concurrency model for the workload type will either waste… |
| [dependency-management](dependency-management.md) | standard, full | `python3` ✓, `uv` ✓ | When and how to manage third-party dependencies. Every dependency is a liability -- it adds attack surface, maintenance burden, and coupling to… |
| [hybrid-data-patterns](hybrid-data-patterns.md) | standard, full | `python3` ✓, `uv` ✓ | Combines `data/raw-store` and `data/simple` approaches in one project. Critical data gets raw storage; disposable data uses direct models. |
| [logging-standards](logging-standards.md) | standard | `python3` ✓, `uv` ✓ | Standardizes how Python applications produce output using a three-level verbosity model. This keeps log output predictable across tools and gives… |
| [python-testing](python-testing.md) | standard, full | `python3` ✓, `uv` ✓ | Pytest-specific patterns and tooling for Python projects. This skill complements [tdd-workflow](tdd-workflow.md) (which covers methodology) with… |
| [raw-store-patterns](raw-store-patterns.md) | standard, full | `python3` ✓, `uv` ✓ | Medallion architecture for data you cannot easily re-fetch. Stores raw API responses as JSON, extracts structured "core" tables when access… |
| [simple-data-patterns](simple-data-patterns.md) | minimal, standard, full | `python3` ✓, `uv` ✓ | Direct Pydantic models mapped to storage with standard CRUD operations. No raw layer, no medallion architecture — just clean models and… |

## Frontend Skills

| Skill | Profile | Requires | Summary |
|-------|---------|----------|---------|
| [frontend-patterns](frontend-patterns.md) | standard, full | | Patterns for React 19 + TanStack Router + TanStack Query + Tailwind CSS v4. Emphasizes practical architecture over theoretical purity. |

---

*Auto-generated by `scripts/generate-skill-manifest.ts`. Do not edit manually.*
