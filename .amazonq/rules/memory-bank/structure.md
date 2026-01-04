# Project Structure

## Directory Organization

### Root Level Architecture
```
clearpass/
├── client/          # React frontend application (Vite + React 18)
├── server/          # Express.js backend API (Node.js 18+)
├── ai_service/      # Python AI microservice (OCR, chatbot, analytics)
├── database/        # SQL migration files and database documentation
├── tests/           # Integration and unit tests (Jest, Python unittest)
├── scripts/         # Maintenance, testing, and verification utilities
├── docs/            # Comprehensive system documentation
├── sql/             # SQL fixes, migrations, and seed data
└── uploads/         # Temporary file storage for document uploads
```

## Core Components & Relationships

### Frontend (client/)
**Technology**: React 18 + Vite + TailwindCSS + Material-UI

**Structure**:
```
client/src/
├── components/      # Reusable UI components (forms, tables, modals)
├── pages/          # Route-level page components (Dashboard, Settings, Documents)
├── contexts/       # React Context providers (AuthContext, ThemeContext)
├── utils/          # Helper functions and API client utilities
└── __tests__/      # Frontend unit tests
```

**Key Patterns**:
- Component-based architecture with functional components and hooks
- Context API for global state (authentication, user data)
- Axios-based API client with environment-configured base URLs
- Protected routes with role-based access control

### Backend (server/)
**Technology**: Express.js + MySQL2 + Knex.js + JWT

**Structure**:
```
server/
├── controllers/     # Business logic handlers (11 controllers)
├── routes/         # API route definitions (6 modular route files)
├── middleware/     # Request processing (auth, validation, error handling)
├── config/         # Configuration constants and role definitions
├── migrations/     # Knex database migrations (17 migration files)
├── seeds/          # Database seed data for initial setup
├── utils/          # Utility functions (performance, migrations)
├── templates/      # PDF document templates
├── uploads/        # Temporary file storage
└── __tests__/      # Backend unit tests
```

**Key Patterns**:
- MVC architecture with separated concerns
- Modular routing under `/api/*` prefix
- Middleware chain: helmet → cors → rate limiting → auth → validation
- Controller-based business logic with database abstraction via Knex

### AI Service (ai_service/)
**Technology**: Python 3.8+ + Flask/FastAPI + TensorFlow/PyTorch

**Structure**:
```
ai_service/
├── smart_suggestions.py   # Main AI service entry point
├── suggestion_engine.py   # Recommendation algorithms
├── config.py              # AI service configuration
└── requirements.txt       # Python dependencies
```

**Integration**: REST API endpoints consumed by Node.js backend

### Database Layer
**Technology**: MySQL 8.0+ with Knex.js query builder

**Schema Organization**:
- **User Management**: users, roles, login_attempts
- **Resident Data**: residents, households, resident_signup_requests
- **Document System**: document_requests, document_templates, certificates
- **Blotter System**: blotter_entries, blotter_participants
- **Notifications**: notifications table with user targeting
- **File Storage**: MEDIUMBLOB columns for document attachments

**Migration Strategy**: Sequential timestamped migrations with rollback support

## Architectural Patterns

### API Architecture
- **RESTful Design**: Resource-based endpoints with HTTP verb semantics
- **Route Prefix**: All API routes under `/api/*` namespace
- **Modular Routes**: Separated by domain (admin, blotter, census, certificates, residents, users)
- **Inline Handlers**: Legacy monolithic handlers in `server/index.js` (100+ endpoints) - scheduled for refactoring

### Authentication Flow
1. User submits credentials → `/api/auth/login`
2. Server validates → bcrypt password comparison
3. JWT token generated → 24-hour expiration
4. Token stored client-side → localStorage
5. Subsequent requests → Authorization header with Bearer token
6. Middleware validates → `authMiddleware.js` verifies JWT and role

### Data Flow Pattern
```
Client Request → Express Router → Auth Middleware → Validation Middleware 
→ Controller → Database (Knex) → Response Formatter → Client
```

### Error Handling Strategy
- Centralized error handler middleware (`errorHandler.js`)
- Consistent error response format: `{ error: string, details?: object }`
- HTTP status codes: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 500 (server)
- Winston logging for error tracking

## Component Relationships

### Frontend ↔ Backend
- Axios HTTP client with base URL from `VITE_API_URL` environment variable
- JWT token attached to requests via Axios interceptors
- Role-based UI rendering based on user context

### Backend ↔ Database
- Knex.js query builder for SQL abstraction
- Connection pooling for performance
- Parameterized queries for SQL injection prevention

### Backend ↔ AI Service
- HTTP requests to Python service endpoints
- Async processing for OCR and analytics
- Fallback handling when AI service unavailable

## Configuration Management
- **Environment Variables**: `.env` files in root, server, and client directories
- **Secrets**: Database credentials, JWT secrets, API keys stored in `.env` (not committed)
- **Constants**: Shared constants in `server/config/constants.js` and `server/config/roles.js`

## Build & Deployment Structure
- **Development**: Concurrent execution of client (Vite dev server), server (nodemon), and AI service
- **Production**: Client builds to static files → served by Express or CDN
- **Database**: Migrations run via Knex CLI before deployment
- **Process Management**: PM2 or systemd for server process supervision
