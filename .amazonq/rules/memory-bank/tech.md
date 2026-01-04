# Technology Stack

## Programming Languages & Versions

### JavaScript/Node.js
- **Node.js**: 18.0.0+ (LTS recommended)
- **npm**: 9.0.0+
- **ECMAScript**: ES2021+ with module syntax (`type: "module"`)

### Python
- **Python**: 3.8+ for AI service
- **Package Manager**: pip

### SQL
- **MySQL**: 8.0+ (primary database)
- **Query Builder**: Knex.js 3.1.0

## Frontend Stack

### Core Framework
- **React**: 18.2.0 (client), 19.1.1 (root dependencies)
- **React DOM**: 18.2.0
- **React Router**: 6.8.0 (client), 7.9.6 (root)

### Build Tools
- **Vite**: 4.5.0 (development server and bundler)
- **PostCSS**: 8.5.0+
- **Autoprefixer**: 10.4.19+

### UI Libraries
- **Material-UI (MUI)**: 7.3.5
  - @mui/material
  - @mui/icons-material
  - @mui/x-data-grid (8.18.0)
- **Emotion**: 11.14.0 (CSS-in-JS for MUI)
- **TailwindCSS**: 3.4.0
- **Recharts**: 2.8.0 (client), 3.4.1 (root) - data visualization

### State Management
- **React Context API**: Built-in state management
- **Axios**: 1.6.0 (client), 1.13.2 (root) - HTTP client

## Backend Stack

### Core Framework
- **Express.js**: 4.18.2 (server), 4.19.2 (root)
- **Node.js Runtime**: CommonJS and ES modules support

### Database & ORM
- **MySQL2**: 3.6.0 (server), 3.15.3 (root) - MySQL driver
- **Knex.js**: 3.1.0 - SQL query builder and migration tool

### Authentication & Security
- **jsonwebtoken**: 9.0.0 - JWT token generation/verification
- **bcrypt**: 5.1.1 - Password hashing
- **bcryptjs**: 2.4.3 (fallback)
- **helmet**: 7.1.0 (server), 7.2.0 (root) - Security headers
- **cors**: 2.8.5 - Cross-origin resource sharing
- **express-rate-limit**: 7.5.1 - Rate limiting
- **csurf**: 1.2.2 (server), 1.11.0 (root) - CSRF protection
- **xss-clean**: 0.1.4 - XSS sanitization
- **xss**: 1.0.15 - Additional XSS protection
- **validator**: 13.11.0 - Input validation

### File Processing
- **multer**: 1.4.5-lts.1 - File upload handling
- **puppeteer**: 24.33.1 - PDF generation
- **pdfkit**: 0.17.2 - PDF creation
- **qrcode**: 1.5.4 - QR code generation
- **xlsx**: 0.18.5 - Excel file processing

### Utilities
- **dotenv**: 16.3.0 (server), 17.2.3 (root) - Environment variables
- **winston**: 3.19.0 - Logging
- **nodemailer**: 7.0.12 - Email sending
- **ws**: 8.16.0 (server), 8.18.3 (root) - WebSocket support
- **axios**: 1.13.2 - HTTP client for AI service integration

### API Documentation
- **swagger-jsdoc**: 6.2.8 - OpenAPI spec generation
- **swagger-ui-express**: 5.0.0 - API documentation UI

### Monitoring
- **prom-client**: 15.1.0 - Prometheus metrics

## AI Service Stack

### Python Framework
- **Flask** or **FastAPI**: Web framework (inferred from structure)
- **TensorFlow** or **PyTorch**: Machine learning (inferred from AI capabilities)

### AI Capabilities
- OCR engine for document text extraction
- Chatbot intent recognition
- Predictive analytics for blotter forecasting
- Smart suggestion algorithms

## Development Tools

### Code Quality
- **ESLint**: 8.56.0 (server), 8.57.0 (client), 9.36.0 (root)
  - eslint-plugin-react: 7.32.2
  - eslint-plugin-react-hooks: 4.6.0 (client), 5.2.0 (root)
  - eslint-plugin-react-refresh: 0.4.11 (client), 0.4.22 (root)
