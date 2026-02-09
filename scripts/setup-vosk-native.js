#!/usr/bin/env node
/**
 * Downloads the libvosk native library from the vosk npm package tarball.
 * Run this after `npm install` or when the native/vosk/ directory is missing.
 *
 * The vosk npm package (v0.3.39) bundles pre-built native libraries for:
 *   - macOS (universal): lib/osx-universal/libvosk.dylib
 *   - Linux (x86_64):    lib/linux-x86_64/libvosk.so
 *   - Windows (x86_64):  lib/win-x86_64/libvosk.dll
 *
 * We extract only the library for the current platform.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const VOSK_VERSION = '0.3.39';
const PROJECT_ROOT = path.resolve(__dirname, '..');
const NATIVE_DIR = path.join(PROJECT_ROOT, 'native', 'vosk');

// Map platform to the tarball path inside the vosk package
function getLibInfo() {
  const platform = os.platform();
  if (platform === 'darwin') {
    return { tarPath: 'package/lib/osx-universal/libvosk.dylib', fileName: 'libvosk.dylib' };
  } else if (platform === 'win32') {
    return { tarPath: 'package/lib/win-x86_64/libvosk.dll', fileName: 'libvosk.dll' };
  } else {
    return { tarPath: 'package/lib/linux-x86_64/libvosk.so', fileName: 'libvosk.so' };
  }
}

function main() {
  const { tarPath, fileName } = getLibInfo();
  const destFile = path.join(NATIVE_DIR, fileName);

  if (fs.existsSync(destFile)) {
    console.log(`[setup-vosk-native] ${fileName} already exists at ${destFile}, skipping.`);
    return;
  }

  console.log(`[setup-vosk-native] Downloading vosk@${VOSK_VERSION} native library...`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vosk-native-'));
  const tgzPath = path.join(tmpDir, `vosk-${VOSK_VERSION}.tgz`);

  try {
    // Download the vosk npm tarball
    execSync(`npm pack vosk@${VOSK_VERSION} --pack-destination "${tmpDir}"`, {
      stdio: 'pipe',
    });

    // Extract only the native library
    fs.mkdirSync(NATIVE_DIR, { recursive: true });
    execSync(`tar xzf "${tgzPath}" -C "${tmpDir}" "${tarPath}"`, { stdio: 'pipe' });

    // Copy to destination
    fs.copyFileSync(path.join(tmpDir, tarPath), destFile);
    fs.chmodSync(destFile, 0o755);

    console.log(`[setup-vosk-native] Installed ${fileName} to ${destFile}`);
  } finally {
    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

try {
  main();
} catch (err) {
  console.error('[setup-vosk-native] Failed to download vosk native library:', err.message);
  console.error('[setup-vosk-native] Speech recognition will run in stub mode.');
  process.exit(0); // Don't fail the install
}
