# Project Structure

## Directory Organization

### Root Level
```
clearpass/
├── client/          # React frontend application
├── server/          # Express.js backend API
├── ai_service/      # Python AI microservices
├── tests/           # Integration and unit tests
├── database/        # Database schemas and migrations
├── docs/            # Project documentation
├── scripts/         # Utility and maintenance scripts
└── sql/             # SQL migrations and seeds
```

## Core Components

### Frontend (client/)
```
client/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route-based page components
│   ├── contexts/       # React context providers
│   ├── utils/          # Helper functions and utilities
│   ├── __tests__/      # Frontend tests
│   ├── App.jsx         # Main application component
│   └── main.jsx        # Application entry point
├── public/             # Static assets
├── vite.config.js      # Vite build configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── package.json        # Frontend dependencies
```

**Key Frontend Features:**
- Material-UI component library
- React Router for navigation
- Axios for API communication
- Recharts for data visualization
- Tailwind CSS for styling
- Vite for fast development builds

### Backend (server/)
```
server/
├── controllers/        # Business logic handlers
│   ├── authController.js
│   ├── residentController.js
│   ├── certificateController.js
│   ├── blotterController.js
│   ├── documentController.js
│   ├── householdController.js
│   └── userController.js
├── middleware/         # Express middleware
│   ├── authMiddleware.js      # JWT authentication
│   ├── validate.js            # Input validation
│   ├── errorHandler.js        # Error handling
│   ├── logger.js              # Winston logging
│   └── performanceMetrics.js  # Monitoring
├── routes/            # API route definitions
│   ├── userRoutes.js
│   ├── residentRoutes.js
│   ├── certificateRoutes.js
│   ├── blotterRoutes.js
│   └── adminRoutes.js
├── migrations/        # Knex database migrations
├── seeds/             # Database seed data
├── config/            # Configuration files
│   ├── constants.js
│   └── roles.js
├── utils/             # Utility functions
├── __tests__/         # Backend tests
├── index.js           # Server entry point
├── database.js        # Database connection
└── package.json       # Backend dependencies
```

**Key Backend Features:**
- Express.js REST API
- JWT authentication
- Knex.js ORM with MySQL
- Winston logging
- Helmet security headers
- Rate limiting
- Input validation
- WebSocket support

### AI Services (ai_service/)
```
ai_service/
├── smart_suggestions.py    # AI suggestion engine
├── suggestion_engine.py    # Core AI logic
├── config.py               # AI configuration
├── requirements.txt        # Python dependencies
└── Dockerfile              # Container configuration
```

**AI Capabilities:**
- OCR text extraction
- Chatbot intent recognition
- Field extraction from documents
- Predictive analytics
- Blotter trend analysis

### Database Layer (database/ & sql/)
```
database/
├── ai_tables_migration.sql  # AI feature tables
└── README.md

sql/
├── migrations/              # Schema changes
├── seeds/                   # Initial data
└── fixes/                   # Database fixes
```

**Database Schema:**
- users (authentication and profiles)
- residents (resident information)
- households (family groupings)
- certificates (document records)
- blotter_entries (incident reports)
- document_requests (request tracking)
- templates (certificate templates)
- notifications (system alerts)
- login_attempts (security tracking)

### Testing Infrastructure (tests/)
```
tests/
├── __tests__/                          # Jest tests
├── sample_data/                        # Test fixtures
├── test_ocr_engine.py                  # OCR tests
├── test_chatbot_engine.py              # Chatbot tests
├── test_field_extraction.py            # Extraction tests
├── test_blotter_analytics.py           # Analytics tests
├── test_integration_ocr_to_db_workflow.py
└── test_integration_chatbot_workflow.py
```

### Scripts & Utilities (scripts/)
```
scripts/
├── database/           # Database operations
│   ├── migrations/
│   ├── seeds/
│   └── fixes/
├── maintenance/        # System maintenance
├── testing/            # Test utilities
└── verification/       # System checks
```

### Documentation (docs/)
```
docs/
├── README.md                   # Documentation index
├── PROJECT_STATUS.md           # Current status
├── SETUP_GUIDE.md             # Setup instructions
├── DEPLOYMENT_GUIDE.md        # Deployment guide
├── ARCHITECTURE.md            # System architecture
├── API_REFERENCE.md           # API documentation
├── TESTING_GUIDE.md           # Testing guide
├── PERFORMANCE_GUIDE.md       # Performance optimization
├── CHANGELOG.md               # Version history
├── guides/                    # Detailed guides
└── archive/                   # Historical docs
```

## Component Relationships

### Request Flow
```
Client (React) 
  → API Routes (Express)
    → Middleware (Auth, Validation)
      → Controllers (Business Logic)
        → Database (MySQL via Knex)
          → Response
```

### Authentication Flow
```
Login Request
  → authController.login()
    → Validate credentials
      → Generate JWT token
        → Return token + user data
          → Store in client context
            → Include in subsequent requests
```

### Document Generation Flow
```
Certificate Request
  → certificateController.create()
    → Validate request data
      → Fetch template
        → Populate fields
          → Generate PDF (Puppeteer)
            → Store in database
              → Return certificate
```

### AI Integration Flow
```
Document Upload
  → OCR Processing (Python)
    → Text Extraction
      → Field Recognition
        → Data Validation
          → Database Storage
            → Confirmation
```

## Architectural Patterns

### Backend Architecture
- **MVC Pattern**: Controllers handle business logic, routes define endpoints
- **Middleware Chain**: Authentication → Validation → Controller → Response
- **Repository Pattern**: Database access abstracted through Knex queries
- **Service Layer**: Reusable business logic in controller methods

### Frontend Architecture
- **Component-Based**: Reusable React components with props
- **Context API**: Global state management (AuthContext, ThemeContext)
- **Route-Based Code Splitting**: Pages loaded on-demand
- **Hooks Pattern**: Custom hooks for shared logic

### Database Architecture
- **Normalized Schema**: Relational tables with foreign keys
- **Migration-Based**: Version-controlled schema changes
- **Seed Data**: Consistent initial data across environments
- **Indexing Strategy**: Optimized queries with strategic indexes

### Security Architecture
- **Defense in Depth**: Multiple security layers
- **Principle of Least Privilege**: Role-based access control
- **Input Validation**: Server-side validation on all inputs
- **Secure Communication**: HTTPS, JWT tokens, password hashing

## Technology Stack Summary

### Frontend
- React 18.2 + Vite
- Material-UI 7.3
- React Router 6.8
- Axios, Recharts
- Tailwind CSS

### Backend
- Node.js 18+ / Express 4.18
- MySQL 8.0 + Knex 3.1
- JWT, bcrypt
- Winston, Helmet
- Puppeteer (PDF generation)

### AI Services
- Python 3.x
- OCR libraries
- NLP frameworks
- Analytics engines

### DevOps
- Jest (testing)
- ESLint + Prettier (code quality)
- Nodemon (development)
- Concurrently (multi-process)
