const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const normalize = (p) => p.split(path.sep).join('/');

const sha256File = (file) => {
  const hash = crypto.createHash('sha256');
  const buf = fs.readFileSync(file);
  hash.update(buf);
  return hash.digest('hex');
};

const safeMkdirp = (p) => fs.mkdirSync(p, { recursive: true });

const copyFileWithDirs = (src, dst) => {
  safeMkdirp(path.dirname(dst));
  fs.copyFileSync(src, dst);
};

const usage = () => {
  console.error('Usage: node scripts/cleanup/apply_cleanup.cjs --plan <plan.json>');
  process.exit(2);
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const planIndex = args.indexOf('--plan');
  if (planIndex === -1 || !args[planIndex + 1]) usage();
  return { planPath: path.resolve(process.cwd(), args[planIndex + 1]) };
};

const isPreservedPath = (rel) => {
  const base = path.basename(rel).toLowerCase();
  if (base.startsWith('.git')) return true;
  if (base === '.env' || base.startsWith('.env.')) return true;
  if (base.startsWith('config.') || base.startsWith('settings.')) return true;
  if (base.startsWith('readme')) return true;
  if (base.startsWith('license')) return true;
  if (base.startsWith('changelog')) return true;
  if (base.startsWith('contributing')) return true;
  if (base === 'package.json' || base === 'package-lock.json') return true;
  if (base === 'requirements.txt' || base === 'requirements_test.txt') return true;
  if (base === 'makefile') return true;
  return false;
};

function main() {
  const { planPath } = parseArgs();
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const nowIso = new Date().toISOString();
  const ts = nowIso.replace(/:/g, '-');

  const archiveRoot = path.join(PROJECT_ROOT, '.cleanup_archive', ts);
  const auditDir = path.join(PROJECT_ROOT, 'audits', 'cleanup', ts);
  safeMkdirp(archiveRoot);
  safeMkdirp(auditDir);

  const auditLogPath = path.join(auditDir, 'cleanup-actions.jsonl');
  const summaryPath = path.join(auditDir, 'cleanup-summary.json');

  let totalBytes = 0;
  const removed = [];

  for (const item of plan.files || []) {
    const rel = item.path;
    if (!rel) continue;

    if (isPreservedPath(rel)) {
      fs.appendFileSync(
        auditLogPath,
        JSON.stringify({ time: nowIso, action: 'SKIP_PRESERVED', path: rel, rationale: item.rationale || null }) + '\n'
      );
      continue;
    }

    const src = path.join(PROJECT_ROOT, rel);
    if (!fs.existsSync(src) || !fs.statSync(src).isFile()) {
      fs.appendFileSync(
        auditLogPath,
        JSON.stringify({ time: nowIso, action: 'SKIP_MISSING', path: rel, rationale: item.rationale || null }) + '\n'
      );
      continue;
    }

    const stat = fs.statSync(src);
    const fileHash = sha256File(src);
    const dst = path.join(archiveRoot, rel);
    copyFileWithDirs(src, dst);

    fs.unlinkSync(src);

    totalBytes += stat.size;

    const record = {
      time: new Date().toISOString(),
      action: 'REMOVE',
      path: rel,
      size_bytes: stat.size,
      mtime_iso: stat.mtime.toISOString(),
      sha256: fileHash,
      rationale: item.rationale || null,
      archived_to: normalize(path.relative(PROJECT_ROOT, dst)),
    };
    fs.appendFileSync(auditLogPath, JSON.stringify(record) + '\n');
    removed.push({ path: rel, size_bytes: stat.size, rationale: item.rationale || null });
  }

  const summary = {
    executed_at: nowIso,
    plan: normalize(path.relative(PROJECT_ROOT, planPath)),
    archive_root: normalize(path.relative(PROJECT_ROOT, archiveRoot)),
    removed_files: removed,
    space_reclaimed_bytes: totalBytes,
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log(JSON.stringify({ auditDir: normalize(path.relative(PROJECT_ROOT, auditDir)), space_reclaimed_bytes: totalBytes }, null, 2));
}

main();
