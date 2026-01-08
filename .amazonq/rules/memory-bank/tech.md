# ClearPass Technology Stack

## Programming Languages & Versions

### Frontend
- **JavaScript (ES2022+)** - Modern JavaScript with latest features
- **JSX** - React component syntax
- **CSS3** - Styling with Tailwind CSS framework

### Backend
- **JavaScript (Node.js 18+)** - Server-side runtime
- **SQL** - Database queries and schema definitions

### AI Service
- **Python 3.9+** - Machine learning and AI processing
- **SQL** - Database integration for AI analytics

## Core Technologies

### Frontend Stack
- **React 19.1.1** - Component-based UI framework
- **Vite 4.5.0** - Fast build tool and development server
- **React Router DOM 7.9.6** - Client-side routing
- **TailwindCSS 3.4.0** - Utility-first CSS framework
- **Material-UI 7.3.5** - React component library
- **Axios 1.13.2** - HTTP client for API communication

### Backend Stack
- **Node.js 18+** - JavaScript runtime environment
- **Express 4.19.2** - Web application framework
- **Knex.js 3.1.0** - SQL query builder and ORM
- **MySQL2 3.15.3** - MySQL database driver
- **bcryptjs 3.0.3** - Password hashing
- **jsonwebtoken** - JWT authentication

### Database
- **MySQL 8.0+** - Primary relational database
- **Knex Migrations** - Database schema versioning
- **Connection Pooling** - Optimized database connections

### AI/ML Stack
- **Python 3.9+** - AI service runtime
- **Flask** - Lightweight web framework for AI endpoints
- **scikit-learn** - Machine learning algorithms
- **pandas** - Data manipulation and analysis
- **numpy** - Numerical computing

## Development Tools

### Code Quality
- **ESLint 9.36.0** - JavaScript linting
- **Prettier** - Code formatting
- **Autoprefixer 10.4.22** - CSS vendor prefixes
- **PostCSS 8.5.6** - CSS processing

### Build System
- **Vite** - Frontend build tool with HMR
- **npm** - Package management
- **Concurrently 9.2.1** - Run multiple commands simultaneously

### Testing Framework
- **Jest** - JavaScript testing framework
- **React Testing Library** - React component testing
- **Supertest** - HTTP assertion testing
- **pytest** - Python testing framework

## Security Technologies

### Authentication & Authorization
- **JWT (JSON Web Tokens)** - Stateless authentication
- **bcryptjs** - Password hashing with salt
- **express-rate-limit 7.5.1** - API rate limiting
- **helmet 7.2.0** - Security headers middleware

### Data Protection
- **CSRF Protection** - Cross-site request forgery prevention
- **XSS Clean 0.1.4** - Cross-site scripting protection
- **Input Validation** - Server-side data validation
- **SQL Injection Prevention** - Parameterized queries

## Development Environment

### Required Software
- **Node.js 18+** - JavaScript runtime
- **npm 9+** - Package manager
- **MySQL 8.0+** - Database server
- **Python 3.9+** - AI service runtime
- **Git** - Version control

### Development Servers
- **Frontend**: Vite dev server (Port 5174)
- **Backend**: Express server (Port 3002)
- **AI Service**: Flask server (Port 5000)
- **Database**: MySQL server (Port 3306)

## Build & Deployment

### Development Commands
```bash
# Install all dependencies
npm run install:all

# Start all services
npm run dev:all

# Individual service startup
cd client && npm run dev     # Frontend
cd server && npm run dev     # Backend
cd ai_service && python smart_suggestions.py  # AI Service
```

### Production Build
```bash
# Build frontend for production
cd client && npm run build

# Start production server
cd server && npm start

# Database migrations
cd server && npx knex migrate:latest
```

### Testing Commands
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# System health check
npm run health-check
```

## Database Configuration

### Connection Settings
- **Host**: localhost (development)
- **Port**: 3306
- **Database**: barangay_management
- **Charset**: utf8mb4
- **Timezone**: UTC

### Migration System
- **Tool**: Knex.js migrations
- **Location**: `server/migrations/`
- **Naming**: Timestamp-based (YYYYMMDDHHMMSS_description.js)
- **Rollback**: Supported for all migrations

### Seeding System
- **Initial Data**: `server/seeds/01_initial_data.js`
- **User Hierarchy**: `server/seeds/02_hierarchy_setup.js`
- **Staff Users**: `server/seeds/03_initial_staff_users.js`

## API Architecture

### RESTful Design
- **GET** - Retrieve resources
- **POST** - Create new resources
- **PUT** - Update existing resources
- **DELETE** - Remove resources

### Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2025-01-XX"
}
```

### Error Handling
- **HTTP Status Codes** - Standard status code usage
- **Error Messages** - Descriptive error responses
- **Validation Errors** - Field-specific error details
- **Logging** - Comprehensive error logging

## Performance Optimization

### Frontend Optimization
- **Code Splitting** - Dynamic imports for route-based splitting
- **Lazy Loading** - Component-level lazy loading
- **Asset Optimization** - Image and bundle optimization
- **Caching** - Browser caching strategies

### Backend Optimization
- **Database Indexing** - Optimized query performance
- **Connection Pooling** - Efficient database connections
- **Compression** - Response compression middleware
- **Caching** - Redis caching (planned)

### Monitoring
- **Performance Metrics** - Request timing and resource usage
- **Health Checks** - System health monitoring endpoints
- **Logging** - Structured logging with Winston
- **Error Tracking** - Comprehensive error monitoring

## Development Workflow

### Version Control
- **Git** - Distributed version control
- **Branch Strategy** - Feature branch workflow
- **Commit Convention** - Conventional commit messages

### Code Standards
- **ESLint Rules** - Enforced code quality standards
- **Prettier Config** - Consistent code formatting
- **File Naming** - Consistent naming conventions
- **Import Organization** - Structured import statements

### Environment Management
- **Development** - Local development environment
- **Testing** - Automated testing environment
- **Production** - Production deployment configuration
- **Environment Variables** - Secure configuration management