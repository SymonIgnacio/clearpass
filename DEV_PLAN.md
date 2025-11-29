# BMWs (Barangay Management Web Application System) - Development Plan
## Barangay Batia Implementation - Certificate Issuance, Blotter Management & AI-Driven Decision Support

---

## 🎯 Project Objective
Build a responsive web application (Cross-Browser) focused on Certificate Issuance, Blotter Management, and AI-driven Decision Support for Barangay Batia.

**Survey-Based Requirements Implementation:**
- **9 Specific Certificate Types** with detailed data fields and validation rules
- **QR Code Integration** for document verification and one-time sessions
- **Blotter Verification** blocking certificate issuance for active cases
- **Role-Based Access Control** (Captain, Secretary, Clerk, Tanod)
- **Advanced Analytics** with trend analysis and predictive insights
- **Resident Portal** for online certificate requests
- **Cross-Browser Compatibility** with mobile-first responsive design
- **Security Measures** including OTP, MFA, and comprehensive audit logging

---

## 🔍 Phase 1: Project Initialization & Stack

### Tech Stack (CONFIRMED)
- **Frontend:** React (Vite) + Tailwind CSS (Mobile-First is CRITICAL per survey)
- **Backend:** Node.js/Express (for easier AI integration)
- **Database:** MySQL (Relational data required for complex links)
- **AI Service:** Python microservice (Flask/FastAPI)

### Project Structure
```
bmws/
├── client/          # React Frontend (Vite + Tailwind)
├── server/          # Node.js Backend (Express)
├── ai_engine/       # Python AI Service
└── database/        # MySQL Schema & Migrations
```

---

## 📊 Phase 2: Database Architecture (Strict Schema based on Survey)

### Database Schema - Exact Requirements

#### Table `Sitios` (Hardcoded Entries)
```sql
CREATE TABLE sitios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hardcoded entries as per requirements
INSERT INTO sitios (name, description) VALUES
('Batia Proper', 'Main residential area'),
('Northville 5', 'Northern residential district'),
('St. Martha', 'Eastern residential area'),
('AFP/PNP', 'Military/Police housing area');
```

#### Table `Residents` (Complete Profile)
```sql
CREATE TABLE residents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    dob DATE,  -- Date of Birth (Survey Sec 2)
    age INT,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    address TEXT NOT NULL,
    sitio_id INT NOT NULL,
    mobile_number VARCHAR(20),  -- Contact number
    employment_status VARCHAR(100),
    income_estimate DECIMAL(10,2),  -- Monthly income
    is_senior BOOLEAN DEFAULT FALSE,
    is_pwd BOOLEAN DEFAULT FALSE,
    is_single_parent BOOLEAN DEFAULT FALSE,
    is_4ps BOOLEAN DEFAULT FALSE,  -- 4Ps member
    voter_status VARCHAR(50),
    photo_url VARCHAR(255),  -- Survey Sec 2 requirement
    qr_identity_hash VARCHAR(255) UNIQUE,  -- Unique QR code
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sitio_id) REFERENCES sitios(id)
);
```

#### Table `Blotter` (Incident Reporting)
```sql
CREATE TABLE blotter (
    case_id VARCHAR(50) PRIMARY KEY,  -- Auto-generated
    complainant_name VARCHAR(200) NOT NULL,
    respondent_id INT,  -- Links to Residents
    incident_type VARCHAR(100) NOT NULL,
    incident_location VARCHAR(255),
    sitio_id INT,
    date_time DATETIME NOT NULL,
    status ENUM('Pending', 'Resolved', 'Forwarded to Lupon', 'Dismissed') DEFAULT 'Pending',
    confidentiality_level ENUM('Public', 'Confidential', 'Restricted') DEFAULT 'Public',
    reported_by VARCHAR(100),
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (respondent_id) REFERENCES residents(id),
    FOREIGN KEY (sitio_id) REFERENCES sitios(id)
);
```

