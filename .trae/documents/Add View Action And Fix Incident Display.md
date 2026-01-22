## Agreed Changes
- Show complainant first and last name in officer Requests list.
- Add eye icon to view request details.
- Ensure guests (role 13) cannot create blotter requests at the server level.

## Implementation
1. Server: restrict resident submission
- Update POST /api/blotter-requests to include checkRole([12]) so role 13 (guest) cannot submit.

2. Server: include complainant name in list
- Update listRequests to LEFT JOIN residents on complainant_resident_id and return complainant_name = CONCAT(First_Name,' ',Last_Name).

3. Client: update Requests table
- Add Incident fallback display (incident_type || '—').
- Add Complainant column rendering complainant_name.
- Add eye IconButton to navigate to /officer/request/:id.

## Verification
- Guests blocked server-side; resident submits fine.
- Officer list shows Incident, Complainant; eye icon opens detail page.