const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const INDEX_PATH = path.join(__dirname, '../../data/file-index.json');
const MEMORY_BANK_ROOT = path.join(__dirname, '../..');

const extractDescription = (filePath) => {
    try {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const ext = path.extname(filePath).toLowerCase();
        
        let match;
        // JS/TS JSDoc or block comment at top
        if (['.js', '.cjs', '.mjs', '.jsx', '.ts', '.tsx'].includes(ext)) {
            match = content.match(/^\s*\/\*\*([\s\S]*?)\*\//);
            if (!match) match = content.match(/^\s*\/\*([\s\S]*?)\*\//);
        } 
        // Python docstring
        else if (ext === '.py') {
            match = content.match(/^\s*"""([\s\S]*?)"""/);
            if (!match) match = content.match(/^\s*'''([\s\S]*?)'''/);
        }
        
        if (match) {
            return match[1].split('\n')
                .map(line => line.replace(/^\s*\*?\s?/, '').trim())
                .filter(Boolean)
                .join(' ');
        }
        return null;
    } catch (e) {
        return null;
    }
};

async function generateDocs() {
    console.log('Generating documentation...');
    
    if (!fs.existsSync(INDEX_PATH)) {
        console.error('Index file not found. Run indexer first.');
        return;
    }

    const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
    const files = Object.keys(index.files).sort();
    
    // Group by directory
    const tree = {};
    files.forEach(f => {
        const parts = f.split('/');
        const dir = parts.slice(0, -1).join('/');
        const file = parts[parts.length - 1];
        
        if (!tree[dir]) tree[dir] = [];
        tree[dir].push(file);
    });

    let md = '# System Code Map\n\nAuto-generated documentation of project files.\n\n';
    
    for (const dir of Object.keys(tree).sort()) {
        if (dir === '' || dir === '.') continue; // Skip root for clarity if needed, or keep it
        
        md += `## /${dir}\n\n`;
        md += `| File | Size | Description |\n`;
        md += `| :--- | :--- | :--- |\n`;
        
        for (const filename of tree[dir]) {
            const relPath = dir ? `${dir}/${filename}` : filename;
            const meta = index.files[relPath];
            const desc = extractDescription(relPath) || '-';
            const size = (meta.size_bytes / 1024).toFixed(1) + ' KB';
            
            md += `| [${filename}](file:///${path.join(PROJECT_ROOT, relPath).replace(/\\/g, '/')}) | ${size} | ${desc.slice(0, 100)}${desc.length > 100 ? '...' : ''} |\n`;
        }
        md += '\n';
    }
    
    const outPath = path.join(MEMORY_BANK_ROOT, 'system/CODE_MAP.md');
    fs.writeFileSync(outPath, md);
    console.log(`Documentation map written to ${outPath}`);
    
    // Update INDEX.md
    updateIndexMd();
}

function updateIndexMd() {
    const indexPath = path.join(MEMORY_BANK_ROOT, 'INDEX.md');
    let content = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '# Memory Bank Index\n\n';
    
    const link = '- [System Code Map](system/CODE_MAP.md) (Auto-generated)';
    
    if (!content.includes('CODE_MAP.md')) {
        content += `\n\n## Auto-Generated Docs\n${link}\n`;
        fs.writeFileSync(indexPath, content);
        console.log('Updated INDEX.md');
    }
}

if (require.main === module) {
    generateDocs();
}

module.exports = { generateDocs };