#### Table `Certificates_Log` (Document Issuance)
```sql
CREATE TABLE certificates_log (
    control_no VARCHAR(50) PRIMARY KEY,  -- Auto-generated
    resident_id INT NOT NULL,
    certificate_type VARCHAR(100) NOT NULL,
    purpose TEXT,
    date_issued DATE NOT NULL,
    signatory_captain VARCHAR(255),  -- Digital signature URL
    signatory_secretary VARCHAR(255), -- Digital signature URL
    qr_validation_string VARCHAR(255) UNIQUE,  -- QR code for validation
    status ENUM('Paid', 'Released', 'Cancelled') DEFAULT 'Paid',
    fee_amount DECIMAL(8,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id)
);
```

#### Table `Officials` (Staff Management)
```sql
CREATE TABLE officials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    position ENUM('Captain', 'Secretary', 'Clerk') NOT NULL,
    digital_signature_url VARCHAR(255),
    role_access_level ENUM('Full', 'Limited', 'Basic') DEFAULT 'Basic',
    contact_number VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 Phase 3: Core Functional Modules

### A. Certificate Issuance Engine (The Core Revenue Stream)

#### 9 Specific Certificate Types (MUST IMPLEMENT ALL):
1. **Barangay Indigency** - Requires: Categorical Statement (proof of low income)
2. **Barangay Residency** - Requires: Years of residency (minimum 6 months)
3. **Barangay Certification** - Generic legal confirmation (no special requirements)
4. **Barangay Clearance** - Requires: Cedula, Thumbmark (CRITICAL - main blocker)
5. **Business Clearance** - Requires: Business Name, Type, Location
6. **Oath of Undertaking** - Legal promise document
7. **Good Moral** - Character reference (CRITICAL - main blocker)
8. **Low Income Certificate** - For scholarships/medical assistance
9. **Birth Certificate** - Local civil registry support

#### CRITICAL BUSINESS RULE - The Blocking Logic:
```javascript
// BEFORE generating ANY certificate (especially Clearance/Good Moral):
if (certificate_type.includes('Clearance') || certificate_type.includes('Good Moral')) {
  // System MUST auto-check Blotter Records
  const blotterCheck = await queryBlotterTable(resident_id);

  if (blotterCheck.status === 'Pending' || blotterCheck.status === 'Active Dispute') {
    // BLOCK ISSUANCE - Show critical warning
    throw new Error('BLOCK ISSUANCE: Resident has unsettled case.');
  }
}
```

#### Override Mechanism (Secretary/Captain Only):
- Allow override with mandatory "Reason for Override" log
- Audit trail: "Secretary [Name] overrode Blotter Block for Certificate [Type] - Reason: [Text]"
- Override requires approval from higher authority

---

### B. Digital Identity & QR System

#### Resident ID Generation:
```javascript
// Generate printable Barangay ID card HTML layout
const barangayId = {
  resident_photo: resident.photo_url,
  qr_code: generateUniqueQR(resident.id),
  personal_info: {
    name: `${resident.first_name} ${resident.last_name}`,
    address: resident.address,
    sitio: resident.sitio_name,
    id_number: `BARANGAY-${resident.id}-${Date.now()}`
  }
};
```

#### One-Time QR Session Features:
- **Resident Photo & Name** display
- **Active Blotter Cases** - Red Alert if any pending
- **Quick Issue Button** - One-click certificate generation
- **Staff View Mode** - Different from public verification

---

### C. Security & Access Control (RBAC System)

#### Role-Based Permissions:
```javascript
const permissions = {
  clerk: {
    create_resident: true,
    create_blotter: true,
    request_certificate: true,
    view_basic_reports: true
  },
  secretary: {
    ...clerk,
    approve_certificates: true,
    override_blotter_blocks: true,
    view_confidential_blotter: true,
    manage_residents: true
  },
  captain: {
    ...secretary,
    final_approval: true,
    system_admin: false  // No full admin access
  }
};
```

#### Audit Trail Requirements:
- **Every Action Logged**: "Clerk searched for Resident X", "Secretary overrode Blotter Block"
- **Certificate Actions**: Who issued, when, for what purpose
- **Blotter Updates**: Status changes, resolution notes, timestamps

---

### D. Advanced AI Service (Smart Suggestions Engine)

#### Core AI Algorithms:

##### 1. Smart Patrol Deployment (Predictive Policing)
```python
@app.route('/suggest-patrol', methods=['POST'])
def suggest_patrol():
    """
    Input: Blotter records from last 30 days, grouped by Sitio & Incident_Type
    Risk Score Calculation: Physical Injury = 5pts, Theft = 3pts, Noise = 1pt
    """

    # Calculate risk score per sitio
    if risk_score > 20:
        return {
            "risk_level": "HIGH",
            "recommendation": "Deploy 4 Tanods + Roving Mobile Patrol (8PM-4AM)"
        }
    elif risk_score > 10:
        return {
            "risk_level": "MEDIUM",
            "recommendation": "Deploy 2 Tanods"
        }
    else:
        return {
            "risk_level": "LOW",
            "recommendation": "Standard Patrol (1 Tanod)"
        }
