/**
 * Color Theme Validator
 * Run this script to validate all color references in the app
 */

const fs = require('fs');
const path = require('path');

// Import colors
const colorsPath = path.join(__dirname, '../src/constants/colors.js');
const colorsContent = fs.readFileSync(colorsPath, 'utf8');

// Extract color keys from colors.js
const colorKeys = [];
const colorRegex = /(\w+):\s*['"]#[0-9A-Fa-f]{6}['"]/g;
let match;
while ((match = colorRegex.exec(colorsContent)) !== null) {
    colorKeys.push(match[1]);
}

console.log('✅ Found', colorKeys.length, 'color definitions');
console.log('Color keys:', colorKeys.join(', '));

// Check all screen files
const screensDir = path.join(__dirname, '../src/screens');
const screenFiles = fs.readdirSync(screensDir).filter(f => f.endsWith('.js'));

console.log('\n📁 Checking', screenFiles.length, 'screen files...\n');

let totalIssues = 0;
const issues = [];

screenFiles.forEach(file => {
    const filePath = path.join(screensDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if colors is imported
    const hasImport = /import\s+colors\s+from\s+['"]\.\.\/constants\/colors['"]/.test(content);

    if (!hasImport && /colors\./.test(content)) {
        issues.push(`❌ ${file}: Uses colors but missing import`);
        totalIssues++;
    }

    // Find all color references
    const colorRefRegex = /colors\.(\w+)/g;
    let refMatch;
    const usedColors = new Set();

    while ((refMatch = colorRefRegex.exec(content)) !== null) {
        usedColors.add(refMatch[1]);
    }

    // Check for undefined colors
    usedColors.forEach(colorKey => {
        if (!colorKeys.includes(colorKey)) {
            issues.push(`⚠️  ${file}: References undefined color 'colors.${colorKey}'`);
            totalIssues++;
        }
    });

    // Check for hardcoded colors
    const hardcodedRegex = /(?:color|backgroundColor|borderColor):\s*['"]#[0-9A-Fa-f]{3,6}['"]/g;
    const hardcodedMatches = content.match(hardcodedRegex);

    if (hardcodedMatches && hardcodedMatches.length > 0) {
        issues.push(`💡 ${file}: Has ${hardcodedMatches.length} hardcoded color(s) - consider using theme`);
    }
});

// Print results
if (issues.length > 0) {
    console.log('Issues found:\n');
    issues.forEach(issue => console.log(issue));
} else {
    console.log('✅ No color theme issues found!');
}

console.log('\n📊 Summary:');
console.log('- Total screens checked:', screenFiles.length);
console.log('- Total issues:', totalIssues);
console.log('- Suggestions:', issues.length - totalIssues);

if (totalIssues === 0) {
    console.log('\n🎉 All color references are valid!');
} else {
    console.log('\n⚠️  Please fix the issues above');
}
