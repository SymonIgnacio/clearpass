# Memory Bank (Repo Docs)

This folder is a lightweight “memory bank” for storing long-lived system knowledge inside the repository: configuration, operational parameters, historical notes, and current system state.

The goal is to make critical context easy to find, review, and update over time using normal git history.

## CLI Tools

This repository includes a comprehensive audit and documentation system.

### Usage

```bash
# Scan project files and regenerate documentation
npm run memory-bank scan

# Record a new audit entry (interactive)
npm run audit

# Create a backup of the memory bank
npm run memory-bank backup
```

### Components

- **Indexer**: Recursively scans files and builds a dependency graph (`data/file-index.json`).
- **Doc Generator**: Creates `system/CODE_MAP.md` from file metadata and comments.
- **Auditor**: Logs changes to `entries/audit-log.md` and `data/audit-history.json`.

## What goes here

- Configuration settings (env vars, feature flags, ports, external services)
- Operational parameters (retention policies, rate limits, job schedules)
- Historical data (major incidents, migrations, architectural decisions)
- System state snapshots (deploy topology, current constraints, known issues)

## How to add/update information

- Add a new entry under [entries/](entries/) using the [entry template](templates/ENTRY_TEMPLATE.md).
- Prefer small, scoped updates so diffs stay readable.
- Cross-link to relevant code or docs paths where possible.

## Indexing

Use:
- `category`: one of `configuration`, `operational-parameters`, `historical-data`, `system-state`, `architecture`
- `tags`: short, consistent keywords (e.g. `auth`, `db`, `migrations`, `retention`, `security`)

## Retrieval

Recommended ways to search:
- IDE search for `tags:` or a subsystem keyword (`JWT`, `Knex`, `CSRF`, `retention`)
- Jump via [STRUCTURE.md](STRUCTURE.md) and [INDEX.md](INDEX.md)
