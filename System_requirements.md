ROLE 1: IT Admin (System & Technical Authority)
Purpose
Responsible for maintaining system availability, security, configuration, and RBAC enforcement. This role does not participate in any barangay operational transactions.
Modules, Pages, and Access
• IT Admin Dashboard (/admin/dashboard) – Monitor system health, usage, uptime, and logs
• User & Role Management (/admin/users) – Manage staff accounts and role assignments
• System Logs & Audit Trail (/admin/logs) – Review security and activity records
• System Configuration (/admin/settings) – Configure SMS, QR rules, and sessions
• Backup & Restore (/admin/backup) – Ensure data continuity
• AI Analytics (Technical View) (/admin/ai-analytics) – Monitor AI model accuracy (read-only)
________________________________________
ROLE 2: Administrative Clearance Clerks
Purpose
Handle certificate processing and resident verification based on validated data.
Core Restrictions
. Cannot manually register residents
. Cannot handle blotter cases
Modules, Pages, and Access
• Clerk Dashboard (/clerk/dashboard) – View request workload and processing KPIs
• Resident Verification (/clerk/residents) – Verify resident-submitted profiles and IDs
• Clearance Processing (/clerk/clearances) – Process certificate requests
• Document Issuance (/clerk/documents) – Generate and release certificates
• Notifications (/clerk/notifications) – Receive real-time task alerts
• AI Workload Insights (/clerk/ai-insights) – Forecast certificate demand
________________________________________
ROLE 3: Blotter Officer
Purpose
Sole authority for validating, investigating, classifying, and resolving blotter cases.
Modules, Pages, and Access
• Blotter Dashboard (/officer/dashboard) – Monitor case status and KPIs
• Resident-Submitted Complaints (/officer/cases) – Review complaints filed online
• New Case Encoding (/officer/new-case) – Encode validated complaints
• Case Review & Timeline (/officer/case/:id) – Manage case progress and evidence
• Hearing Attendance Logs (/officer/attendance) – Track QR-based attendance
• Blotter Reports (/officer/reports) – Generate monthly summaries
• AI Crime Analytics (/officer/ai-analytics) – Identify crime patterns and hotspots
________________________________________
ROLE 4: Residents (Expanded Capabilities)
Purpose
Enable residents to digitally access barangay services, self-register with document verification, apply for beneficiary status with proof requirements, request certificates, and safely file blotter complaints, including vulnerable cases.

Document Verification Requirements
• All vulnerability declarations (4Ps, PWD, Solo Parent, OSY) require supporting documents
• Accepted formats: JPG, PNG, PDF (max 5MB per file)
• Required documents by category:
  - 4Ps: Pantawid ID or Certificate from DSWD
  - PWD: PWD ID or Medical Certificate
  - Solo Parent: Solo Parent ID or Court Documents
  - OSY: School Certificate or Barangay Certification
• Documents are reviewed and verified by Secretary before approval

Open Registration System
• Residents can self-register online without pre-existing household assignment
• Registration requires valid government-issued ID upload for identity verification
• Accepted IDs: National ID, Driver's License, Passport, Voter's ID, SSS/GSIS ID
• All registrations are pending verification until Secretary approval
• Verified residents gain full access to barangay services

Modules, Pages, and Access
• Resident Registration (/resident/register) – Submit personal details, valid ID, and supporting documents
• Document Upload Interface – Secure file upload with preview and validation
• Resident Login (/resident/login) – Secure access to the resident portal
• Resident Dashboard (/resident/dashboard) – View request status, profile, and announcements
• Profile & Identity Verification (/resident/profile) – Manage personal data and document uploads
• Blotter Complaint Filing (/resident/blotter-report) – File digital complaints without face-to-face interaction
Vulnerability Support (Integrated):
Residents may declare vulnerability during blotter filing, such as:
• Women / Children
• Senior Citizens
• Persons with Disability (PWD)
• Victims of domestic violence or abuse
• Threatened or at-risk individuals
. Vulnerability-tagged cases are flagged for priority review, handled confidentially, and visible only to authorized roles (Blotter Officer and Secretary).
• Clearance Requests (/resident/request-clearance) – Request certificates subject to eligibility
• My Requests & History (/resident/requests) – Track submitted requests
• Barangay Announcements (/resident/announcements) – View official notices
________________________________________
ROLE 5: Barangay Captain (Executive – Read Only)
Purpose
Provide executive oversight and data-driven governance without performing operational actions.
Core Restrictions
. No encoding
. No approvals
. No modifications
Modules, Pages, and Access
• Executive Dashboard (/captain/dashboard) – High-level barangay statistics
• Resident Statistics (/captain/residents) – Population and demographic data
• Blotter Monitoring (/captain/blotters) – View blotter trends
• Clearance Trends (/captain/clearances) – Certificate issuance patterns
• Reports & Analytics (/captain/reports) – Download governance reports
• AI Executive Insights (/captain/ai-insights) – Forecast-based decision support
________________________________________
ROLE 6: Barangay Secretary
Purpose
Primary administrative authority responsible for resident validation, document verification, beneficiary approval with proof review, clearance supervision, and blotter oversight.

Document Verification Authority
• Review and approve/reject resident registration applications
• Verify authenticity of uploaded government IDs and supporting documents
• Approve vulnerability status based on submitted proof documents
• Maintain document audit trail for all verifications
• Flag suspicious or fraudulent document submissions

Core Restrictions
. Cannot encode blotter cases
Modules, Pages, and Access
• Secretary Dashboard (/secretary/dashboard) – Overview of operations and pending verifications
• Resident Records Oversight (/secretary/residents) – Validate resident registrations and documents
• Document Verification Queue (/secretary/document-verification) – Review uploaded documents
• Beneficiary Validation (/secretary/beneficiaries) – Approve PWD, Senior, and other statuses with proof
• Blotter Oversight (/secretary/blotters) – Monitor cases, including vulnerable ones
• Clearance Oversight (/secretary/clearances) – Supervise and override approvals
• Reports & Analytics (/secretary/reports) – Generate administrative reports
• AI Risk & Demand Insights (/secretary/ai-analytics) – Identify high-risk areas
• Administrative Settings (/secretary/settings) – Manage barangay policies and seals
________________________________________
AI Predictive Analytics (Cross-Role)
Capabilities
• Population growth forecasting
• Certificate demand prediction
• Crime hotspot identification
• Beneficiary and vulnerability service demand analysis
• Document verification fraud detection patterns
• Registration approval workflow optimization

System Security & Compliance
• All uploaded documents are encrypted and stored securely
• Document access is logged and audited
• GDPR-compliant data handling for personal documents
• Automatic document retention and disposal policies
• Multi-factor authentication for document verification roles

