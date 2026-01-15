const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const IGNORE_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.cleanup_archive',
  '__pycache__',
  '.trae',
  '.idx',
  '.vercel'
]);

const CODE_EXTENSIONS = new Set(['.js', '.cjs', '.mjs', '.jsx', '.ts', '.tsx', '.py', '.sql']);
const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.json', '.yml', '.yaml', '.bat', '.ps1', '.sh', '.css', '.html']);

const normalize = (p) => p.split(path.sep).join('/');

const walk = (dir) => {
  const results = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    try {
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
            if (IGNORE_DIR_NAMES.has(entry.name)) continue;
            stack.push(full);
            continue;
        }
        if (entry.isFile()) results.push(full);
        }
    } catch (e) {
        console.warn(`Warning: Could not read directory ${current}: ${e.message}`);
    }
  }
  return results;
};

const getFileMeta = (file) => {
  try {
    const stat = fs.statSync(file);
    const content = fs.readFileSync(file); // Read buffer for hash
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    return {
        size_bytes: stat.size,
        mtime_iso: stat.mtime.toISOString(),
        hash: hash
    };
  } catch (e) {
      console.warn(`Warning: Could not process file ${file}: ${e.message}`);
      return null;
  }
};

const extractImportSpecifiers = (content, ext) => {
  const specs = new Set();
  
  if (['.js', '.cjs', '.mjs', '.jsx', '.ts', '.tsx'].includes(ext)) {
    const patterns = [
        /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
        /\bimport\s+[^'"]*?\s+from\s+['"]([^'"]+)['"]/g,
        /\bexport\s+[^'"]*?\s+from\s+['"]([^'"]+)['"]/g,
        /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];
    for (const re of patterns) {
        let m;
        while ((m = re.exec(content))) {
        if (m[1]) specs.add(m[1]);
        }
    }
  } else if (ext === '.py') {
      // Basic Python import parsing
      const patterns = [
          /^from\s+(\S+)\s+import/gm,
          /^import\s+(\S+)/gm
      ];
      for (const re of patterns) {
          let m;
          while ((m = re.exec(content))) {
              if (m[1]) specs.add(m[1]);
          }
      }
  }
  
  return [...specs];
};

const resolveImport = (fromFile, spec) => {
    // Simplified resolver
    if (spec.startsWith('.')) {
        const abs = path.resolve(path.dirname(fromFile), spec);
        if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
        
        for (const ext of CODE_EXTENSIONS) {
            if (fs.existsSync(abs + ext)) return abs + ext;
            if (fs.existsSync(path.join(abs, 'index' + ext))) return path.join(abs, 'index' + ext);
        }
    }
    // TODO: Handle alias imports if needed
    return null; 
};

async function indexProject() {
  console.log('Indexing project files...');
  const allFiles = walk(PROJECT_ROOT);
  
  const index = {
      generated_at: new Date().toISOString(),
      files: {}
  };

  for (const file of allFiles) {
      const relPath = normalize(path.relative(PROJECT_ROOT, file));
      const meta = getFileMeta(file);
      if (!meta) continue;

      const ext = path.extname(file).toLowerCase();
      let imports = [];
      
      if (CODE_EXTENSIONS.has(ext)) {
          try {
              const content = fs.readFileSync(file, 'utf8');
              const rawImports = extractImportSpecifiers(content, ext);
              imports = rawImports; // Store raw for now, resolving is complex
          } catch (e) {
              // Ignore read errors
          }
      }

      index.files[relPath] = {
          ...meta,
          type: ext,
          imports: imports
      };
  }

  const outPath = path.join(__dirname, '../../data/file-index.json');
  fs.writeFileSync(outPath, JSON.stringify(index, null, 2));
  console.log(`Index written to ${outPath}. Total files: ${Object.keys(index.files).length}`);
  
  return index;
}

if (require.main === module) {
    indexProject();
}

module.exports = { indexProject };
