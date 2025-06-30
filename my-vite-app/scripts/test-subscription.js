#!/usr/bin/env node

/**
 * Test Runner Script for Subscription System
 * 
 * Usage:
 *   npm run test:subscription              # Run all subscription tests
 *   npm run test:subscription -- --headed  # Run with browser visible
 *   npm run test:subscription -- --debug   # Run with debug mode
 */

import { spawn } from 'child_process';

const args = process.argv.slice(2);
const playwrightArgs = [
  'test',
  '--config=subscription.config.ts',
  '--reporter=list',
  ...args
];

console.log('🚀 Starting Subscription System Tests...');
console.log('📋 Test Suite: Authentication + Premium Features + AI Integration');
console.log('⚙️  Command:', 'npx playwright', playwrightArgs.join(' '));
console.log('');

const playwright = spawn('npx', ['playwright', ...playwrightArgs], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

playwright.on('close', (code) => {
  if (code === 0) {
    console.log('');
    console.log('✅ All subscription tests completed successfully!');
  } else {
    console.log('');
    console.log('❌ Some tests failed. Check the output above for details.');
    console.log('💡 Tips for debugging:');
    console.log('   - Run with --headed to see browser');
    console.log('   - Run with --debug for step-by-step execution');
    console.log('   - Check test-results/ for videos and traces');
  }
  process.exit(code);
});

playwright.on('error', (error) => {
  console.error('❌ Failed to start Playwright:', error);
  process.exit(1);
});
