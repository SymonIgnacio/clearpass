# Technology Stack

## Programming Languages

### JavaScript/Node.js
- **Version**: Node.js 18.0.0+ (LTS recommended)
- **Package Manager**: npm 9.0.0+
- **Module System**: ES Modules (type: "module")
- **Usage**: Backend API, frontend application, build tools

### Python
- **Version**: Python 3.x
- **Usage**: AI services (OCR, chatbot, analytics)
- **Key Libraries**: See AI Services section

### SQL
- **Dialect**: MySQL 8.0
- **Query Builder**: Knex.js 3.1.0
- **Usage**: Database schema, migrations, queries

## Frontend Stack

### Core Framework
- **React**: 18.2.0
- **React DOM**: 18.2.0
- **React Router**: 6.8.0

### UI Framework
- **Material-UI (MUI)**: 7.3.5
  - @mui/material
  - @mui/icons-material
  - @mui/x-data-grid
- **Emotion**: 11.14.0 (CSS-in-JS for MUI)

### Styling
- **Tailwind CSS**: 3.4.0
- **PostCSS**: 8.5.0
- **Autoprefixer**: 10.4.19

### Data Visualization
- **Recharts**: 2.8.0

### HTTP Client
- **Axios**: 1.6.0

### Build Tool
- **Vite**: 4.5.0
- **@vitejs/plugin-react**: 4.3.0

### Development Tools
- **ESLint**: 8.57.0
  - eslint-plugin-react
  - eslint-plugin-react-hooks
  - eslint-plugin-react-refresh
  - eslint-config-prettier
  - eslint-plugin-prettier
- **Prettier**: 3.2.5
- **Vitest**: 0.34.0 (testing)
- **jsdom**: 22.1.0 (DOM testing)

## Backend Stack

### Core Framework
- **Express.js**: 4.18.2
- **Node.js**: 18.0.0+

### Database
- **MySQL2**: 3.6.0 (MySQL driver)
- **Knex.js**: 3.1.0 (Query builder & migrations)

### Authentication & Security
- **jsonwebtoken**: 9.0.0 (JWT tokens)
- **bcrypt**: 5.1.1 (password hashing)
- **bcryptjs**: 2.4.3 (alternative bcrypt)
- **helmet**: 7.1.0 (security headers)
- **cors**: 2.8.5 (CORS handling)
- **express-rate-limit**: 7.5.1 (rate limiting)
- **csurf**: 1.2.2 (CSRF protection)
- **xss-clean**: 0.1.4 (XSS sanitization)
- **validator**: 13.11.0 (input validation)
- **express-validator**: 7.3.1

### File Handling
- **multer**: 1.4.5-lts.1 (file uploads)
- **puppeteer**: 24.33.1 (PDF generation)
- **pdfkit**: 0.17.2 (PDF creation)
- **qrcode**: 1.5.4 (QR code generation)
- **xlsx**: 0.18.5 (Excel files)

### Logging & Monitoring
- **winston**: 3.19.0 (logging)
- **prom-client**: 15.1.0 (Prometheus metrics)

### Communication
- **ws**: 8.16.0 (WebSocket)
- **axios**: 1.13.2 (HTTP client)
- **nodemailer**: 7.0.12 (email)

### Documentation
- **swagger-jsdoc**: 6.2.8
- **swagger-ui-express**: 5.0.0

### Development Tools
- **nodemon**: 3.0.0 (auto-restart)
- **dotenv**: 16.3.0 (environment variables)
- **ESLint**: 8.56.0
- **Prettier**: 3.2.5
- **Jest**: 29.7.0 (testing)
- **supertest**: 6.3.3 (API testing)
- **snyk**: 1.1291.1 (security scanning)

## AI Services Stack

### Python Dependencies
```
# Core AI Libraries
- OCR engine libraries
- NLP frameworks
- Machine learning libraries
- Data processing tools

# Configuration
- python-dotenv (environment variables)
- requests (HTTP client)
```

