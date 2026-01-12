const readline = require('readline');
const { indexProject } = require('./lib/indexer.cjs');
const { generateDocs } = require('./lib/doc-generator.cjs');
const { addAuditEntry } = require('./lib/auditor.cjs');
const { createBackup } = require('./lib/backup.cjs');

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
    console.log(`
Memory Bank CLI - Project Audit & Documentation System

Usage: node memory-bank/system/cli.js <command>

Commands:
  scan      Run file indexer and generate documentation
  audit     Record a new audit entry (interactive)
  backup    Create a backup of the memory bank
  help      Show this help message
`);
}

async function runAuditInteractive() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (q) => new Promise(resolve => rl.question(q, resolve));

    try {
        console.log('\n--- Record Audit Entry ---\n');
        
        const author = await question('Author (Name/ID): ');
        if (!author) throw new Error('Author is required');

        const change = await question('Change Description (What changed?): ');
        if (!change) throw new Error('Description is required');

        const rationale = await question('Rationale (Why?): ');
        if (!rationale) throw new Error('Rationale is required');

        addAuditEntry(author, change, rationale);
        
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        rl.close();
    }
}

async function main() {
    switch (command) {
        case 'scan':
            try {
                await indexProject();
                await generateDocs();
            } catch (e) {
                console.error('Scan failed:', e);
            }
            break;
            
        case 'audit':
            await runAuditInteractive();
            break;
            
        case 'backup':
            await createBackup();
            break;
            
        case 'help':
        default:
            printHelp();
            break;
    }
}

main();
