# BaSYS Codex Template

Portable Codex setup for BaSYS metadata repositories.

## Layout

```text
codex-template/
  README.md
  gitignore.codex-snippet
  AGENTS.md
  .agents/
    skills/
    references/basys/
  .codex/
    config.toml
    README.md
    mcp/
      basys-mcp-proxy.js
      basys-credentials.example.json
    rules/
      default.rules
```

## Install Into a Project

Copy the Codex project files into the target repository root:

```powershell
Copy-Item -Recurse -Force .\dist\codex-template\AGENTS.md C:\Path\To\Your\Project\
Copy-Item -Recurse -Force .\dist\codex-template\.agents C:\Path\To\Your\Project\
Copy-Item -Recurse -Force .\dist\codex-template\.codex C:\Path\To\Your\Project\
```

Then merge `gitignore.codex-snippet` into the target repository `.gitignore`.
Do not blindly overwrite an existing `.gitignore`.

## Local BaSYS MCP Configuration

Prefer environment variables:

```text
BASYS_URL=https://<basys-host>:<port>
BASYS_DB_NAME=<database-name>
BASYS_LOGIN=<user-login>
BASYS_PASSWORD=<user-password>
```

For local development only, you may copy:

```text
.codex/mcp/basys-credentials.example.json
```

to:

```text
.codex/mcp/basys-credentials.json
```

The real credentials file must stay untracked.

## Verify After Copying

1. Start Codex from the target project root.
2. Check that Codex loads `AGENTS.md` and repo skills from `.agents/skills`.
3. Open `/mcp` and verify that `basys-mcp` is enabled.
4. Ask Codex to list available BaSYS MCP tools.

## Notes

- `AGENTS.md` is the always-on project guidance.
- `.agents/skills` contains reusable Codex workflows.
- `.agents/references/basys` contains converted BaSYS domain rules.
- `.codex/config.toml` contains project-scoped Codex settings and MCP config.
- `.codex/rules` is only for Codex command execution policy, not BaSYS domain rules.
