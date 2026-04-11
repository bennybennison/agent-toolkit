# Optional Runtime

This directory is the long-term home for the optional runtime/enforcement layer inside `agent-toolkit`.

The intended subareas are:

- `entry/` for runtime CLI composition
- `project/` for attach/sync/detach/relink/migrate flows
- `orchestration/` for mission and routing helpers
- `state/` for runtime persistence and resume behavior
- `shadow/` for staging/apply behavior
- `routing/` for model/runtime routing helpers
- `tooling/` for runtime-specific tooling utilities

During migration, some deeper runtime implementation still lives in the legacy compatibility package, but new runtime ownership should move inward here rather than expanding `agent-framework/`.
That runtime implementation is now standalone from the toolkit side. The
vendored compatibility subtree under `framework/` exists so `agent-toolkit
runtime` can run without the sibling `agent-framework/` package being present.

Current toolkit-owned modules already here:

- `global-install.ts`
- `project/attach.ts`
- `project/adapter-lifecycle.ts`
- `project/migrate.ts`
- `shadow/commands.ts`
- `status.ts`
- `tool-commands.ts`
- `framework/lib/`
- `framework/hooks/`
- `framework/templates/`
