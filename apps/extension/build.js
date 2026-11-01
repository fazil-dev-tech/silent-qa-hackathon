const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const files = ['inject-main.ts', 'content.ts', 'worker.ts'];

for (const file of files) {
  const srcFile = path.join(srcDir, file);
  if (!fs.existsSync(srcFile)) continue;
  const sourceCode = fs.readFileSync(srcFile, 'utf8');

  // Use official TypeScript compiler to transpile cleanly
  const result = ts.transpileModule(sourceCode, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      removeComments: false,
    },
  });

  const outFile = path.join(distDir, file.replace('.ts', '.js'));
  fs.writeFileSync(outFile, result.outputText, 'utf8');
  console.log(`✓ Transpiled ${file} -> ${path.basename(outFile)}`);
}

console.log('✓ Extension build completed with official TypeScript compiler!');
