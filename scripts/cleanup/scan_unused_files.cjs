const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const IGNORE_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.cleanup_archive',
  '__pycache__',
]);

const CODE_EXTENSIONS = new Set(['.js', '.cjs', '.mjs', '.jsx', '.ts', '.tsx']);
const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.json', '.yml', '.yaml', '.sql', '.bat', '.ps1', '.sh']);

const normalize = (p) => p.split(path.sep).join('/');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const safeMkdirp = (p) => fs.mkdirSync(p, { recursive: true });

const walk = (dir) => {
  const results = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
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
  }
  return results;
};

const isCodeFile = (file) => CODE_EXTENSIONS.has(path.extname(file).toLowerCase());

const isTextFile = (file) => TEXT_EXTENSIONS.has(path.extname(file).toLowerCase());

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

const getFileMeta = (file) => {
  const stat = fs.statSync(file);
  return {
    size_bytes: stat.size,
    mtime_iso: stat.mtime.toISOString(),
  };
};

const extractImportSpecifiers = (content) => {
  const specs = new Set();
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
  return [...specs];
};

const resolveImport = (fromFile, spec) => {
  const fromDir = path.dirname(fromFile);

  const candidates = [];

  const tryResolve = (basePath) => {
    if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) return basePath;
    const ext = path.extname(basePath);
    if (!ext) {
      for (const e of CODE_EXTENSIONS) candidates.push(basePath + e);
      for (const e of CODE_EXTENSIONS) candidates.push(path.join(basePath, 'index' + e));
    }
    return null;
  };

  if (spec.startsWith('.')) {
    const abs = path.resolve(fromDir, spec);
    const direct = tryResolve(abs);
    if (direct) return direct;
  }

  if (spec.startsWith('/src/')) {
    const abs = path.join(PROJECT_ROOT, 'client', spec.slice(1));
    const direct = tryResolve(abs);
    if (direct) return direct;
  }

  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
};

const parseHtmlEntrypoint = () => {
  const html = path.join(PROJECT_ROOT, 'client', 'index.html');
  if (!fs.existsSync(html)) return [];
  const content = fs.readFileSync(html, 'utf8');
  const matches = [...content.matchAll(/<script[^>]+src=["']([^"']+)["']/g)];
  return matches.map((m) => m[1]).filter(Boolean);
};