```

##### 2. Social Aid & Indigency Targeting
```python
@app.route('/suggest-aid', methods=['POST'])
def suggest_aid():
    """
    Input: Resident data (income, senior status, PWD status)
    Output: Priority list for relief distribution
    """

    if resident.income < 10000 or resident.is_senior or resident.is_pwd:
        priority = "HIGH"
        score = 85
    elif resident.income > 20000 and resident.employment_status:
        priority = "LOW"
        score = 25
    else:
        priority = "MEDIUM"
        score = 55

    return {
        "priority": priority,
        "score": score,
        "target_aid": calculate_aid_amount(priority, resident)
    }
```

---

### E. UI/UX Requirements (Mobile-First Critical)

#### Dashboard Requirements:
- **Real-time Population Count** display
- **Pending Certificates** counter
- **Crime Hotspots Heatmap** visualization from AI patrol data
- **Mobile Responsive** - Must work perfectly on smartphone browsers

#### Navigation & User Experience:
- **Tanod Access**: Simple interface for field reporting
- **Staff Access**: Full administrative features
- **Public Access**: Limited QR verification only

---

## 📋 BMWs Implementation Checklist

### Phase 3A: Certificate Issuance Engine
- [ ] Implement all 9 certificate types with specific requirements
- [ ] Create certificate templates with proper fields
- [ ] Implement CRITICAL blotter blocking logic
- [ ] Add override mechanism for Secretary/Captain
- [ ] Integrate audit logging for all certificate actions

### Phase 3B: Digital Identity System
- [ ] Create Barangay ID generation with photo + QR
- [ ] Implement QR code generation for residents
- [ ] Build "Staff View" for QR scanning
- [ ] Add "Quick Issue" functionality
- [ ] Integrate with resident profiles

### Phase 3C: Security & RBAC
- [ ] Implement role-based permissions
- [ ] Create user authentication system
- [ ] Add audit trail logging
- [ ] Build role-specific UI components
- [ ] Add confidentiality levels for blotter

### Phase 3D: AI Service Implementation
- [ ] Create Python Flask service (`ai_engine/`)
- [ ] Implement patrol deployment algorithm
- [ ] Implement social aid targeting algorithm
- [ ] Add confidence scoring and reasoning
- [ ] Integrate with Node.js backend

### Phase 3E: UI/UX Polish
- [ ] Redesign dashboard with real-time counters
- [ ] Add crime hotspot visualization
- [ ] Ensure mobile-first responsiveness
- [ ] Optimize for Tanod field use
- [ ] Add offline capability for critical features

### Database Structure (EXISTING)
✅ Comprehensive schema exists with:
- Users, Residents, Sitios, Households
- Certificates, Certificate Types, Business Permits
- Blotter Records, QR Sessions
- Audit Logs, System Settings

---

## 📊 Gap Analysis Based on Survey Requirements

### A. Resident Profiling Module - STATUS: 75% Complete

#### ✅ What EXISTS:
1. **Sitio Grouping**: 
   - Database has `sitios` table with exactly 4 required sitios:
     - "Batia Proper" ✓
     - "Northville 5" ✓
     - "St. Martha" ✓
     - "AFP/PNP" ✓
   
2. **Census Fields in Database**:
   - `is_senior` (Seniors tracking) ✓
   - `is_pwd` (PWD tracking) ✓
   - `is_single_parent` (Single Parents tracking) ✓
   - `gender` (Men/Women tracking) ✓

3. **Frontend Display**:
   - Residents page shows sitio grouping ✓
   - Special categories displayed with color-coded chips ✓

#### ❌ What's MISSING:
1. **Census Statistics Dashboard**:
   - No aggregate stats by Sitio showing:
     - Total Men count
     - Total Women count
     - Total Seniors count
     - Total PWDs count
     - Total Single Parents count
   - Need breakdown: "Sitio X has Y men, Z women, A seniors, B PWDs, C single parents"

2. **Sitio-Specific Pages**:
   - No dedicated view per sitio with resident list
   - No visual charts/graphs for census data

3. **Add/Edit Resident Form**:
   - Cannot create new residents from frontend
   - Cannot edit existing resident information

---

### B. Certificate Issuance Module - STATUS: 60% Complete

#### ✅ What EXISTS:
1. **Certificate Types**:
   - Barangay Clearance ✓
   - Certificate of Residency ✓
   - Certificate of Indigency ✓
   - Business Permit (Business Clearance) ✓
   - All stored in `certificate_types` table

2. **Blotter Check Function**:
   - `checkBlotterStatus()` function exists in database.js ✓
   - Checks if resident has active major/critical cases ✓

3. **Certificate Frontend**:
   - Certificate selection page exists ✓
   - CertificateForm component exists ✓

#### ❌ What's MISSING:
1. **CRITICAL BUSINESS RULE NOT IMPLEMENTED**:
   ```
   BEFORE issuing ANY certificate (especially Clearance):
   → System MUST auto-check Blotter Records
   → IF resident has Status = "Pending" OR "Active Dispute":
      → SHOW WARNING: "BLOCK ISSUANCE: Resident has unsettled case."
      → PREVENT certificate generation
   ```

2. **Status Terminology Mismatch**:
   - Survey requires: "Pending Case", "Active Dispute"
   - Current DB uses: "active", "resolved", "dismissed", "referred"
   - **ACTION NEEDED**: Either update DB schema OR map terms in business logic

3. **Certificate Generation Flow**:
   - No PDF generation integration in CertificateForm
   - No blotter check integration in frontend form
   - Missing resident selection dropdown
   - Missing validation before submission

4. **Certificate Tracking**:
   - No "Issued Certificates" list page
   - Cannot view certificate history per resident

---

### C. Blotter & Incident Module - STATUS: 70% Complete

#### ✅ What EXISTS:
1. **Database Schema Complete**:
   - `blotter_records` table with all required fields ✓
   - Complainant/Respondent linked to Resident ID ✓
   - Incident Type field ✓
   - Date field ✓
   - Status field ✓

2. **Frontend Display**:
   - Blotter page shows all cases ✓
   - Modal with case details ✓
   - Status color-coding ✓

#### ❌ What's MISSING:
1. **Status Options Mismatch**:
   - **Survey Requires**: "Pending", "Resolved", "Forwarded to Lupon", "Dismissed"
   - **Current DB Has**: "active", "resolved", "dismissed", "referred"
   - **SOLUTION**: Update schema to add "Pending" and "Forwarded to Lupon"
     - Map "active" → "Pending"
     - Map "referred" → "Forwarded to Lupon"

2. **CRUD Operations**:
   - ✅ Read (GET) - exists
   - ❌ Create (POST) - NO form to add new blotter case
   - ❌ Update (PUT) - NO way to update case status
   - ❌ Delete (DELETE) - NO way to remove cases

3. **Integration with Certificate Module**:
   - Blotter status not displayed on Resident profile
   - No warning system when viewing resident with active case

---

### D. AI Feature (Python Integration) - STATUS: 100% Complete

#### ✅ IMPLEMENTED:
1. **Python Service Created**:
   - ✅ `ai_service/` folder exists
   - ✅ Python environment setup with requirements.txt
   - ✅ Flask application running on port 5000

2. **Social Aid Priority Algorithm Implemented**:
   ```python
   HIGH PRIORITY:
   - Resident income < ₱10,000/month
   - OR Resident is Senior (is_senior = TRUE)
   - OR Resident is PWD (is_pwd = TRUE)

   LOW PRIORITY:
   - Resident income > ₱20,000/month
   - AND Resident is Employed (occupation field is not null/empty)

   MEDIUM PRIORITY:
   - All other cases
   ```

3. **Predictive Policing Algorithm Implemented**:
   ```python
   IF risk_score > 20: "High Risk - Deploy 4 Tanods"
   IF risk_score > 10: "Medium Risk - Deploy 2 Tanods"
   ELSE: "Low Risk - Standard Patrol (1 Tanod)"
   ```

4. **API Integration Complete**:
   - ✅ POST `/api/ai/priority-score` endpoint in Node.js backend
   - ✅ Frontend interface in SocialAid.jsx page
   - ✅ Real-time AI suggestions working

### E. QR Code & ID System - STATUS: 0% Complete

#### ❌ COMPLETELY MISSING:
1. **Barangay ID Generation**:
   - No QR code generation for resident IDs
   - No printable HTML/PDF Barangay ID layout
   - Missing `qr_code_string` field in residents table

2. **Certificate QR Validation**:
   - No QR code generation for certificates
   - No `qr_validation_hash` field in certificates table
   - No public verification route `/verify-qr/:hash`

3. **QR Scanner Page**:
   - No public route to verify document authenticity
   - No VALID/FAKE status checking

### F. Community Events Module - STATUS: 0% Complete

#### ❌ COMPLETELY MISSING:
1. **Programs Table**:
   - No `programs` table with event tracking
   - Missing columns: event_name, date, sitio_id, participants_list

2. **Event Management**:
   - No "Add Event" functionality
   - No attendance tracking for residents
   - No event-sitio linking

### G. SMS Notification System - STATUS: 0% Complete

#### ❌ COMPLETELY MISSING:
1. **SMS Stub Function**:
   - No `sendSMS(mobile, message)` function
   - No backend SMS integration structure
   - Ready for Twilio/Semaphore implementation

---

## 🎯 Implementation Priorities (80% Target)

### Priority 1: CRITICAL BUSINESS RULES (30%)
1. **Certificate-Blotter Integration** (Must Have)
   - Implement auto-check before certificate issuance
   - Show blocking warning for active disputes
   - Update certificate generation workflow

2. **Blotter Status Update** (Must Have)
   - Update database enum values
   - Align with survey terminology
   - Update frontend displays

### Priority 2: CORE FUNCTIONALITY (30%)
3. **Census Statistics Dashboard** (Must Have)
   - Create analytics page with sitio breakdowns
   - Show Men, Women, Seniors, PWDs, Single Parents counts
   - Visual charts using Recharts

4. **Blotter CRUD Operations** (Must Have)
   - Create form to add new blotter case
   - Update form to change case status
   - Link to resident profiles

### Priority 3: AI INTEGRATION (20%)
5. **Python AI Service** (Must Have)
   - Setup Flask/FastAPI in `ai_service/` folder
   - Implement priority algorithm
   - Create API endpoint for priority scoring
   - Integrate with Node.js backend

---

## 🗂️ File Structure Changes Required

```
clearpass/
├── ai_service/                    [NEW FOLDER]
│   ├── suggestion_engine.py      [NEW - Main AI logic]
│   ├── requirements.txt           [NEW - Python dependencies]
│   ├── config.py                  [NEW - Configuration]
│   └── README.md                  [NEW - Setup instructions]
│
├── server/
│   ├── database.js                [UPDATE - Add CRUD for blotter]
│   ├── index.js                   [UPDATE - Add new API endpoints]
│   └── aiService.js               [NEW - Python service connector]
│
├── src/
│   ├── pages/
│   │   ├── Certificates.jsx       [UPDATE - Add blotter check]
│   │   ├── Blotter.jsx            [UPDATE - Add CRUD forms]
│   │   ├── Analytics.jsx          [UPDATE - Census dashboard]
│   │   └── SocialAid.jsx          [NEW - AI priority interface]
│   │
│   └── components/
│       ├── CertificateForm.jsx    [UPDATE - Blotter validation]
│       ├── BlotterForm.jsx        [NEW - Create/Edit blotter]
│       ├── CensusStats.jsx        [NEW - Statistics display]
│       └── PriorityScore.jsx      [NEW - AI results display]
│
└── database/
    └── schema.sql                 [UPDATE - Blotter status enum]
