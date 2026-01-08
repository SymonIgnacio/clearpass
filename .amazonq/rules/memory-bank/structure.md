# ClearPass Project Structure

## Root Directory Organization

```
clearpass/
├── client/          # React frontend application
├── server/          # Node.js backend API
├── ai_service/      # Python AI/ML service
├── database/        # SQL schema and migrations
├── docs/           # Project documentation
├── scripts/        # Utility and maintenance scripts
├── tests/          # Test suites and sample data
├── logs/           # Application logs
└── uploads/        # File storage directory
```

## Frontend Structure (client/)

### Core Application
- `src/App.jsx` - Main application component with routing
- `src/main.jsx` - Application entry point and React DOM rendering
- `src/index.css` - Global styles and Tailwind imports

### Component Architecture
```
src/components/
├── AccountVerification.jsx    # User account validation
├── BantayChatbot.jsx         # AI assistant interface
├── ErrorBoundary.jsx         # Error handling wrapper
├── Header.jsx                # Navigation header
├── NotificationBell.jsx      # Real-time notifications
├── ProtectedRoute.jsx        # Route access control
├── Sidebar.jsx               # Navigation sidebar
└── WriteProtected.jsx        # Write permission wrapper
```

### Context Management
```
src/contexts/
├── AuthContext.jsx           # Authentication state management
└── NotificationContext.jsx   # Notification system state
```

### Page Components
```
src/pages/
├── admin/                    # Administrative interfaces
│   ├── AIAnalytics.jsx      # AI insights dashboard
│   ├── Backup.jsx           # System backup management
│   └── SystemLogs.jsx       # Audit log viewer
├── Dashboard.jsx            # Main dashboard
├── Login.jsx               # Authentication interface
├── Residents.jsx           # Resident management
├── Blotter.jsx            # Case management
├── Certificates.jsx       # Document processing
└── [role-specific pages]  # Role-based interfaces
```

### Utility Functions
```
src/utils/
├── api.js                   # API client configuration
├── apiHelpers.js           # API utility functions
├── csrf.js                 # CSRF token management
├── dashboardAPI.js         # Dashboard data fetching
├── permissions.js          # Permission checking utilities
└── roles.js               # Role definition constants
```

## Backend Structure (server/)

### Core Server Files
- `index.js` - Express server setup and middleware configuration
- `database.js` - Database connection and query utilities
- `routes.js` - Main route aggregation
- `knexfile.js` - Database configuration

### Controller Layer
```
controllers/
├── authController.js           # Authentication logic
├── residentController.js       # Resident CRUD operations
├── blotterController.js        # Case management logic
├── certificateController.js    # Document generation
├── adminController.js          # Administrative functions
├── userController.js           # User management
└── [specialized controllers]   # Feature-specific logic
```

### Route Layer
```
routes/
├── adminRoutes.js             # Administrative endpoints
├── residentRoutes.js          # Resident management APIs
├── blotterRoutes.js           # Case management APIs
├── certificateRoutes.js       # Document processing APIs
├── userRoutes.js              # User management APIs
└── [feature-specific routes]  # Specialized endpoints
```

### Middleware Layer
```
middleware/
├── authMiddleware.js          # JWT authentication
├── validation.js              # Input validation
├── errorHandler.js            # Error processing
├── logger.js                  # Request logging
├── performanceMetrics.js      # Performance monitoring
└── healthCheck.js             # System health endpoints
```

### Database Layer
```
migrations/                    # Database schema evolution
├── 20250101000000_initial_schema.js
├── 20250102000000_account_hierarchy.js
└── [timestamped migrations]

seeds/                         # Initial data population
├── 01_initial_data.js
├── 02_hierarchy_setup.js
└── 03_initial_staff_users.js
```

## AI Service Structure (ai_service/)

### Core AI Components
- `smart_suggestions.py` - Main AI service server
- `suggestion_engine.py` - ML algorithms and models
- `config.py` - AI service configuration
- `requirements.txt` - Python dependencies

### AI Capabilities
- Document auto-completion suggestions
- Case pattern analysis and predictions
- Form validation and data verification
- Intelligent report generation

## Database Architecture

### Core Tables
- `users` - System user accounts and authentication
- `residents` - Resident profiles and demographic data
- `blotter_cases` - Incident reports and case management
- `certificates` - Generated documents and requests
- `document_templates` - Certificate templates and formats

### Supporting Tables
- `roles` - User role definitions and permissions
- `notifications` - System notifications and alerts
- `audit_logs` - System activity tracking
- `login_attempts` - Security monitoring
- `file_storage` - Document and image storage

## Configuration Management

### Environment Configuration
- `.env` files for environment-specific settings
- Separate configurations for development, testing, production
- Database connection strings and API keys
- Security tokens and encryption keys

### Build Configuration
- `package.json` - Node.js dependencies and scripts
- `vite.config.js` - Frontend build configuration
- `tailwind.config.js` - CSS framework configuration
- `eslint.config.js` - Code quality rules

## Development Scripts

### Database Management
```
scripts/database/
├── migrations/              # Database migration utilities
├── seeds/                   # Data seeding scripts
├── fixes/                   # Schema repair scripts
└── audit_schema.js         # Database validation
```

### System Maintenance
```
scripts/
├── health-check.js          # System health validation
├── verify-completion.js     # Feature completeness check
├── system-status.cjs        # Overall system status
└── validate-env.cjs         # Environment validation
```

## Architectural Patterns

### MVC Architecture
- **Models**: Database schemas and data access layers
- **Views**: React components and user interfaces
- **Controllers**: Business logic and API endpoints

### Role-Based Access Control (RBAC)
- Hierarchical permission system
- Route-level access control
- Component-level permission checking
- API endpoint authorization

### Service-Oriented Design
- Modular service separation (Web, API, AI)
- Independent deployment capabilities
- Microservice communication patterns
- Scalable architecture foundation