# Codex Setup for BaSYS Metadata Projects

This directory is a portable Codex template for BaSYS metadata repositories.

## What It Contains

- `config.toml` - project-scoped Codex configuration.
- `mcp/basys-mcp-proxy.js` - stdio-to-HTTP proxy for the BaSYS MCP endpoint.
- `mcp/basys-credentials.example.json` - local credentials file template.
- `rules/default.rules` - command permission rules template.

## Recommended Configuration

Set BaSYS connection details with environment variables:

```text
BASYS_URL=https://<basys-host>:<port>
BASYS_DB_NAME=<database-name>
BASYS_LOGIN=<user-login>
BASYS_PASSWORD=<user-password>
```

The proxy also supports a local `.codex/mcp/basys-credentials.json` file copied
from `basys-credentials.example.json`, but that file must stay untracked.

## Verify

1. Start Codex from the project root.
2. Open `/mcp` in Codex and check that `basys-mcp` is enabled.
3. Ask Codex to list available BaSYS MCP tools.

## Template Rules

- Do not add absolute paths.
- Do not add real credentials.
- Keep domain guidance in `AGENTS.md`, `.agents/skills`, and
  `.agents/references/basys`.
- Use `.codex/rules` only for command execution policy.
