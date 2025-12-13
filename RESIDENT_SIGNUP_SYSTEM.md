# Resident Signup & Document Generation System

## 🎯 System Overview

A comprehensive resident verification and document generation system that allows verified residents to sign up for accounts and request official barangay documents with proof of residency verification.

## 📋 System Features

### ✅ Resident Self-Registration
- **Public Signup Endpoint**: `/api/auth/resident-signup`
- **Proof of Residency**: Required document upload (electric bill, water bill, cedula, etc.)
- **Resident Verification**: Must be registered in barangay database
- **Account Activation**: Officer approval required before login

### ✅ Document Generation System
- **13 Document Types**: Barangay Clearance, Indigency Certificate, Business Closure, etc.
- **Two-Phase Workflow**: Request → Officer Approval → PDF Generation
- **Configurable Validity**: Officers set document validity periods
- **QR Code Validation**: Secure document verification
- **Audit Trail**: Complete tracking of all requests and approvals

### ✅ Security & Verification
- **File Upload Validation**: JPEG, PNG, GIF, PDF only (max 5MB)
- **Duplicate Prevention**: One account per resident
- **Officer Review**: All signup requests require manual approval
- **Document Verification**: QR codes for authenticity checking

## 🔧 Technical Implementation

### Database Tables
```sql
-- Resident Signup Requests
CREATE TABLE resident_signup_requests (
    request_id VARCHAR(50) PRIMARY KEY,
    resident_id VARCHAR(50) NOT NULL, -- Links to residents table
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(100),
    mobile_number VARCHAR(20),
    proof_of_residency_path VARCHAR(255) NOT NULL,
    proof_type VARCHAR(50) NOT NULL, -- electric_bill, water_bill, cedula, etc.
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_by VARCHAR(50),
    review_notes TEXT,
    created_user_id VARCHAR(50), -- User ID created upon approval
    FOREIGN KEY (resident_id) REFERENCES residents(Resident_ID)
);

-- Document Requests
CREATE TABLE document_requests (
    request_id VARCHAR(50) PRIMARY KEY,
    resident_id VARCHAR(50) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    request_data JSON NOT NULL,
    resident_data JSON NOT NULL,
    approval_data JSON,
    qr_code TEXT,
    control_number VARCHAR(100),
    valid_until TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(Resident_ID)
);
```

### API Endpoints

#### Public Endpoints (No Authentication)
```javascript
// Resident Signup
POST /api/auth/resident-signup
// FormData: proof_document (file), resident_id, username, password, full_name, email, mobile_number, proof_type, notes

// Login (after approval)
POST /api/auth/login
```

#### Protected Endpoints (Officer Only)
```javascript
// Review signup requests
GET /api/auth/resident-signups/pending
PUT /api/auth/resident-signups/{request_id}/review
GET /api/auth/resident-signups/stats

// Document management
GET /api/documents/pending
PUT /api/documents/requests/{request_id}/approve
GET /api/documents/requests/{request_id}/download
```

#### Resident Endpoints (After Login)
```javascript
// Document requests (residents with 'resident' role)
GET /api/documents/types
POST /api/documents/requests
GET /api/documents/requests
GET /api/documents/requests/{request_id}/download
```

## 🔄 User Workflow

### Resident Signup Process
1. **Resident Access**: Visit signup page (no login required)
2. **Enter Information**: Resident ID, personal details, username/password
3. **Upload Proof**: Electric bill, water bill, cedula, or other proof of residency
4. **Submit Request**: Form submitted to `resident_signup_requests` table
5. **Wait for Approval**: Status remains 'pending'
6. **Officer Review**: Barangay officer reviews proof document
7. **Account Creation**: Upon approval, user account created and resident notified

### Document Request Process
1. **Login**: Resident logs in with approved account
2. **Select Document**: Choose from 13 available document types
3. **Fill Form**: Enter required information (purpose, additional details)
4. **Submit Request**: Document request created with 'pending' status
5. **Officer Approval**: Officer reviews and approves with validity period
6. **PDF Generation**: System generates official document with QR code
7. **Download**: Resident can download completed document

## 📄 Supported Document Types

| Document Type | Required Fields | Estimated Processing Time |
|---------------|-----------------|---------------------------|
| Barangay Clearance | Purpose | 2-3 days |
| Bonafide Certificate | Purpose | 2-3 days |
| Building Permit | - | 5-7 days |
| Business Closure | Business Name, Address, Closure Date | 3-5 days |
| Cohabitation Certificate | Partner Names, Dates, Children Count | 5-7 days |
| Excavation Permit | - | 3-5 days |
| Fencing Permit | - | 3-5 days |
| Good Moral Certificate | School Year, Purpose | 2-3 days |
| Indigency Certificate | Purpose, Specific Purpose | 2-3 days |
| Late Registration | Father Name, Mother Name | 3-5 days |
| OJT Certification | - | 2-3 days |
| Low Income Housing | Monthly Income | 2-3 days |
| Medico-Legal | Requestor Name, Blotter Reference | 5-7 days |

