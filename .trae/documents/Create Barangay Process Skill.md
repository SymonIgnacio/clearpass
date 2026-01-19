I will create a new skill named `barangay-system-architect` that encapsulates the workflows and validation rules described in your provided summary.

### Plan: Create "Barangay System Architect" Skill

1.  **Create Skill Directory**:
    *   Path: `.trae/skills/barangay-system-architect`

2.  **Create Skill Definition (`SKILL.md`)**:
    *   **Name**: `barangay-system-architect`
    *   **Description**: "Provides architectural guidance for barangay system processes, validation logic, and workflows. Invoke when implementing resident features, certificate requests, or admin dashboards."
    *   **Content**:
        *   **Core Workflows**: Detailed steps for Resident Registration (Gatekeeping), Identity Verification (KYC), and Certificate Request Lifecycle.
        *   **Validation Rules**: Specific logic for cross-checking registry data and enforcing verified status before service access.
        *   **Best Practices**: Security patterns (Role enforcement, State transitions) and Data integrity rules (Reporting logic).

### Proposed Skill Content Preview

```markdown
---
name: "barangay-system-architect"
description: "Provides architectural guidance for barangay system processes, validation logic, and workflows. Invoke when implementing resident features, certificate requests, or admin dashboards."
---

# Barangay System Architect

This skill assists in implementing robust real-world processes for a Barangay Management Information System (BMIS).

## Core Workflows

### 1. Resident Access & Verification
**Pattern:** Pre-registration Gatekeeping
- **Rule:** Users cannot sign up unless their profile exists in the `Resident Registry`.
- **Flow:** Admin records Resident -> User Sign Up -> System validates against Registry -> Account Created.

### 2. Certificate Issuance Lifecycle
**Pattern:** Request-Approval-Fulfillment
- **Prerequisite:** User must be `Verified`.
- **Flow:** Request (Pending) -> Admin Review -> Approve/Print -> Resident Claim -> Mark Completed.

## Validation & Security Practices
- **Role Enforcement:** Strict checks for `is_verified` on service endpoints.
- **State Integrity:** Prevent invalid transitions (e.g., Pending to Completed).
```