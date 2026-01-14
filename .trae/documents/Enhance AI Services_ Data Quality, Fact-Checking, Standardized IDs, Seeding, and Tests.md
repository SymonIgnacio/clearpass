## Clarifying Questions (Planning Mode)
1. For “fact-checking using verified sources (sitios)”: do you mean validating AI statements against the internal `sitios` master table, or pulling external authoritative sources (web/PSA/LGU datasets) and storing citations?
2. Should the canonical case ID be generated **server-side only** (client-provided IDs ignored/rejected), or do you need offline/client pre-generation support?
3. Which status vocabulary is the final contract for cases: exactly `pending|resolved|in-progress|rejected`, or do you also need existing values like `Active|Dismissed|Scheduled for Mediation` preserved/mapped?
4. Target benchmark volumes for AI processing (rough order): 1k, 10k, 100k blotter rows? And which endpoints must meet SLAs (`/api/ai-analytics/*`, `/api/ai/patrol`, Python chatbot)?

## Current State (What I Found)
- AI is split between:
  - Node SQL/heuristics analytics ([aiAnalyticsController.js](file:///c:/xampp/htdocs/clearpass/server/controllers/aiAnalyticsController.js))
  - Node proxy to a Flask AI service ([aiRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/aiRoutes.js))
  - Legacy duplicated AI/blotter routes in [routes.js](file:///c:/xampp/htdocs/clearpass/server/routes.js)
- `blotter.Case_Number` is intended as `BLOT-YYYY-MM-0001`, but there are **multiple generators** (frontend + multiple backend variants) and a seed script that inserts `CASE-2025-...`.
- Schema inconsistency risk: migrations reference both `Status` and `status` with different enum sets.
- There is already a strong “system audit” script that inspects schema, counts, orphans, and distributions ([audit-system.cjs](file:///c:/xampp/htdocs/clearpass/scripts/verification/audit-system.cjs)); we can extend it into the requested “Database Analysis Phase” output.

## Phase 1 — Database Analysis & Data Quality Reporting
- Extend the existing audit tooling to produce a repeatable “DB analysis report”:
  - Schema inventory: tables, columns, types, indexes, constraints, enums
  - Relationship graph: PK/FK map + orphan checks (expand beyond current limited set)
  - Data quality metrics per critical table:
    - Null/empty rate, distinct counts, duplicate keys
    - Enum/value distribution (status, sitio)
    - JSON validity checks for `Complainant_Details` / `Respondent_Details`
    - Temporal sanity checks (future dates, inverted ranges)
  - Output artifacts: `reports/db-analysis.json` + `reports/db-analysis.md`

## Phase 2 — Standardize Case IDs (BLOT-2026-01-0006) End-to-End
- Make the server authoritative for `Case_Number`.
- Add DB-level enforcement via Knex migration:
  - `CHECK`/`REGEXP` constraint (MySQL 8) to enforce `^BLOT-\d{4}-\d{2}-\d{4}$`
  - Unique index stays on `Case_Number`
- Add a transaction-safe ID allocator:
  - New table `blotter_case_sequences(year, month, next_seq)`
  - Generator uses a single transaction to increment and return the next sequence
- Remove/disable conflicting generators:
  - Update controllers/routes that currently generate `BLOT-${Date.now()}` variants
  - Update frontend to stop generating IDs (display server-returned value)
- Migration/data fix step:
  - Convert existing `CASE-...` rows to the new format (with mapping table/log) or quarantine them (based on your preference)

## Phase 3 — AI Reasoning Improvements (Validation, Confidence, Cross-Reference, Audit Trails)
- Add a shared “analysis contract” used by both Node analytics and Python patrol suggestions:
  - Input validation layer (schema validation + required fields + enum normalization)
  - Confidence scoring:
    - Based on sample size + recency + distribution stability
    - Trend confidence using regression goodness-of-fit (Python) and windowed variance (Node)
  - Cross-referencing with authoritative datasets:
    - Treat `sitios` as the canonical reference set; verify every `Location_Sitio` used in outputs exists and attach sitio metadata
    - (Optional if you confirm external sources) add citation fetching + caching
- Implement audit trails:
  - New tables like `ai_analysis_runs`, `ai_analysis_facts`, `ai_analysis_sources`
  - Store: request payload hash, queries executed (or query IDs), derived facts, confidence scores, output, timestamps, model/version identifiers
  - Ensure every AI endpoint returns `auditId` and an optional `evidence` bundle for traceability

## Phase 4 — Data Population (Statistically Representative + Edge Cases + Integrity)
- Create a deterministic dataset generator (seedable RNG) with two modes:
  - Bulk load (generate N households/residents/blotter rows)
  - Incremental load (append new cases for later dates)
- Enforce variation requirements:
  - Status types: pending/resolved/in-progress/rejected (plus mapping for legacy values if needed)
  - Diverse incident categories/subcategories and priorities
  - Realistic timestamp distributions + edge cases (same-day bursts, missing optional fields, extreme narratives length, invalid attempts for negative tests)
  - Referential integrity: ensure residents/households/sitios referenced exist
- Add validation checks that fail fast before insert and after insert (integrity + distributions match targets).

## Phase 5 — Automated Verification, Benchmarks, and Regression Tests
- Add Jest suites to cover:
  - Case ID generator: regex, uniqueness, monotonicity per month, concurrency safety
  - Status vocabulary: acceptance + normalization + DB constraint enforcement
  - Data generator: referential integrity, distribution assertions, incremental vs bulk behavior
  - AI analytics: confidence scoring bounds and evidence/audit ID presence
- Add performance benchmarks:
  - Script/test that seeds datasets at configured sizes and measures endpoint latencies
  - Store baseline results in CI artifacts; fail builds when regressions exceed thresholds
- Add regression suite wiring:
  - Hook into existing server test setup and reuse the verification scripts where possible

## Implementation Notes (Risk & Cleanup)
- Address the `Status` vs `status` mismatch with a single canonical column and a migration that safely backfills.
- Reduce duplication by making modular routes/controllers the only source of truth (deprecate legacy `routes.js` endpoints) so AI reasoning and validations apply uniformly.

If you confirm the answers to the four questions above, I’ll implement the full set: migrations + generator + seeding + audit tables + upgraded AI responses + automated verification + benchmark tests.