- **Prettier**: 3.2.5 - Code formatting
  - eslint-config-prettier: 9.1.0
  - eslint-plugin-prettier: 5.1.3

### Testing
- **Jest**: 29.7.0 - JavaScript testing framework
- **Supertest**: 6.3.3 - HTTP assertion library
- **Vitest**: 0.34.0 - Vite-native test runner
- **jsdom**: 22.1.0 - DOM testing environment
- **Python unittest**: Built-in Python testing

### Development Utilities
- **nodemon**: 3.0.0 - Auto-restart on file changes
- **concurrently**: 9.2.1 - Run multiple commands simultaneously
- **snyk**: 1.1291.1 - Security vulnerability scanning

## Build Systems & Dependencies

### Package Management
- **npm workspaces**: Monorepo structure with root + 3 sub-packages
- **package.json locations**:
  - Root: `clearpass/package.json`
  - Server: `clearpass/server/package.json`
  - Client: `clearpass/client/package.json`
  - Tests: `clearpass/tests/package.json`

### Build Configuration
- **Vite Config**: `client/vite.config.js` - Frontend bundling
- **Tailwind Config**: `client/tailwind.config.js` - CSS framework
- **PostCSS Config**: `client/postcss.config.js` - CSS processing
- **ESLint Config**: `eslint.config.js` (root), inline configs in package.json
- **Prettier Config**: `.prettierrc.js` files in server and client

### Database Migrations
- **Knex Config**: `server/knexfile.js`
- **Migration Directory**: `server/migrations/`
- **Seed Directory**: `server/seeds/`

## Development Commands

### Installation
```bash
# Install all dependencies (root, server, client, tests)
npm run install:all

# Individual installations
npm install                    # Root dependencies
cd server && npm install       # Server dependencies
cd client && npm install       # Client dependencies
cd tests && npm install        # Test dependencies
```

### Development
```bash
# Run all services concurrently
npm run dev:all

# Individual services
npm run dev                    # Client only (Vite dev server)
cd server && npm run dev       # Server only (nodemon)
cd ai_service && python smart_suggestions.py  # AI service
```

### Production
```bash
# Build client for production
npm run build

# Start production server
npm start                      # Runs server/index.js

# Preview production build
npm run preview
```

### Testing
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Server tests
cd server && npm test
```

### Code Quality
```bash
# Linting
npm run lint                   # Root ESLint
cd server && npm run lint      # Server ESLint
cd client && npm run lint      # Client ESLint

# Auto-fix linting issues
cd server && npm run lint:fix
cd client && npm run lint:fix

# Format code
cd server && npm run format
cd client && npm run format

# Combined lint + format
cd server && npm run lint:fix:format
cd client && npm run lint:fix:format
```

### Database
```bash
# Run migrations
cd server && npx knex migrate:latest

# Rollback migration
cd server && npx knex migrate:rollback

# Run seeds
cd server && npx knex seed:run

# Create new migration
cd server && npx knex migrate:make migration_name
```

### Security
```bash
# Security audit
cd server && npm run security-audit

# Snyk security check
cd server && npm run security-check
```

## Environment Configuration

### Required Environment Variables

**Server (.env)**:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=clearpass
JWT_SECRET=your_secret_key
PORT=3001
NODE_ENV=development
```

**Client (.env)**:
```
VITE_API_URL=http://localhost:3001
```

**AI Service (.env.example)**:
```
AI_SERVICE_PORT=5000
MODEL_PATH=/path/to/models
```

## Version Control & Deployment

### Git Configuration
- **.gitignore**: Excludes node_modules, .env files, logs, uploads
- **Branch Strategy**: Feature branches with main/master production branch

### Deployment Targets
- **Local**: XAMPP (Windows) with MySQL
- **Cloud**: AWS, Azure, GCP compatible
- **Containerization**: Dockerfile present in ai_service/

### Process Management
- **Development**: nodemon for auto-restart
- **Production**: PM2 or systemd recommended for process supervision
