# ClearPass Development Guidelines

## Code Quality Standards

### JavaScript/Node.js Standards
- **ES2020+ Features**: Use modern JavaScript features including async/await, destructuring, and arrow functions
- **Module System**: Frontend uses ES modules (`export default`), backend uses CommonJS (`module.exports`)
- **Variable Naming**: Use camelCase for variables and functions, PascalCase for React components
- **Unused Variables**: Variables with uppercase patterns (^[A-Z_]) are allowed to remain unused (configuration constants)

### Code Formatting (Prettier Configuration)
- **Semicolons**: Always use semicolons (`semi: true`)
- **Quotes**: Single quotes for JavaScript (`singleQuote: true`), single quotes for JSX (`jsxSingleQuote: true`)
- **Line Width**: 100 characters maximum (`printWidth: 100`)
- **Indentation**: 2 spaces, no tabs (`tabWidth: 2`, `useTabs: false`)
- **Trailing Commas**: ES5 style trailing commas (`trailingComma: 'es5'`)
- **Bracket Spacing**: Space inside object brackets (`bracketSpacing: true`)
- **Arrow Functions**: Avoid parentheses around single parameters (`arrowParens: 'avoid'`)
- **Line Endings**: Unix-style line endings (`endOfLine: 'lf'`)

### ESLint Configuration Patterns
- **File-Specific Rules**: Different configurations for client, server, tests, and config files
- **Global Ignores**: Exclude `dist`, `node_modules`, `build`, `.git`, and Python files
- **Environment Globals**: Properly configured globals for browser, Node.js, and Jest environments
- **React Rules**: Use recommended React Hooks and React Refresh configurations
- **No Undefined Variables**: Disabled for CommonJS files where globals are explicitly defined

## Structural Conventions

### File Organization
- **Configuration Files**: Use `.js` extension for config files (not `.json` when logic is needed)
- **Module Exports**: Use `export default` for ES modules, `module.exports` for CommonJS
- **File Extensions**: `.jsx` for React components, `.js` for utilities and Node.js files
- **Directory Structure**: Separate client, server, and service concerns into distinct directories

### Import/Export Patterns
```javascript
// ES Module (Frontend)
import js from '@eslint/js'
import globals from 'globals'
export default defineConfig([...])

// CommonJS (Backend)
const { healthCheck } = require('./healthCheck')
module.exports = { healthCheck }
```

### Configuration Object Structure
- **Nested Configuration**: Use object nesting for related settings (colors, theme extensions)
- **Semantic Naming**: Use descriptive names for configuration sections
- **Default Exports**: Export configuration objects as default exports
- **Type Annotations**: Include JSDoc type hints for configuration objects

## Design System Patterns

### Color System (Tailwind Configuration)
- **Semantic Colors**: Define primary, secondary, error, warning, success, and gray color palettes
- **Shade Variations**: Use 50-950 shade scale for comprehensive color variations
- **Consistent Naming**: Follow standard color naming conventions (50 = lightest, 950 = darkest)
- **Brand Colors**: Primary uses blue tones, secondary uses green tones

### Typography Standards
- **Font Stack**: Google Sans as primary, with Roboto and system font fallbacks
- **Font Family**: `['\"Google Sans\"', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']`

### Animation and Effects
- **Custom Animations**: Define reusable animations (fade-in, slide-up, bounce-gentle)
- **Shadow System**: Use semantic shadow names (soft, medium, large) with consistent opacity values
- **Border Radius**: Extend default radius with custom values (4xl = 2rem)
- **Responsive Design**: Use extended breakpoint system including 'xs' (475px)

## API and Backend Patterns

### Health Check Implementation
- **Structured Response**: Return consistent health check objects with status, timestamp, and uptime
- **Multiple Checks**: Implement database, memory, and disk checks as separate components
- **Error Handling**: Graceful degradation with specific error messages for failed checks
- **Performance Metrics**: Include response times and resource usage in health checks

### Database Interaction Patterns
```javascript
// Health check database pattern
try {
  const start = Date.now();
  await db.execute('SELECT 1');
  checks.checks.database = {
    status: 'healthy',
    responseTime: Date.now() - start
  };
} catch (error) {
  checks.status = 'unhealthy';
  checks.checks.database = {
    status: 'unhealthy',
    error: error.message
  };
}
```

### Memory Monitoring
- **Heap Usage Monitoring**: Check if heap usage exceeds 90% of total heap
- **Memory Formatting**: Display memory usage in MB for readability
- **Status Thresholds**: Use 'healthy', 'warning', and 'unhealthy' status levels

## Development Workflow Standards

### Environment Configuration
- **File-Specific Settings**: Different ESLint rules for different file types and environments
- **Global Variables**: Explicitly define globals for each environment (browser, Node.js, Jest)
- **Source Type**: Specify 'module' for ES modules, 'commonjs' for Node.js files
- **ECMAScript Version**: Use 'latest' for modern JavaScript features

### Testing Standards
- **Test Globals**: Define Jest globals (describe, it, test, expect, beforeEach, etc.)
- **Test File Patterns**: Use `**/__tests__/**/*.js` and `**/*.test.js` patterns
- **Environment Setup**: Separate configuration for test files with appropriate globals

### Build Tool Configuration
- **PostCSS Setup**: Minimal configuration with Tailwind and Autoprefixer plugins
- **Content Scanning**: Include all relevant file patterns for CSS purging
- **Plugin Integration**: Use default plugin configurations unless customization is needed

## Security and Performance Practices

### Code Quality Enforcement
- **Linting Rules**: Enforce consistent code quality across different file types
- **Unused Variable Handling**: Allow configuration constants to remain unused
- **Global Scope Management**: Explicitly define global variables to prevent undefined errors

### Performance Monitoring
- **Resource Tracking**: Monitor memory usage, response times, and system uptime
- **Health Endpoints**: Implement comprehensive health checking for system monitoring
- **Error Reporting**: Provide detailed error information for debugging

### Configuration Management
- **Environment Separation**: Different configurations for development, testing, and production
- **Secure Defaults**: Use secure default configurations for all tools and frameworks
- **Validation**: Implement configuration validation to catch errors early

## Documentation Standards

### Code Comments
- **Minimal Comments**: Write self-documenting code that reduces need for comments
- **Configuration Comments**: Use JSDoc-style comments for configuration objects
- **Type Hints**: Include type information in comments where beneficial

### File Headers
- **Configuration Files**: Include type annotations for IDE support
- **Module Purpose**: Clear indication of file purpose through naming and structure
- **Dependencies**: Explicit import statements showing all dependencies

This guidelines document reflects the actual patterns found in the ClearPass codebase and should be followed for consistency across all development work.