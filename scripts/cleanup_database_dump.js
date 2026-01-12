import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, '../database/barangay_management (5).sql');
const OUTPUT_FILE = path.join(__dirname, '../database/cleaned_barangay_management.sql');

// Tables to PURGE (Remove data)
const TABLES_TO_CLEAN = new Set([
    'residents',
    'households',
    'families',
    'blotter',
    'blotter_participants',
    'cases',
    'resident_documents',
    'resident_applications',
    'resident_signup_requests',
    'resident_verification_requests',
    'document_requests',
    'clearance_requests',
    'certificates_log',
    'program_participants',
    'visitors',
    'vehicles',
    'vulnerabilities',
    'ai_analytics_reports',
    'ai_appointments',
    'ai_chatbot_conversations',
    'user_notifications',
    'notifications',
    'login_attempts',
    'application_documents'
]);

async function processFile() {
    console.log(`Processing ${INPUT_FILE}...`);
    
    const fileStream = fs.createReadStream(INPUT_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const outputStream = fs.createWriteStream(OUTPUT_FILE);

    // Add FK check disable at start
    outputStream.write("SET FOREIGN_KEY_CHECKS=0;\n");

    let isSkipping = false;
    let skippingTable = '';
    let processedLines = 0;
    let keptInserts = 0;
    let skippedInserts = 0;

    for await (const line of rl) {
        processedLines++;
        const trimmedLine = line.trim();

        // Check for INSERT start
        // Matches: INSERT INTO `tablename` ...
        // or INSERT INTO tablename ...
        const insertMatch = trimmedLine.match(/^INSERT INTO `?(\w+)`?/i);

        if (insertMatch) {
            const tableName = insertMatch[1];
            if (TABLES_TO_CLEAN.has(tableName)) {
                isSkipping = true;
                skippingTable = tableName;
                skippedInserts++;
                // Check if this single line ends the statement
                if (trimmedLine.endsWith(';')) {
                    isSkipping = false;
                    skippingTable = '';
                }
                continue; // Skip this line
            } else {
                keptInserts++;
                // Not skipping, just print normally
                isSkipping = false; 
            }
        }

        if (isSkipping) {
            // We are inside a multi-line skipped INSERT
            if (trimmedLine.endsWith(';')) {
                isSkipping = false;
                skippingTable = '';
            }
            continue;
        }

        // Write the line if not skipping
        outputStream.write(line + '\n');
    }

    // Add FK check enable at end
    outputStream.write("SET FOREIGN_KEY_CHECKS=1;\n");

    outputStream.end();

    console.log('Cleanup complete.');
    console.log(`Processed Lines: ${processedLines}`);
    console.log(`Kept INSERT blocks: ${keptInserts}`);
    console.log(`Skipped INSERT blocks: ${skippedInserts}`);
    console.log(`Output written to: ${OUTPUT_FILE}`);
}

processFile().catch(console.error);
