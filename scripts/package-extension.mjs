import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = process.cwd();
const extDir = path.join(rootDir, 'apps', 'extension');
const distDir = path.join(extDir, 'dist');
const webPublicDir = path.join(rootDir, 'apps', 'web', 'public');
const downloadsDir = path.join(webPublicDir, 'downloads');

console.log('1. Building extension TypeScript sources...');
execSync('node build.js', { cwd: extDir, stdio: 'inherit' });

console.log('2. Preparing staging directory...');
const stageDir = path.join(extDir, 'staged_package');
if (fs.existsSync(stageDir)) {
  fs.rmSync(stageDir, { recursive: true, force: true });
}
fs.mkdirSync(stageDir, { recursive: true });

// Copy manifest.json
fs.copyFileSync(path.join(extDir, 'manifest.json'), path.join(stageDir, 'manifest.json'));

// Copy dist
fs.cpSync(distDir, path.join(stageDir, 'dist'), { recursive: true });

// Copy popup
fs.cpSync(path.join(extDir, 'popup'), path.join(stageDir, 'popup'), { recursive: true });

// Copy options
fs.cpSync(path.join(extDir, 'options'), path.join(stageDir, 'options'), { recursive: true });

// Write comprehensive INSTALL_GUIDE.txt
const installGuide = `===================================================================
  SILENT QA FLIGHT RECORDER - CHROME EXTENSION (MANIFEST V3)
  Zero-Overhead In-Browser Telemetry & Causal Defect Capture
===================================================================

INSTALLATION STEPS (UNDER 30 SECONDS):

1. EXTRACT THIS ARCHIVE:
   Extract the contents of this .zip file to a permanent folder on your computer
   (e.g., C:\\Users\\YourName\\SilentQA-Extension or Documents/silent-qa-extension).
   Ensure 'manifest.json' is located directly in the root of that extracted folder.

2. OPEN EXTENSIONS IN CHROME:
   In Google Chrome (or Edge, Brave, Chromium), open a new tab and navigate to:
   chrome://extensions  (or edge://extensions)

3. TOGGLE "DEVELOPER MODE":
   In the top-right corner of the Extensions page, switch the "Developer mode" toggle to ON.

4. LOAD UNPACKED EXTENSION:
   Click the "Load unpacked" button in the top-left menu bar.
   Select the extracted folder containing 'manifest.json'.

5. PIN & VERIFY FLIGHT RECORDER:
   Click the puzzle piece icon (Extensions menu) in the Chrome toolbar and click the PIN icon
   next to "Silent QA Flight Recorder".
   The Silent QA icon will now appear in your browser bar.

6. LINK ACTIVE WORKSPACE / STATION:
   Click the extension icon to view your live ring buffer telemetry status.
   Default endpoint: https://hhhcct.vercel.app/api/ingest (or http://localhost:3000 for local dev)
   Enter your Tester Station ID (e.g. Station-01) and start recording!

===================================================================
Engine: Manifest V3 • Zero Scroll Jank (<0.15ms) • AES-GCM Encrypted Ring Buffer
`;

fs.writeFileSync(path.join(stageDir, 'INSTALL_GUIDE.txt'), installGuide, 'utf8');

// Ensure destination downloads folder exists
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

const targetZip = path.join(downloadsDir, 'silent-qa-flight-recorder.zip');
if (fs.existsSync(targetZip)) {
  fs.unlinkSync(targetZip);
}

console.log('3. Archiving extension to ZIP: ', targetZip);
const psCommand = `$ProgressPreference = 'SilentlyContinue'; Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${stageDir}', '${targetZip}')`;
execSync(`powershell -NoProfile -Command "${psCommand}"`, { stdio: 'inherit' });

const stats = fs.statSync(targetZip);
console.log(`✓ Extension packaged successfully! (${(stats.size / 1024).toFixed(1)} KB)`);
console.log(`✓ Saved to: ${targetZip}`);
