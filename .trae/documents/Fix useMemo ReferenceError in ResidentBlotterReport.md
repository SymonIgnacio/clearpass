## Root Cause
- useMemo is referenced but not imported in [ResidentBlotterReport.jsx:L38-L44](file:///c:/xampp/htdocs/clearpass/client/src/pages/ResidentBlotterReport.jsx#L38-L44)
- Current imports only include React, useState, useEffect: see [ResidentBlotterReport.jsx:L1](file:///c:/xampp/htdocs/clearpass/client/src/pages/ResidentBlotterReport.jsx#L1)

## Proposed Fix
- Update the React import to include useMemo:
  - import React, { useState, useEffect, useMemo } from 'react'
- Keep existing style consistent with other files (named hooks in the same import).

## Verification
- Reload /resident/blotter-report and confirm the error is gone.
- Run lint to ensure no-undef and react-hooks rules pass (zero warnings required).
- Quick project-wide scan for other useMemo usages without import; patch similarly if found.

## Notes
- This aligns with React 18 + Vite usage; JSX automatic runtime does not auto-import hooks.
- No behavior change beyond fixing the ReferenceError; memoization logic remains intact.

## Clarifying Questions
- Should I also scan for other hooks (useCallback, useRef) missing imports across the client and fix them in the same pass?
- Do you prefer splitting the hook into a separate import (import { useMemo } from 'react') or keeping a single combined import with React, useState, useEffect?