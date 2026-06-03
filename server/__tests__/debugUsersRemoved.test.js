const fs = require('fs');
const path = require('path');

const serverRoot = path.resolve(__dirname, '..');

function listRuntimeJsFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (['__tests__', 'coverage', 'node_modules', 'tests'].includes(entry.name)) {
        return [];
      }
      return listRuntimeJsFiles(fullPath);
    }

    return entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : [];
  });
}

describe('removed debug users endpoint', () => {
  test('runtime server files do not register /api/debug/users', () => {
    const matches = listRuntimeJsFiles(serverRoot).filter(file => {
      const source = fs.readFileSync(file, 'utf8');
      return source.includes('/api/debug/users') || source.includes('debug/users');
    });

    expect(matches).toEqual([]);
  });
});