## 🔐 Security Features

### File Upload Security
- **Type Validation**: Only JPEG, PNG, GIF, PDF allowed
- **Size Limits**: Maximum 5MB per file
- **Path Sanitization**: Secure file storage in `uploads/resident_signup/`
- **Unique Naming**: Files renamed with request ID to prevent conflicts

### Authentication Security
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: 1-day expiration
- **Role-Based Access**: Residents limited to document requests only
- **Resident Verification**: Must exist in barangay database

### Document Security
- **QR Code Validation**: Each document has unique verification code
- **Control Numbers**: Unique tracking numbers for all documents
- **Audit Logging**: All actions tracked in audit_log table
- **Approval Workflow**: No document generated without officer approval

## 🎨 Frontend Integration

### Resident Signup Form
```jsx
// Public signup page
const ResidentSignup = () => {
  const [formData, setFormData] = useState({
    resident_id: '',
    username: '',
    password: '',
    full_name: '',
    email: '',
    mobile_number: '',
    proof_type: 'electric_bill',
    notes: ''
  });

  const [proofDocument, setProofDocument] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key]);
    });
    formDataToSend.append('proof_document', proofDocument);

    const response = await fetch('/api/auth/resident-signup', {
      method: 'POST',
      body: formDataToSend
    });

    const result = await response.json();
    if (result.success) {
      alert('Signup request submitted! You will be notified once approved.');
    }
  };
};
```

### Document Request Form
```jsx
// Protected resident page
const DocumentRequest = () => {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetch('/api/documents/types')
      .then(res => res.json())
      .then(data => setDocumentTypes(data.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch('/api/documents/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_type: selectedType.id,
        request_data: formData
      })
    });

    const result = await response.json();
    if (result.success) {
      alert('Document request submitted successfully!');
    }
  };
};
```

## 📊 Officer Dashboard

### Pending Signups
- View all resident signup requests
- Review proof of residency documents
- Approve or reject requests with notes
- Statistics dashboard

### Document Approvals
- Review pending document requests
- Set validity periods per document
- Generate official documents
- Track approval metrics

## 🚀 Deployment Checklist

- [ ] Run database migrations: `knex migrate:latest`
- [ ] Create uploads directory: `mkdir -p uploads/resident_signup`
- [ ] Configure file permissions for uploads
- [ ] Test resident signup endpoint
- [ ] Test document request workflow
- [ ] Verify QR code generation
- [ ] Test officer approval process

## 🔧 Configuration

### Environment Variables
```env
# File upload settings
MAX_FILE_SIZE=5242880  # 5MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Document validity (default)
DEFAULT_DOCUMENT_VALIDITY_DAYS=365

# Upload directories
RESIDENT_SIGNUP_UPLOAD_DIR=uploads/resident_signup/
DOCUMENT_UPLOAD_DIR=uploads/documents/
```

### File Structure
```
server/
├── migrations/
│   ├── 20250104000000_resident_signup_requests.js
│   └── 20250103000000_document_requests.js
├── authController.js (enhanced with signup)
├── documentController.js
└── index.js (updated routes)

uploads/
├── resident_signup/     # Proof of residency documents
└── documents/          # Generated PDFs (optional)

client/
├── pages/
│   ├── ResidentSignup.jsx
│   ├── DocumentRequest.jsx
│   └── OfficerDashboard.jsx
```

## 🎯 Benefits

### For Residents
- **Self-Service**: Request documents anytime without visiting barangay hall
- **Digital Verification**: QR codes ensure document authenticity
- **Status Tracking**: Real-time updates on request status
- **Secure Access**: Personal account with document history

### For Barangay Officers
- **Streamlined Process**: Digital approval workflow
- **Document Security**: Controlled issuance with audit trail
- **Efficiency**: Reduced manual paperwork
- **Verification**: Proof of residency ensures legitimate requests

### For Barangay Administration
- **Complete Digital Trail**: All actions logged and auditable
- **Security**: Resident verification prevents unauthorized access
- **Scalability**: System handles multiple document types
- **Compliance**: Proper document validation and tracking

This comprehensive system transforms the traditional barangay document process into a modern, secure, and efficient digital workflow while maintaining proper verification and approval controls.
