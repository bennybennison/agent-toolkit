---
description: "Review code changes for quality, security, and patterns compliance"
mode: "agent"
---

Review the following code for quality issues. Focus on:

1. **Type safety** — missing annotations, unnecessary Any, untyped boundaries
2. **Security** — hardcoded secrets, unsanitised input, injection risks
3. **Architecture** — dependency direction, layer violations, coupling
4. **Patterns** — banned patterns from AGENTS.md, anti-patterns
5. **Testing** — missing coverage, untested edge cases
6. **Maintenance** — files over 300 lines, naming issues

Check `AGENTS.md` and `GOTCHAS.md` before flagging — some patterns may be documented as acceptable.

Only report High and Medium confidence issues. Format each as:

```
[severity] file:line — description
  Fix: what to change
```

${input:scope:What should I review? (file path, recent changes, or specific area)}
