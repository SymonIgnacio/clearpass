# ClearPass - Project Structure & Architecture

## Directory Organization

### Root Level Structure
```
clearpass/
├── client/          # React frontend application
├── server/          # Node.js backend API
├── ai_service/      # Python AI analytics engine
├── database/        # SQL schemas and migrations
├── tests/           # Test suites and sample data
├── scripts/         # Automation and maintenance scripts
├── docs/            # Documentation and guides
├── logs/            # Application logs
└── uploads/         # File storage directory
```

## Core Components & Relationships

### Frontend Architecture (client/)
```
client/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── NotificationBell.jsx
│   ├── contexts/       # React context providers
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   ├── pages/          # Route-specific components
│   │   ├── admin/      # Admin-specific pages
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   └── [role-specific pages]
│   ├── utils/          # Helper functions and API clients
│   │   ├── api.js
│   │   ├── permissions.js
│   │   └── roles.js
│   └── App.jsx         # Main application component
├── public/             # Static assets
└── package.json        # Dependencies and scripts
```

### Backend Architecture (server/)
```
server/
├── controllers/        # Business logic handlers
│   ├── authController.js
│   ├── residentController.js
│   ├── blotterController.js
│   ├── certificateController.js
│   └── [role-specific controllers]
├── middleware/         # Request processing middleware
│   ├── authMiddleware.js
│   ├── validate.js
│   ├── errorHandler.js
│   └── logger.js
├── routes/            # API endpoint definitions
│   ├── adminRoutes.js
│   ├── residentRoutes.js
│   ├── blotterRoutes.js
│   └── [role-specific routes]
├── migrations/        # Database schema changes
├── seeds/            # Initial data population
├── config/           # Configuration constants
├── utils/            # Helper utilities
└── index.js          # Server entry point
```

### AI Service Architecture (ai_service/)
```
ai_service/
├── smart_suggestions.py    # Main AI service
├── suggestion_engine.py    # Analytics engine
├── config.py              # AI configuration
├── requirements.txt       # Python dependencies
└── test_ai_service.py     # AI service tests
```

## Architectural Patterns

### Role-Based Access Control (RBAC)
- **6 Distinct Roles**: IT Admin, Captain, Secretary, Clerk, Blotter Officer, Resident
- **Granular Permissions**: Each role has specific endpoint access
- **Middleware Enforcement**: Authentication and authorization at route level
- **Context-Aware UI**: Components render based on user permissions

### API Design Patterns
- **RESTful Architecture**: Standard HTTP methods and status codes
- **Resource-Based URLs**: `/api/residents`, `/api/blotter`, `/api/certificates`
- **Consistent Response Format**: Standardized JSON responses with error handling
- **Middleware Chain**: Authentication → Validation → Business Logic → Response

### Database Design Patterns
- **Migration-Based Schema**: Version-controlled database changes
- **Seed Data Management**: Consistent initial data across environments
- **Audit Trail**: Comprehensive logging of all data modifications
- **Soft Deletes**: Data preservation with archive functionality

### Frontend Patterns
- **Context-Based State**: Global state management with React Context
- **Protected Routes**: Authentication-aware routing system
- **Component Composition**: Reusable UI components with props
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Component Relationships

### Authentication Flow
```
Login → AuthController → JWT Token → AuthContext → Protected Routes
```

### Data Flow Pattern
```
UI Component → API Call → Route Handler → Controller → Database → Response
```

### Role Permission Flow
```
User Login → Role Assignment → Middleware Check → Component Access → API Access
```

### Notification System
```
Backend Event → WebSocket → NotificationContext → UI Update
```

## Integration Points

### Client-Server Communication
- **REST API**: Primary data exchange mechanism
- **WebSocket**: Real-time notifications and updates
- **File Upload**: Multipart form data for document handling
- **Authentication**: JWT token-based security

### Database Integration
- **Knex.js ORM**: Query builder and migration management
- **MySQL Connection**: Pooled connections for performance
- **Transaction Support**: ACID compliance for critical operations
- **Backup Integration**: Automated backup and restore capabilities

### AI Service Integration
- **HTTP API**: Communication between Node.js and Python services
- **Data Pipeline**: Structured data flow for analytics processing
- **Prediction Engine**: Forecasting and pattern recognition
- **Real-time Analytics**: Live data processing and insights

## Configuration Management

### Environment Variables
- **Database Configuration**: Connection strings and credentials
- **JWT Secrets**: Authentication token signing keys
- **API Keys**: External service integration
- **Feature Flags**: Environment-specific functionality

### Build System
- **Vite**: Frontend build tool with hot reload
- **Node.js**: Backend runtime with ES modules
- **Docker**: Containerization for deployment
- **CI/CD**: GitHub Actions for automated deployment

## Scalability Considerations

### Horizontal Scaling
- **Stateless API**: Session-free backend design
- **Database Pooling**: Connection management for concurrent users
- **Load Balancing**: Multiple server instance support
- **Caching Strategy**: Performance optimization for frequent queries

### Vertical Scaling
- **Efficient Queries**: Optimized database operations
- **Memory Management**: Proper resource cleanup
- **File Storage**: Organized upload and template management
- **Log Rotation**: Automated log file management