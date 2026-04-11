---
rule: mcp-servers
scope: universal
profile: all
tags: [mcp, tools, external]
---

# MCP Servers

The toolkit supports modular MCP server categories through reusable packs and templates.

## Available Categories

| Category | Typical Use |
|----------|-------------|
| `mcp-dev` | docs, code search, developer tooling |
| `mcp-cloud` | hosting, observability, cloud-provider workflows |
| `mcp-web` | browser automation and web extraction |
| `mcp-comms` | email, chat, calendar, collaboration |
| `mcp-ecommerce` | ecommerce platform integrations |
| `mcp-data` | databases, file transfer, data services |

## Rules

- Prefer targeted MCP use over broad tool sprawl
- Enable only the categories the project actually needs
- Use MCP tools when they materially improve the answer, not by default for every question
- Store MCP credentials in environment-backed config, never in source
- Prefer specialized MCP docs/code-search tools before scraping or manual browsing where appropriate

## Portability

MCP configuration should be pack-driven and host-neutral first. Host adapters can render it into VS Code, Codex, OpenCode, or other surfaces afterward.
