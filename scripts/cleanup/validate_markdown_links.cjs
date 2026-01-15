const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const normalize = (p) => p.split(path.sep).join('/');

const safeMkdirp = (p) => fs.mkdirSync(p, { recursive: true });

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.cleanup_archive']);

const walk = (dir) => {
  const results = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) {
        if (IGNORE_DIRS.has(e.name)) continue;
        stack.push(full);
      } else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) {
        results.push(full);
      }
    }
  }
  return results;
};

const isHttp = (href) => /^https?:\/\//i.test(href);

const stripAnchor = (href) => href.split('#')[0];

const stripQuery = (href) => href.split('?')[0];

const resolveLinkTarget = (fromFile, href) => {
  const clean = stripQuery(stripAnchor(href));
  if (!clean) return null;
  if (clean.startsWith('/')) return path.join(PROJECT_ROOT, clean.slice(1));
  return path.resolve(path.dirname(fromFile), clean);
};

function main() {
  const nowIso = new Date().toISOString();
  const ts = nowIso.replace(/:/g, '-');
  const auditDir = path.join(PROJECT_ROOT, 'audits', 'cleanup', ts);
  safeMkdirp(auditDir);
  const outPath = path.join(auditDir, 'docs-link-check.json');

  const docsDir = path.join(PROJECT_ROOT, 'docs');
  const files = fs.existsSync(docsDir) ? walk(docsDir) : [];
  const issues = [];

  const linkRe = /\[[^\]]*?\]\(([^)]+)\)/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = linkRe.exec(content))) {
      const href = m[1].trim();
      if (!href || isHttp(href) || href.startsWith('mailto:')) continue;
      if (href.startsWith('#')) continue;

      const target = resolveLinkTarget(file, href);
      if (!target) continue;
      if (!fs.existsSync(target)) {
        issues.push({
          file: normalize(path.relative(PROJECT_ROOT, file)),
          href,
          resolved: normalize(path.relative(PROJECT_ROOT, target)),
        });
      }
    }
  }

  const report = {
    generated_at: nowIso,
    checked_files: files.map((f) => normalize(path.relative(PROJECT_ROOT, f))).length,
    broken_links: issues,
    broken_links_count: issues.length,
  };
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  if (issues.length) {
    console.error(`❌ Broken markdown links found: ${issues.length}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ Markdown link check passed for docs/ (${files.length} files).`);
  }

  console.log(JSON.stringify({ auditDir: normalize(path.relative(PROJECT_ROOT, auditDir)), report: normalize(path.relative(PROJECT_ROOT, outPath)) }, null, 2));
}

main();

