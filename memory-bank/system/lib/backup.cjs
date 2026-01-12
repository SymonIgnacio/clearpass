const fs = require('fs');
const path = require('path');

const MEMORY_BANK_ROOT = path.resolve(__dirname, '../..');
const BACKUP_ROOT = path.join(MEMORY_BANK_ROOT, 'backups');

async function createBackup() {
    if (!fs.existsSync(BACKUP_ROOT)) {
        fs.mkdirSync(BACKUP_ROOT, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = path.join(BACKUP_ROOT, timestamp);

    console.log(`Creating backup at ${dest}...`);

    try {
        // Exclude backups folder itself to avoid infinite recursion if it was inside
        // But here backups is inside memory-bank, so we must be careful.
        // We will copy 'entries', 'system', 'data', 'templates', 'INDEX.md', 'README.md', 'STRUCTURE.md' explicitly.
        
        fs.mkdirSync(dest, { recursive: true });

        const itemsToBackup = ['entries', 'system', 'data', 'templates', 'INDEX.md', 'README.md', 'STRUCTURE.md'];

        for (const item of itemsToBackup) {
            const srcPath = path.join(MEMORY_BANK_ROOT, item);
            const destPath = path.join(dest, item);

            if (fs.existsSync(srcPath)) {
                fs.cpSync(srcPath, destPath, { recursive: true });
            }
        }
        
        console.log('Backup completed successfully.');
        return dest;
    } catch (e) {
        console.error('Backup failed:', e);
        throw e;
    }
}

module.exports = { createBackup };