### AI Capabilities
- OCR text extraction
- Chatbot intent recognition
- Field extraction
- Predictive analytics
- Blotter trend analysis

## Database Technology

### MySQL Configuration
- **Version**: 8.0+
- **Storage Engine**: InnoDB
- **Character Set**: utf8mb4
- **Collation**: utf8mb4_unicode_ci

### Migration System
- **Tool**: Knex.js migrations
- **Location**: server/migrations/
- **Naming**: Timestamp-based (YYYYMMDDHHMMSS_description.js)

### Key Tables
- users, residents, households
- certificates, document_requests, templates
- blotter_entries, blotter_participants
- notifications, login_attempts
- AI-related tables

## Development Commands

### Root Level
```bash
# Install all dependencies
npm run install:all

# Run all services concurrently
npm run dev:all

# Frontend only
npm run dev

# Backend only
npm start

# Build production
npm run build

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Linting
npm run lint
```

### Server Commands
```bash
cd server

# Development with auto-restart
npm run dev

# Production
npm start

# Testing
npm test
npm run test:watch

# Code quality
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run lint:fix:format

# Security
npm run security-audit
npm run security-check
```

### Client Commands
```bash
cd client

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Code quality
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run lint:fix:format
```

### AI Service Commands
```bash
cd ai_service

# Install dependencies
pip install -r requirements.txt

# Run service
python smart_suggestions.py
```

### Database Commands
```bash
cd server

# Run migrations
npx knex migrate:latest

# Rollback migration
npx knex migrate:rollback

# Run seeds
npx knex seed:run

# Create migration
npx knex migrate:make migration_name

# Create seed
npx knex seed:make seed_name
```

## Build Systems

### Frontend Build (Vite)
- **Dev Server**: Hot Module Replacement (HMR)
- **Build Output**: Optimized static files
- **Code Splitting**: Automatic route-based splitting
- **Asset Optimization**: Minification, tree-shaking

### Backend Build
- **No Build Step**: Direct Node.js execution
- **Module System**: ES Modules
- **Environment**: Development vs Production configs

## Environment Configuration

### Required Environment Variables

#### Server (.env)
```
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=clearpass_db
DB_PORT=3306

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=development

# AI Service
AI_SERVICE_URL=http://localhost:5001
```

#### Client (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

#### AI Service (.env)
```
PORT=5001
DATABASE_URL=mysql://user:pass@localhost:3306/clearpass_db
```

## Version Requirements

### Node.js Engines
```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### Browser Support
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- No IE support

## Development Tools

### Code Quality
- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **EditorConfig**: Editor consistency

### Testing
- **Jest**: Unit and integration tests
- **Supertest**: API endpoint testing
- **Vitest**: Frontend component testing

### Version Control
- **Git**: Source control
- **GitHub**: Repository hosting
- **.gitignore**: Excludes node_modules, .env, logs

### CI/CD
- **GitHub Actions**: Automated workflows
- **Configuration**: .github/workflows/ci-cd.yml

## Performance Optimization

### Frontend
- Code splitting with React.lazy()
- Memoization with React.memo()
- Virtual scrolling for large lists
- Image optimization
- Bundle size optimization

### Backend
- Database query optimization
- Connection pooling
- Response caching
- Compression middleware
- Rate limiting

### Database
- Strategic indexing
- Query optimization
- Connection pooling
- Prepared statements

## Security Tools

### Dependencies
- helmet (HTTP headers)
- xss-clean (XSS prevention)
- express-rate-limit (DDoS protection)
- validator (input sanitization)
- bcrypt (password hashing)
- jsonwebtoken (authentication)

### Security Scanning
- npm audit (dependency vulnerabilities)
- Snyk (security monitoring)
- ESLint security plugins

## Deployment Stack

### Production Requirements
- Node.js 18+ runtime
- MySQL 8.0+ database
- Python 3.x for AI services
- HTTPS/SSL certificates
- Reverse proxy (nginx/Apache)
- Process manager (PM2)

### Containerization
- Docker support available
- Dockerfile in ai_service/
- Multi-container orchestration ready
