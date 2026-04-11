---
skill: model-routing
scope: universal
profile: all
tags: [models, cost, routing, efficiency]
---

# Skill: Model Routing

Choose the right model tier for each task to balance quality and cost.

---

## When to Use

- Deciding which model to assign to a custom agent
- Choosing a model override for a command
- Evaluating whether a subagent task needs a premium model
- Optimizing costs for long-running sessions

## Providers

Two providers are configured:

| Provider | Prefix | Auth | Notes |
|----------|--------|------|-------|
| **GitHub Copilot** | `github-copilot/` | OAuth via `/connect` | Primary. All agents route here. Pro+ subscription ($39.99/mo) |
| **OpenAI** | `openai/` | Account login via `/connect` | ChatGPT Plus/Pro. Codex models for heavy generation |

## Model Tiers

Models are grouped by cost multiplier within the GitHub Copilot premium request system.

| Tier | Models | Multiplier | Use For |
|------|--------|------------|---------|
| **Free** | Gemini 3 Flash, Claude Haiku 4.5 | 0.33x | Mechanical tasks, file ops, verification, boilerplate |
| **Standard** | Claude Sonnet 4.6, GPT-4.1, GPT-5, Gemini 2.5 Pro | 1x | Feature implementation, refactoring, tests, code review |
| **Premium** | Claude Opus 4.6 | 3x | Architecture decisions, complex reasoning, security audits |
| **Ultra** | Claude Opus 4.5 | 30x | Exceptional cases only -- novel algorithms, critical system design |

### OpenAI Provider Models

Available via the `openai/` prefix. Useful for heavy code generation tasks and when Copilot premium requests are depleted.

| Model | Use For |
|-------|---------|
| GPT-5.1 Codex | Code generation, large refactors |
| GPT-5.1 Codex Max | Maximum context/output for big tasks |
| GPT-5.2 Codex | Latest generation |
| Codex Mini | Fast/cheap code tasks |

## Routing Decision Tree

```
Is the task mechanical / deterministic?
├── Yes → Free tier (0.33x)
│   Models: github-copilot/gemini-3-flash, github-copilot/claude-haiku-4.5
│   Examples: grep/find, format code, generate boilerplate,
│             simple transforms, file scaffolding, run checks
│
└── No → Does it require deep reasoning?
    ├── No → Standard tier (1x) — ~90% of tasks
    │   Model: github-copilot/claude-sonnet-4.6
    │   Examples: implement feature from spec, refactor code,
    │             code review, write tests, fix bugs
    │
    └── Yes → Premium tier (3x)
        Model: github-copilot/claude-opus-4.6
        Examples: cross-system architecture, security audit,
                  ambiguous requirements, multi-perspective analysis

Ultra tier (30x) — manual selection only, never auto-assigned
```

## Agent Model Assignments

These are the current assignments wired into agent frontmatter:

| Agent | Tier | Model | Rationale |
|-------|------|-------|-----------|
| `@cleanup` | Free (0.33x) | `github-copilot/gemini-3-flash` | Mechanical removal of debug code, dead imports |
| `@build-fixer` | Standard (1x) | `github-copilot/claude-sonnet-4.6` | Needs code understanding but follows patterns |
| `@code-reviewer` | Standard (1x) | `github-copilot/claude-sonnet-4.6` | Quality review with pattern matching |
| `@tdd-runner` | Standard (1x) | `github-copilot/claude-sonnet-4.6` | Test writing follows established patterns |
| `@audit-planner` | Standard (1x) | `github-copilot/claude-sonnet-4.6` | Planning and synthesizing implementation or review artifacts |
| `@architect` | Premium (3x) | `github-copilot/claude-opus-4.6` | Deep reasoning over trade-offs and system design |

### Command Model Assignments

| Command | Model | Rationale |
|---------|-------|-----------|
| `/verify` | `github-copilot/gemini-3-flash` | Just runs lint/type/test checks and reports |

Commands that delegate to agents (`/review` → `@code-reviewer`, `/build-fix` → `@build-fixer`, `/refactor` → `@cleanup`) inherit the agent's model automatically.

### Frontmatter Example

```yaml
---
description: Reviews code for quality issues
mode: subagent
model: github-copilot/claude-sonnet-4.6
tools:
  write: false
  edit: false
  bash: false
---
```

## Per-Project Overrides

Override any agent's model in a project's `opencode.json` without touching the global agent definition:

```json
{
  "agent": {
    "cleanup": {
      "model": "github-copilot/claude-sonnet-4.6"
    },
    "architect": {
      "model": "github-copilot/claude-opus-4.5"
    }
  }
}
```

This is useful when:
- A project needs higher-quality cleanup (upgrade `@cleanup` from Free to Standard)
- A critical project justifies Ultra tier for architecture decisions
- You want to test a different model for a specific agent

## Cost Awareness Rules

1. **Default to Standard (1x)** -- don't use Premium unless the task genuinely requires deep reasoning
2. **Use Free tier aggressively** -- mechanical tasks at 0.33x save 3x the budget vs Standard
3. **Never route security to Free** -- security review always needs at least Standard
4. **Ultra (30x) is manual-only** -- never auto-assign to agents; select explicitly via `/models` or Tab
5. **Watch the 5-hour window** -- premium requests reset on a rolling 5-hour window; route to OpenAI Codex models if depleted
6. **Batch mechanical work** -- if you need 10 file transforms, use Free tier

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Use Premium for everything "to be safe" | Route by task complexity |
| Use Free for security reviews | Always use Standard+ for security |
| Assign Ultra (30x) to agents | Reserve Ultra for manual selection only |
| Ignore the multiplier system | Track which tier each task actually needs |
| Use Standard for cleanup/verification | Use Free (0.33x) -- these tasks are mechanical |

---

## See Also

- [cost-tracking](cost-tracking.md) -- Budget tracking and cost optimization
