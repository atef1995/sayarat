#!/usr/bin/env node

/**
 * Verification script to ensure no test files are included in production build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findTestFiles(dir, testFiles = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file === '__tests__' || file === 'tests') {
        testFiles.push(filePath);
      } else {
        findTestFiles(filePath, testFiles);
      }
    } else if (file.includes('.test.') || file.includes('.spec.')) {
      testFiles.push(filePath);
    }
  }

  return testFiles;
}

const buildDir = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory not found. Please run build first.');
  process.exit(1);
}

console.log('🔍 Checking build directory for test files...');

const testFiles = findTestFiles(buildDir);

if (testFiles.length > 0) {
  console.error('❌ ERROR: Test files found in production build:');
  testFiles.forEach(file => console.error(`  - ${file}`));
  console.error('\nThis could indicate:');
  console.error('- .dockerignore is not properly configured');
  console.error('- tsconfig.app.json exclude patterns are not working');
  console.error('- Vite config external function needs adjustment');
  process.exit(1);
}

console.log('✅ SUCCESS: No test files found in production build');
console.log('📊 Build verification complete');
