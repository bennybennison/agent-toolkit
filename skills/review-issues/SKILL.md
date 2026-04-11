---
name: "review-issues"
description: "Review a bug report, issue, pull request, or local diff with a code-review mindset. Use when the user wants risks, missing context, edge cases, implementation guidance, or verification steps before coding or merging."
starter: true
---

# Review Issues

Use this skill as the Codex-facing review entrypoint for Agent Toolkit.

This plugin does not create a separate agent picker inside Codex. Instead, Codex should use this skill when the user asks to review an issue, PR, diff, bug report, or planned change.

## When To Use It

Use this skill when the user asks for any of the following:

- review a GitHub issue, bug report, or feature request
- review a pull request, branch, patch, or local diff
- identify risks, regressions, missing tests, or edge cases before implementation
- turn an issue into an implementation plan or verification checklist

## Workflow

1. Resolve the review target.
   - If the user provided an issue, PR, or URL, use that directly.
   - If the request is about the current repo or local changes, inspect the local checkout and diff first.
   - If the scope is still ambiguous, ask for the smallest missing piece of context.
2. Gather compact evidence.
   - Read the issue text, PR summary, changed files, or relevant local files.
   - Use configured MCP servers from this plugin when they help, especially for GitHub-backed issue and PR context.
   - Keep context narrow and avoid broad repo exploration unless the review target truly requires it.
3. Review with a code-review mindset.
   - Prioritize correctness, behavioral regressions, security risks, missing validation, migration risks, and test gaps.
   - Prefer concrete findings over generic advice.
   - If there are no clear problems, say so explicitly and note any residual uncertainty.
4. End with a decision-ready output.
   - For issues: summarize implementation risks, open questions, and a safe plan.
   - For PRs or diffs: list findings first, then note verification coverage and any missing tests.

## Output Shape

- Start with the most important findings or risks.
- Reference concrete files, behaviors, APIs, or edge cases where possible.
- Keep the answer concise and actionable.
- If the user wants fixes after review, switch from review to implementation only after making that transition explicit.