const extractNodeScriptPaths = (scriptsObj) => {
  const paths = new Set();
  for (const value of Object.values(scriptsObj || {})) {
    const s = String(value);
    for (const m of s.matchAll(/\bnode\s+([^\s"']+\.(?:js|cjs|mjs))\b/g)) {
      const p = m[1];
      if (!p) continue;
      paths.add(p);
    }
    for (const m of s.matchAll(/\bpython\s+([^\s"']+\.py)\b/g)) {
      const p = m[1];
      if (!p) continue;
      paths.add(p);
    }
  }
  return [...paths];
};

const getPackageScriptEntrypoints = () => {
  const pkgs = [
    path.join(PROJECT_ROOT, 'package.json'),
    path.join(PROJECT_ROOT, 'server', 'package.json'),
    path.join(PROJECT_ROOT, 'client', 'package.json'),
    path.join(PROJECT_ROOT, 'tests', 'package.json'),
  ].filter((p) => fs.existsSync(p));

  const entrypoints = new Set();
  for (const pkgPath of pkgs) {
    const pkg = readJson(pkgPath);
    for (const rel of extractNodeScriptPaths(pkg.scripts || {})) {
      const abs = path.resolve(path.dirname(pkgPath), rel);
      if (fs.existsSync(abs)) entrypoints.add(abs);
    }
  }
  return [...entrypoints];
};

const buildGraph = (codeFiles) => {
  const graph = new Map();
  for (const file of codeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const deps = [];
    for (const spec of extractImportSpecifiers(content)) {
      const resolved = resolveImport(file, spec);
      if (resolved) deps.push(resolved);
    }
    graph.set(file, deps);
  }
  return graph;
};

const bfsReachable = (graph, entrypoints) => {
  const reachable = new Set();
  const stack = [...entrypoints];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || reachable.has(cur)) continue;
    reachable.add(cur);
    const next = graph.get(cur) || [];
    for (const n of next) stack.push(n);
  }
  return reachable;
};

const matchesPreservePatterns = (rel) => {
  const base = path.basename(rel).toLowerCase();
  if (base.startsWith('.git')) return true;
  if (base === '.env' || base.startsWith('.env.')) return true;
  if (base.startsWith('config.') || base.startsWith('settings.')) return true;
  if (base.startsWith('readme')) return true;
  if (base.startsWith('license')) return true;
  if (base === 'changelog.md' || base === 'contributing.md') return true;
  if (base === 'package.json' || base === 'package-lock.json') return true;
  if (base === 'requirements.txt' || base === 'requirements_test.txt') return true;
  if (base === 'makefile') return true;
  return false;
};

const classifyFile = (rel) => {
  const lower = rel.toLowerCase();
  if (lower.includes('/__pycache__/') || lower.endsWith('.pyc')) return { bucket: 'generated', rationale: 'Python bytecode cache' };
  if (lower.endsWith('.backup') || lower.endsWith('.bak') || lower.endsWith('.old')) return { bucket: 'generated', rationale: 'Backup artifact' };
  if (lower.endsWith('.log')) return { bucket: 'generated', rationale: 'Log artifact' };
  if (lower.includes('/coverage/')) return { bucket: 'generated', rationale: 'Coverage output' };
  if (lower.includes('/dist/') || lower.includes('/build/')) return { bucket: 'generated', rationale: 'Build output' };
  if (lower.endsWith('.md')) return { bucket: 'documentation', rationale: 'Markdown documentation' };
  return { bucket: 'candidate', rationale: 'Unreferenced by dependency graph' };
};

async function main() {
  const nowIso = new Date().toISOString();
  const ts = nowIso.replace(/:/g, '-');
  const outDir = path.join(PROJECT_ROOT, 'audits', 'cleanup', ts);
  safeMkdirp(outDir);

  const allFiles = walk(PROJECT_ROOT);
  const codeFiles = allFiles.filter(isCodeFile);

  const pkgEntrypoints = getPackageScriptEntrypoints();
  const htmlEntrypoints = parseHtmlEntrypoint()
    .map((src) => resolveImport(path.join(PROJECT_ROOT, 'client', 'index.html'), src))
    .filter(Boolean);

  const hardEntrypoints = [
    path.join(PROJECT_ROOT, 'server', 'index.js'),
    path.join(PROJECT_ROOT, 'server', 'routes.js'),
    path.join(PROJECT_ROOT, 'client', 'src', 'main.jsx'),
  ].filter((p) => fs.existsSync(p));

  const testEntrypoints = codeFiles.filter((f) => /\btest\b|__tests__/.test(normalize(path.relative(PROJECT_ROOT, f))));

  const migrationEntrypoints = allFiles.filter((f) => normalize(path.relative(PROJECT_ROOT, f)).startsWith('server/migrations/') && f.endsWith('.js'));
  const seedEntrypoints = allFiles.filter((f) => normalize(path.relative(PROJECT_ROOT, f)).startsWith('server/seeds/') && f.endsWith('.js'));

  const entrypoints = [...new Set([...hardEntrypoints, ...pkgEntrypoints, ...htmlEntrypoints, ...testEntrypoints, ...migrationEntrypoints, ...seedEntrypoints])];

  const graph = buildGraph(codeFiles);
  const reachable = bfsReachable(graph, entrypoints);

  const unreachableCode = codeFiles.filter((f) => !reachable.has(f));

  const report = {
    generated_at: nowIso,
    entrypoints: entrypoints.map((p) => normalize(path.relative(PROJECT_ROOT, p))),
    totals: {
      all_files: allFiles.length,
      code_files: codeFiles.length,
      reachable_code_files: reachable.size,
      unreachable_code_files: unreachableCode.length,
    },
    unreachable: [],
    notes: [
      'This scan uses static parsing of import/require statements and may miss runtime-dynamic imports.',
      'Version control history is not available from this environment; findings are based on current workspace state only.',
    ],
  };

  for (const file of unreachableCode) {
    const rel = normalize(path.relative(PROJECT_ROOT, file));
    const meta = getFileMeta(file);
    const { bucket, rationale } = classifyFile(rel);
    const preserve = matchesPreservePatterns(rel) || rel.startsWith('docs/') || rel.startsWith('audits/') || rel.endsWith('.md');
    report.unreachable.push({
      path: rel,
      bucket,
      preserve,
      rationale,
      ...meta,
    });
  }

  report.unreachable.sort((a, b) => b.size_bytes - a.size_bytes);

  const jsonPath = path.join(outDir, 'unused-files-analysis.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const mdLines = [];
  mdLines.push(`# Cleanup Scan Report`);
  mdLines.push(``);
  mdLines.push(`- Generated at: ${nowIso}`);
  mdLines.push(`- Code files: ${report.totals.code_files}`);
  mdLines.push(`- Unreachable code files: ${report.totals.unreachable_code_files}`);
  mdLines.push(``);
  mdLines.push(`## Top Unreachable Code Files (By Size)`);
  mdLines.push(``);
  mdLines.push(`| Path | Size (KB) | Preserve | Bucket |`);
  mdLines.push(`| --- | ---: | :---: | --- |`);
  for (const item of report.unreachable.slice(0, 50)) {
    mdLines.push(`| ${item.path} | ${(item.size_bytes / 1024).toFixed(1)} | ${item.preserve ? 'Yes' : 'No'} | ${item.bucket} |`);
  }
  mdLines.push(``);
  mdLines.push(`## Notes`);
  mdLines.push(``);
  for (const n of report.notes) mdLines.push(`- ${n}`);

  const mdPath = path.join(outDir, 'unused-files-analysis.md');
  fs.writeFileSync(mdPath, mdLines.join('\n'));

  console.log(JSON.stringify({ outDir: normalize(path.relative(PROJECT_ROOT, outDir)), json: normalize(path.relative(PROJECT_ROOT, jsonPath)), md: normalize(path.relative(PROJECT_ROOT, mdPath)) }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

