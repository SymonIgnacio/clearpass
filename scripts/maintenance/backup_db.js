const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'clearpass_db';
const BACKUP_DIR = path.join(__dirname, '../../database/backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `backup-${DB_NAME}-${timestamp}.sql`;
const filepath = path.join(BACKUP_DIR, filename);

const cmd = `mysqldump -u ${DB_USER} ${DB_PASSWORD ? `-p${DB_PASSWORD}` : ''} ${DB_NAME} > "${filepath}"`;

console.log(`Starting backup for ${DB_NAME}...`);
exec(cmd, (error, stdout, stderr) => {
  if (error) {
    console.error(`Backup failed: ${error.message}`);
    return;
  }
  if (stderr) {
    // mysqldump writes to stderr for progress, which is fine, but check if it's an error
    // console.log(`stderr: ${stderr}`);
  }
  console.log(`Backup successful: ${filepath}`);
});