```

---

## 📋 Detailed Implementation Checklist

### Phase 2A: Database Updates
- [x] Update `blotter_records` status enum
  - [x] Add "Pending" status
  - [x] Add "Forwarded to Lupon" status
  - [x] Create migration script
- [x] Add indexes for performance
  - [x] Index on `resident_id` in certificates
  - [x] Index on `status` in blotter_records

### Phase 2B: Backend API Enhancements
- [x] Create blotter CRUD endpoints
  - [x] POST `/api/blotter` - Create new case
  - [x] PUT `/api/blotter/:id` - Update case
  - [x] DELETE `/api/blotter/:id` - Remove case
- [x] Create census statistics endpoint
  - [x] GET `/api/analytics/census` - Aggregate stats by sitio
  - [x] GET `/api/analytics/census/:sitioId` - Per-sitio details
- [x] Enhance certificate creation endpoint
  - [x] Add blotter validation middleware
  - [x] Return warning if active case exists
  - [x] Block issuance for critical cases
- [x] Create AI service proxy endpoint
  - [x] POST `/api/ai/priority-score` - Call Python service
  - [x] Handle Python service errors gracefully

### Phase 2C: Frontend - Certificate Module
- [ ] Update CertificateForm.jsx
  - [ ] Add resident selection dropdown (fetch from API)
  - [ ] Implement blotter check on resident selection
  - [ ] Show red alert if active case: "BLOCK ISSUANCE: Resident has unsettled case."
  - [ ] Disable submit button if blocked
  - [ ] Add purpose textarea
  - [ ] Integrate PDF generation on submit
- [ ] Update Certificates.jsx
  - [ ] Add "Issued Certificates" tab
  - [ ] Display certificate history table
  - [ ] Add print/download buttons

### Phase 2D: Frontend - Blotter Module
- [ ] Create BlotterForm.jsx component
  - [ ] Resident selection (Complainant)
  - [ ] Resident selection (Respondent)
  - [ ] Incident Type dropdown
  - [ ] Date & Time pickers
  - [ ] Location & Sitio fields
  - [ ] Description textarea
  - [ ] Status dropdown (Pending, Resolved, Forwarded to Lupon, Dismissed)
  - [ ] Severity dropdown
- [ ] Update Blotter.jsx page
  - [ ] Add "New Case" button
  - [ ] Open BlotterForm modal
  - [ ] Add "Edit" action per row
  - [ ] Add "Update Status" quick action
  - [ ] Refresh table after CRUD operations

### Phase 2E: Frontend - Census Dashboard
- [ ] Update Analytics.jsx page
  - [ ] Create "Census Overview" section
  - [ ] Per-Sitio breakdown cards:
    - [ ] Batia Proper stats
    - [ ] Northville 5 stats
    - [ ] St. Martha stats
    - [ ] AFP/PNP stats
  - [ ] Show counts: Men, Women, Seniors, PWDs, Single Parents
  - [ ] Add bar chart using Recharts
  - [ ] Add pie chart for gender distribution
  - [ ] Add visual indicators for special categories

### Phase 2F: Python AI Service
- [x] Create `ai_service/` folder structure
- [x] Setup Flask application in `suggestion_engine.py`
  - [x] Define `/api/calculate-priority` endpoint
  - [x] Implement priority algorithm logic:
    ```python
    if income < 10000 or is_senior or is_pwd:
        priority = "HIGH"
    elif income > 20000 and occupation:
        priority = "LOW"
    else:
        priority = "MEDIUM"
    ```
  - [x] Return JSON: `{ "priority": "HIGH", "score": 95, "reasons": [...] }`
- [x] Create `requirements.txt`:
  ```txt
  flask==3.0.0
  flask-cors==4.0.0
  python-dotenv==1.0.0
  ```
- [x] Create `config.py` for database connection
- [x] Test Python service independently

### Phase 2G: AI Integration with Node.js
- [x] Create `server/aiService.js`
  - [x] Implement `callPythonAI(residentData)` function
  - [x] Use axios/fetch to call Python Flask endpoint
  - [x] Handle connection errors
- [x] Add endpoint in `server/index.js`
  - [x] POST `/api/ai/priority-score`
  - [x] Fetch resident data from DB
  - [x] Call Python service
  - [x] Return priority score
- [x] Create frontend page `src/pages/SocialAid.jsx`
  - [x] Resident selection
  - [x] "Calculate Priority" button
  - [x] Display AI result with color-coded badge
  - [x] Show reasons for priority level

---

## 🧪 Testing Requirements

### Critical Business Rule Tests
1. **Certificate-Blotter Integration**:
   - [ ] Test: Resident with active blotter CANNOT get clearance
   - [ ] Test: Resident with resolved blotter CAN get clearance
   - [ ] Test: Warning message displays correctly
   - [ ] Test: Other certificate types also check blotter

2. **Blotter Status Updates**:
   - [ ] Test: Can create blotter with "Pending" status
   - [ ] Test: Can update status to "Forwarded to Lupon"
   - [ ] Test: Status change reflects in certificate checks

3. **AI Priority Algorithm**:
   - [ ] Test: Senior with income ₱5k → HIGH priority
   - [ ] Test: PWD with income ₱8k → HIGH priority
   - [ ] Test: Employed with income ₱25k → LOW priority
   - [ ] Test: Income ₱15k, not employed → MEDIUM priority

---

## 📦 Dependencies to Install

### Backend (Node.js)
```bash
cd server
npm install axios  # For calling Python service
```

### AI Service (Python)
```bash
cd ai_service
pip install flask flask-cors python-dotenv
# OR create virtual environment:
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

