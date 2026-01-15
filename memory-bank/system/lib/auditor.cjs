const fs = require('fs');
const path = require('path');

const MEMORY_BANK_ROOT = path.resolve(__dirname, '../..');
const LOG_MD_PATH = path.join(MEMORY_BANK_ROOT, 'entries/audit-log.md');
const LOG_JSON_PATH = path.join(MEMORY_BANK_ROOT, 'data/audit-history.json');

function ensureLogFiles() {
    if (!fs.existsSync(path.dirname(LOG_MD_PATH))) fs.mkdirSync(path.dirname(LOG_MD_PATH), { recursive: true });
    if (!fs.existsSync(path.dirname(LOG_JSON_PATH))) fs.mkdirSync(path.dirname(LOG_JSON_PATH), { recursive: true });

    if (!fs.existsSync(LOG_MD_PATH)) {
        fs.writeFileSync(LOG_MD_PATH, '# System Audit Log\n\n| Date | Author | Change | Rationale |\n| :--- | :--- | :--- | :--- |\n');
    }

    if (!fs.existsSync(LOG_JSON_PATH)) {
        fs.writeFileSync(LOG_JSON_PATH, JSON.stringify([], null, 2));
    }
}

function addAuditEntry(author, change, rationale) {
    ensureLogFiles();

    const timestamp = new Date().toISOString();
    
    // Update JSON
    const history = JSON.parse(fs.readFileSync(LOG_JSON_PATH, 'utf8'));
    history.push({
        timestamp,
        author,
        change,
        rationale
    });
    fs.writeFileSync(LOG_JSON_PATH, JSON.stringify(history, null, 2));

    // Update Markdown
    // Escape pipes in content to avoid breaking tables
    const safeChange = change.replace(/\|/g, '\\|');
    const safeRationale = rationale.replace(/\|/g, '\\|');
    const row = `| ${timestamp.split('T')[0]} | ${author} | ${safeChange} | ${safeRationale} |\n`;
    fs.appendFileSync(LOG_MD_PATH, row);

    console.log('Audit entry recorded.');
}

module.exports = { addAuditEntry };
