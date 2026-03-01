const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

walkDir('./app/admin', (filePath) => {
    if (!filePath.endsWith('.tsx')) return;
    // Ignore layout and Navbar themselves
    if (filePath.endsWith('layout.tsx') || filePath.endsWith('Navbar.tsx')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Remove import Navbar ...
    content = content.replace(/^import\s+Navbar\s+from\s+['"].*?Navbar.*?['"];?[\r\n]+/gm, '');

    // Remove <Navbar ... /> (supports multiline props)
    content = content.replace(/^\s*<Navbar[\s\S]*?\/>\s*/gm, '');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Removed Navbar from:', filePath);
    }
});