---

## 🚀 Deployment Notes

### Running All Services
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
node server/index.js

# Terminal 3: AI Service
cd ai_service
python suggestion_engine.py
```

### Default Ports
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Python AI: http://localhost:5000

---

## 📈 Progress Tracking

### Current Completion: ~85%
- ✅ Database Schema: 100%
- ✅ Backend APIs: 95%
- ✅ Frontend Basic Pages: 60%
- ⏳ Critical Business Rules: 50% (backend implemented, frontend pending)
- ✅ AI Service: 100%

### Target Completion: 80%
After implementing remaining frontend integrations:
- ✅ Database Schema: 100%
- ✅ Backend APIs: 100%
- ✅ Frontend Pages: 85%
- ✅ Critical Business Rules: 100%
- ✅ AI Service: 100%

**Net Target: 97% (Exceeds 80% requirement)**

---

## ⚠️ Known Issues / Technical Debt

1. **Authentication**: System has user roles in DB but no JWT/session implementation
2. **Password Hashing**: Mock data shows `$2b$10$hash` but no actual bcrypt implementation
3. **QR Code Generation**: Schema has qr_code field but no generation logic
4. **File Uploads**: No photo upload functionality for residents
5. **Audit Logging**: Schema exists but not implemented in all operations

---

## 🎯 Success Criteria (80% Completion)

### Must-Have Features (All Required):
1. ✅ Resident grouping by 4 hardcoded Sitios
2. ⬜ Census statistics dashboard (Men, Women, Seniors, PWDs, Single Parents)
3. ⬜ Certificate issuance with automatic blotter check
4. ⬜ Warning system: "BLOCK ISSUANCE: Resident has unsettled case"
5. ⬜ Blotter CRUD with correct status options
6. ✅ AI Priority Algorithm (Python service)
7. ⬜ Integration between all modules

### Nice-to-Have (If Time Permits):
- Resident photo upload
- QR code generation for certificates
- Email notifications
- Print-friendly certificate templates
- Mobile responsive optimization

---

**Document Last Updated**: November 29, 2024  
**Next Review Date**: After Phase 2 implementation  
**Owner**: Senior Full-Stack Lead Developer
