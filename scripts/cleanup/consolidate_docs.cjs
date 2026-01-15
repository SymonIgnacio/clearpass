const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const normalize = (p) => p.split(path.sep).join('/');

const safeMkdirp = (p) => fs.mkdirSync(p, { recursive: true });

const listRootMarkdown = () => {
  const entries = fs.readdirSync(PROJECT_ROOT, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.md'))
    .map((e) => path.join(PROJECT_ROOT, e.name));
};

const fileExists = (p) => {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
};

const uniqueTargetPath = (dir, filename) => {
  const base = filename.replace(/\.md$/i, '');
  const ext = '.md';
  let candidate = path.join(dir, filename);
  if (!fileExists(candidate)) return candidate;
  candidate = path.join(dir, `${base}__root${ext}`);
  if (!fileExists(candidate)) return candidate;
  let i = 2;
  while (true) {
    const p = path.join(dir, `${base}__root_${i}${ext}`);
    if (!fileExists(p)) return p;
    i += 1;
  }
};

const buildDocsIndex = (movedRelPaths) => {
  const lines = [];
  lines.push('# Documentation Index');
  lines.push('');
  lines.push('This folder contains the consolidated documentation for ClearPass.');
  lines.push('');
  lines.push('## Quick Links');
  lines.push('');
  const quick = [
    'README.md',
    'SETUP_GUIDE.md',
    'ENVIRONMENT_CONFIGURATION.md',
    'TESTING_GUIDE.md',
    'ARCHITECTURE.md',
    'API_REFERENCE.md',
    'SECURITY_AUDIT_REPORT.md',
    'SECURITY_REMEDIATION_CHECKLIST.md',
    'CHANGELOG.md',
  ];
  for (const f of quick) {
    const p = path.join(PROJECT_ROOT, 'docs', f);
    if (fileExists(p)) lines.push(`- [${f}](./${f})`);
  }
  lines.push('');
  lines.push('## Root Documentation (Archived)');
  lines.push('');
  for (const rel of movedRelPaths.sort()) {
    lines.push(`- [${path.basename(rel)}](../${rel})`);
  }
  lines.push('');
  return lines.join('\n');
};

function main() {
  const nowIso = new Date().toISOString();
  const ts = nowIso.replace(/:/g, '-');

  const auditDir = path.join(PROJECT_ROOT, 'audits', 'cleanup', ts);
  const archiveRoot = path.join(PROJECT_ROOT, '.cleanup_archive', ts, 'docs-root');
  const legacyDir = path.join(PROJECT_ROOT, 'docs', 'legacy', 'root-md');
  safeMkdirp(auditDir);
  safeMkdirp(archiveRoot);
  safeMkdirp(legacyDir);

  const auditLogPath = path.join(auditDir, 'docs-consolidation.jsonl');

  const rootMds = listRootMarkdown();
  const moved = [];

  for (const src of rootMds) {
    const name = path.basename(src);
    const relSrc = normalize(path.relative(PROJECT_ROOT, src));

    const backupDst = path.join(archiveRoot, name);
    fs.copyFileSync(src, backupDst);

    const target = uniqueTargetPath(legacyDir, name);
    fs.renameSync(src, target);

    const relTarget = normalize(path.relative(PROJECT_ROOT, target));
    moved.push(relTarget);

    fs.appendFileSync(
      auditLogPath,
      JSON.stringify({
        time: new Date().toISOString(),
        action: 'MOVE_DOC',
        from: relSrc,
        to: relTarget,
        archived_to: normalize(path.relative(PROJECT_ROOT, backupDst)),
      }) + '\n'
    );
  }

  const indexPath = path.join(PROJECT_ROOT, 'docs', 'INDEX.md');
  fs.writeFileSync(indexPath, buildDocsIndex(moved));

  console.log(
    JSON.stringify(
      {
        auditDir: normalize(path.relative(PROJECT_ROOT, auditDir)),
        moved_count: moved.length,
        legacy_dir: normalize(path.relative(PROJECT_ROOT, legacyDir)),
        index: normalize(path.relative(PROJECT_ROOT, indexPath)),
      },
      null,
      2
    )
  );
}

main();

