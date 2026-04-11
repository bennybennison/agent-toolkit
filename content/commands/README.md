# Legacy Commands

This directory is a compatibility layer for commands that have not yet moved into packs.

Canonical command definitions should live in pack-owned `commands/` directories under `packs/`.

Only keep command files here when they have not yet been moved into a pack or when they are still being evaluated for pruning, merging, or repackaging.

Pack-owned commands that used to be duplicated here have been removed so the repo has one canonical copy of each migrated command.

Command surfaces:

- `surface: user` — normal user-facing command
- `surface: user-agent` — user-facing command that delegates to a specialist agent
- `surface: internal` — orchestration/internal command that should not be treated as part of the default command surface
