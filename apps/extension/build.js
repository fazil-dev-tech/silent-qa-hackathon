const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Basic type-stripper for extension files if running zero-tooling
const files = ['inject-main.ts', 'content.ts', 'worker.ts'];

for (const file of files) {
  const srcFile = path.join(srcDir, file);
  if (!fs.existsSync(srcFile)) continue;
  let code = fs.readFileSync(srcFile, 'utf8');

  // Strip TypeScript types
  code = code
    .replace(/:\s*[A-Za-z0-9_<>\[\]|&\s,{}]+(?=[=),;{])/g, '')
    .replace(/as\s+[A-Za-z0-9_<>\[\]|]+/g, '')
    .replace(/interface\s+[A-Za-z0-9_]+\s*\{[^}]*\}/g, '')
    .replace(/type\s+[A-Za-z0-9_]+\s*=[^;]+;/g, '');

  const outFile = path.join(distDir, file.replace('.ts', '.js'));
  fs.writeFileSync(outFile, code, 'utf8');
  console.log(`✓ Built ${file} -> ${path.basename(outFile)}`);
}
console.log('✓ Extension build completed!');
