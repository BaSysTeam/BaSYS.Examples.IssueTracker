# Codex Project Guidance

## Project Overview

This repository contains BaSYS metadata settings exported from a BaSYS application.
Codex should treat the repository as metadata-as-code: inspect schemas and existing
objects, edit the requested settings locally, and keep changes ready for import
back into BaSYS.

Use the user's language in conversation. In this project that is usually Russian.

## Safety Rules

- Do not edit `manifest.json`.
- Do not edit files under `system/`, except for the documented temporary
  `system/dataTypes.json` append when creating a new reference-kind metaobject.
- Read `system/dataTypes.json`, `system/kinds/`, and `system/schemas/` as source
  material for UIDs, kind capabilities, data types, and JSON schemas.
- Do not rename existing folders, files, metadata `name` values, or Cyrillic
  identifiers. They may be referenced by BaSYS.
- Do not introduce npm dependencies for `.bjs` or `.vue` runtime code.
- Do not commit or copy real credentials into template files.

## BaSYS Conventions

- New technical identifiers use English `snake_case`; UI titles may be Russian.
- Generate fresh lowercase UUID v4 values for new objects, columns, forms,
  commands, steps, and nested items.
- Fill `memo` for new metadata entities with a short purpose description.
- New columns are stored by default: set `kind = 0` unless the user explicitly
  asks for a virtual/non-stored column.
- Prefer BaSYS.FX helpers and the BaSYS query builder over ad hoc database logic
  where the platform provides an equivalent.
- Keep JavaScript logic in companion `.bjs` files when the metadata convention
  expects a filename reference in JSON.

## Reference Documents

Detailed BaSYS rules live in `.agents/references/basys/`. Read the relevant file
before editing that area:

- `general-conventions.md` for cross-cutting metadata rules.
- `commands.md` for form commands and `*.command.*.bjs`.
- `constructor-forms.md` for `*.form.*.json`.
- `programmable-forms.md` for `*.form.*.vue`.
- `records-creation.md` for records posting and `*.records_source.*.bjs`.
- `workflows.md` for `workflow/` and `*.step.*.bjs`.
- `menu.md` for `menu/`.
- `data-view-reports.md` for `data_view/`.
- `excel-reports.md` for `excel_report/`.
- `print-forms.md` for `*.print_form.*`.

## Skills

Repo-scoped Codex skills live in `.agents/skills/`. Use them for repeatable
creation workflows, especially:

- `create-catalog`
- `create-enum`
- `create-register`
- `create-records`
- `create-operation`
- `create-list-form`
- `create-edit-form`
- `create-fill-workflow`
- `excel-import-to-detail`

When a task matches one of these workflows, load the skill first and follow its
checklist. If a skill and a reference document both apply, use the skill for the
procedure and the reference document for domain details.

## MCP

The portable Codex MCP template is under `.codex/`. It should use environment
variables for local BaSYS connection details:

- `BASYS_URL`
- `BASYS_DB_NAME`
- `BASYS_LOGIN`
- `BASYS_PASSWORD`

Do not hard-code machine-local paths, database names, usernames, passwords, or
developer-specific ports into shared Codex configuration.
