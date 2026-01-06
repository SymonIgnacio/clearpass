# ClearPass - Technology Stack & Development Setup

## Programming Languages & Versions

### Frontend Technologies
- **JavaScript (ES2022)**: Modern ECMAScript features with async/await
- **JSX**: React component syntax with functional components
- **CSS3**: Modern styling with Flexbox and Grid
- **HTML5**: Semantic markup with accessibility features

### Backend Technologies
- **Node.js (v18+)**: Server-side JavaScript runtime
- **JavaScript (ES Modules)**: Modern module system with import/export
- **SQL**: Database queries and schema definitions
- **Python (3.8+)**: AI service and analytics engine

## Core Frameworks & Libraries

### Frontend Stack
- **React 19.1.1**: Component-based UI library with hooks
- **React Router DOM 7.9.6**: Client-side routing and navigation
- **Material-UI 7.3.5**: Component library with design system
- **Vite 4.5.0**: Build tool with hot module replacement
- **Tailwind CSS 3.4.0**: Utility-first CSS framework

### Backend Stack
- **Express.js 4.19.2**: Web application framework
- **Knex.js 3.1.0**: SQL query builder and migration tool
- **MySQL2 3.15.3**: Database driver with connection pooling
- **bcryptjs 3.0.3**: Password hashing and authentication
- **jsonwebtoken**: JWT token generation and validation

### Security & Middleware
- **Helmet 7.2.0**: Security headers and protection
- **CORS 2.8.5**: Cross-origin resource sharing
- **express-rate-limit 7.5.1**: API rate limiting
- **xss-clean 0.1.4**: XSS attack prevention
- **validator 13.11.0**: Input validation and sanitization

## Build Systems & Tools

### Development Tools
- **ESLint 9.36.0**: Code linting and style enforcement
- **Prettier**: Code formatting and consistency
- **Concurrently 9.2.1**: Parallel script execution
- **Autoprefixer 10.4.22**: CSS vendor prefix automation

### Build Configuration
```json
{
  "type": "module",
  "scripts": {
    "dev": "npm run dev --prefix client",
    "start": "node server/index.js",
    "build": "npm run build --prefix client",
    "dev:all": "concurrently \"cd client && npm run dev\" \"cd server && npm run dev\" \"cd ai_service && python smart_suggestions.py\""
  }
}
```

### Vite Configuration (client/vite.config.js)
- **React Plugin**: JSX transformation and fast refresh
- **Development Server**: Hot reload on port 5173
- **Build Optimization**: Code splitting and minification
- **Asset Handling**: Static file processing and optimization

## Database Technology

### MySQL Configuration
- **Version**: MySQL 8.0+
- **Connection Pooling**: Multiple concurrent connections
- **Transaction Support**: ACID compliance for data integrity
- **Charset**: utf8mb4 for full Unicode support

### Knex.js Migration System
```javascript
// knexfile.js configuration
{
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    },
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  }
}
```

## Development Commands

### Installation & Setup
```bash
# Install all dependencies
npm run install:all

# Setup environment files
npm run setup-env

# Run database migrations
npm run db:migrate

# Complete setup process
npm run setup
```

### Development Workflow
```bash
# Start all services
npm run dev:all

# Start individual services
cd client && npm run dev    # Frontend on :5173
cd server && npm run dev    # Backend on :3002
cd ai_service && python smart_suggestions.py  # AI service

# Build for production
npm run build

# Run tests
npm run test
npm run test:coverage
```

### Database Management
```bash
# Run migrations
cd server && npx knex migrate:latest

# Rollback migrations
cd server && npx knex migrate:rollback

# Run seeds
cd server && npx knex seed:run

# Database audit
npm run db:audit
```

### System Maintenance
```bash
# Health check
npm run health-check

# System validation
npm run test:system

# Verify completion
npm run verify:completion

# Environment validation
npm run validate-env
```

## AI Service Dependencies

### Python Requirements (ai_service/requirements.txt)
```
pandas>=1.5.0
numpy>=1.24.0
scikit-learn>=1.2.0
flask>=2.3.0
requests>=2.28.0
python-dotenv>=1.0.0
```

### AI Service Configuration
- **Flask Server**: HTTP API for analytics requests
- **Machine Learning**: Scikit-learn for predictive models
- **Data Processing**: Pandas for data manipulation
- **Environment**: Python-dotenv for configuration

## Environment Configuration

### Required Environment Variables
```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=barangay_management

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3002
NODE_ENV=development

# AI Service Configuration
AI_SERVICE_URL=http://localhost:5000
PYTHON_PATH=/usr/bin/python3
```

### Development vs Production
- **Development**: Hot reload, detailed logging, debug mode
- **Production**: Minified builds, error logging, security headers
- **Testing**: Isolated database, mock services, coverage reports

## Deployment Technologies

### Docker Support
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder
FROM node:18-alpine AS production
```

### CI/CD Pipeline (.github/workflows/ci-cd.yml)
- **GitHub Actions**: Automated testing and deployment
- **Build Stages**: Install, test, build, deploy
- **Environment Management**: Secrets and configuration
- **Quality Gates**: Linting, testing, security checks

## Performance Optimization

### Frontend Optimization
- **Code Splitting**: Dynamic imports for route-based chunks
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image compression and lazy loading
- **Caching Strategy**: Browser caching for static assets

### Backend Optimization
- **Connection Pooling**: Database connection management
- **Query Optimization**: Efficient database operations
- **Compression**: Gzip compression for responses
- **Rate Limiting**: API abuse prevention

## Security Implementation

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **Password Hashing**: bcrypt with salt rounds
- **Role-Based Access**: Granular permission system
- **Session Management**: Token expiration and refresh

### Data Protection
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content sanitization
- **CSRF Protection**: Token-based request validation

## Testing Framework

### Frontend Testing
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing utilities
- **Coverage Reports**: Code coverage analysis

### Backend Testing
- **Node.js Test Runner**: Built-in testing capabilities
- **Supertest**: HTTP assertion library
- **Database Testing**: Isolated test database

### Integration Testing
- **API Testing**: End-to-end API validation
- **System Testing**: Complete workflow verification
- **Performance Testing**: Load and stress testing