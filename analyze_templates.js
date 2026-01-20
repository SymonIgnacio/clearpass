import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_DIR = path.join(__dirname, 'Certificate Templates');

function extractPlaceholders(filePath) {
    try {
        const zip = new AdmZip(filePath);
        const contentXml = zip.readAsText("word/document.xml");
        
        // Remove XML tags to get plain text
        const plainText = contentXml.replace(/<[^>]+>/g, '');
        
        // Find {variable} or {{variable}}
        // The previous regex was a bit loose. Let's try to capture anything inside braces.
        const matches = plainText.match(/\{+[^{}]+\}+/g) || [];
        
        return [...new Set(matches)]; // Unique
    } catch (e) {
        console.error(`Error reading ${filePath}:`, e.message);
        return [];
    }
}

function analyzeTemplates() {
    if (!fs.existsSync(TEMPLATE_DIR)) {
        console.error("Template directory not found:", TEMPLATE_DIR);
        return;
    }

    const files = fs.readdirSync(TEMPLATE_DIR).filter(f => f.endsWith('.docx'));
    const analysis = {};
    const allPlaceholders = new Set();

    console.log("Analyzing templates...\n");

    files.forEach(file => {
        const filePath = path.join(TEMPLATE_DIR, file);
        const placeholders = extractPlaceholders(filePath);
        analysis[file] = placeholders;
        placeholders.forEach(p => allPlaceholders.add(p));
        
        console.log(`[${file}]`);
        if (placeholders.length > 0) {
            console.log(`  Found: ${placeholders.join(', ')}`);
        } else {
            console.log(`  No placeholders found (or parsing failed)`);
        }
    });

    console.log("\n--- SUMMARY OF ALL PLACEHOLDERS ---");
    console.log([...allPlaceholders].sort().join('\n'));
}

analyzeTemplates();
