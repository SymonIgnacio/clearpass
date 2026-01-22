## Update Requested
- Add the officer/admin Requests page entry to the app sidebar under the existing "Case Management" section.

## Implementation Plan
1. Sidebar Navigation Update
- Modify the sidebar/nav component to include a link labeled "Blotter Requests" under the Case Management group.
- Route: /officer/requests
- Visibility: only for admin and blotter officer roles.

2. Verification
- Open the app as officer/admin and confirm the link appears in Case Management.
- Clicking should navigate to the list view and show requests.

## Notes
- No changes to routes/pages logic; purely a navigation addition aligned with existing role-guarding.
- If the sidebar groups are defined via a config, update that config; otherwise, update the component rendering Case Management items.

## Next Step
- I will add the nav item under Case Management and verify role-based visibility.