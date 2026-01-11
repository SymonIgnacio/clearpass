# Memory Bank Structure

## Top-Level

- `README.md`: purpose and usage
- `INDEX.md`: quick navigation
- `entries/`: curated, categorized knowledge entries
- `templates/`: standard templates for new entries

## Entry conventions

File naming:
- Use `kebab-case.md`
- Keep entries short and focused (one topic per file)

Required front matter section (at the top of each entry):
- `title`
- `category`
- `tags`
- `last_updated`
- `owners`

## Categories

- `configuration`: env vars, ports, integration endpoints, feature flags
- `operational-parameters`: thresholds, limits, schedules, retention rules
- `historical-data`: incidents, migrations, significant changes
- `system-state`: current state snapshots and constraints
- `architecture`: system structure, key flows, cross-cutting concerns

