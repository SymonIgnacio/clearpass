const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const normalize = (p) => p.split(path.sep).join('/');

const safeMkdirp = (p) => fs.mkdirSync(p, { recursive: true });

const IGNORE_DIR_NAMES = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.cleanup_archive']);

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
      } else if (entry.isFile()) {
        results.push(full);
      }
    }
  }
  return results;
};

const makePlanItem = (rel, rationale) => ({ path: rel, rationale });

function main() {
  const nowIso = new Date().toISOString();
  const ts = nowIso.replace(/:/g, '-');
  const outDir = path.join(PROJECT_ROOT, 'audits', 'cleanup', ts);
  safeMkdirp(outDir);

  const allFiles = walk(PROJECT_ROOT).map((f) => normalize(path.relative(PROJECT_ROOT, f)));

  const files = [];

  for (const rel of allFiles) {
    const lower = rel.toLowerCase();
    if (lower.includes('/__pycache__/') && lower.endsWith('.pyc')) {
      files.push(makePlanItem(rel, 'Remove Python bytecode cache'));
    } else if (lower.endsWith('.pyc')) {
      files.push(makePlanItem(rel, 'Remove Python bytecode cache'));
    } else if (lower.endsWith('.backup') || lower.endsWith('.bak') || lower.endsWith('.old')) {
      files.push(makePlanItem(rel, 'Remove backup artifact'));
    } else if (lower.endsWith('debug_output.html')) {
      files.push(makePlanItem(rel, 'Remove debug artifact'));
    } else if (lower.endsWith('test_output.txt')) {
      files.push(makePlanItem(rel, 'Remove test output artifact'));
    } else if (lower.endsWith('/server/index.js.backup')) {
      files.push(makePlanItem(rel, 'Remove deprecated server entry backup'));
    }
  }

  const plan = {
    generated_at: nowIso,
    strategy: 'Conservative cleanup plan: only deletes generated artifacts and explicit backups/debug outputs.',
    files: files.sort(),
  };

  const planPath = path.join(outDir, 'cleanup-plan.json');
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));

  console.log(JSON.stringify({ outDir: normalize(path.relative(PROJECT_ROOT, outDir)), plan: normalize(path.relative(PROJECT_ROOT, planPath)), files: plan.files.length }, null, 2));
}

main();

