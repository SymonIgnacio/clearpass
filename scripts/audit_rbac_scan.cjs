const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, '../server/routes');

function scanRoutes() {
  console.log('🔍 Scanning Routes for RBAC Compliance...');
  
  if (!fs.existsSync(ROUTES_DIR)) {
    console.error('❌ Routes directory not found:', ROUTES_DIR);
    return;
  }

  const files = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith('.js'));
  let issues = 0;

  files.forEach(file => {
    const content = fs.readFileSync(path.join(ROUTES_DIR, file), 'utf8');
    const lines = content.split('\n');
    let hasVerifyToken = content.includes('verifyToken');
    let hasCheckRole = content.includes('checkRole') || content.includes('verifyRole'); // Assuming verifyRole is alias
    
    // Naive check: Does it import authMiddleware?
    const hasMiddlewareImport = content.includes('authMiddleware');

    if (!hasMiddlewareImport) {
       // Some routes might be public (authRoutes), but warn anyway
       if (file !== 'authRoutes.js' && file !== 'residentAuthRoutes.js') {
           console.warn(`⚠️  [${file}] No authMiddleware import found.`);
       }
    }

    // Check for "router.post(", "router.get(" etc. that are NOT preceded by verifyToken in the chain
    // This is a complex regex, so we'll do a simpler heuristic:
    // If it has router.METHOD but NO verifyToken in the file, it's suspicious (unless it's auth).
    
    if (!hasVerifyToken && !['authRoutes.js', 'residentAuthRoutes.js', 'aiRoutes.js'].includes(file)) {
        console.error(`❌ [${file}] MISSING verifyToken usage!`);
        issues++;
    } else if (hasVerifyToken) {
        // Check if verifyToken is actually used in router calls
        // Matches: router.get('/', verifyToken, ...
        // Matches: router.use(verifyToken)
        const usesToken = /router\.(use|get|post|put|delete|patch)\s*\([^,]+,\s*verifyToken/.test(content) || /router\.use\s*\(\s*verifyToken\s*\)/.test(content);
        
        if (!usesToken) {
             console.warn(`⚠️  [${file}] Imports verifyToken but might not apply it to routes correctly.`);
        }
    }

    if (!hasCheckRole && ['adminRoutes.js', 'blotterRoutes.js', 'certificateRoutes.js'].includes(file)) {
         console.warn(`⚠️  [${file}] Critical route missing checkRole?`);
    }
  });

  console.log(`\nScan Complete. Found ${issues} potential critical issues.`);
}

scanRoutes();
