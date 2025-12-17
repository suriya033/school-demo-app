const fs = require('fs');
const path = require('path');

const files = [
    'frontend/src/screens/FeeManagementScreen.js',
    'backend/controllers/studentController.js',
    'backend/controllers/feeController.js'
];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/&gt;/g, '>');
        content = content.replace(/&lt;/g, '<');
        content = content.replace(/&amp;/g, '&');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Fixed ${file}`);
    } catch (err) {
        console.error(`✗ Error fixing ${file}:`, err.message);
    }
});

console.log('\nDone!');
