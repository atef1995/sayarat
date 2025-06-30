#!/usr/bin/env node

/**
 * Quick Fix Script for Common ESLint Issues
 * 
 * This script provides targeted fixes for the most common linting issues
 * in the codebase to help reduce the remaining 2,498 problems systematically.
 */

const { execSync } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, silent = false) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit',
      cwd: process.cwd()
    });
    return { success: true, stdout: output, stderr: null };
  } catch (error) {
    return {
      success: false,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message
    };
  }
}

/**
 * Get a summary of current linting issues
 */
function getLintingSummary() {
  log('\n🔍 Analyzing current linting issues...', colors.blue);

  const result = runCommand('npm run lint', true);
  const output = result.stdout + result.stderr;

  // Extract summary line
  const summaryMatch = output.match(/✖ (\d+) problems \((\d+) errors, (\d+) warnings\)/);

  if (summaryMatch) {
    const [, total, errors, warnings] = summaryMatch;
    log('📊 Current Status:', colors.cyan);
    log(`   Total Problems: ${total}`, colors.yellow);
    log(`   Errors: ${errors}`, colors.red);
    log(`   Warnings: ${warnings}`, colors.yellow);

    return { total: parseInt(total), errors: parseInt(errors), warnings: parseInt(warnings) };
  }

  return null;
}

/**
 * Fix specific types of issues
 */
function fixSpecificIssues() {
  log('\n🔧 Running targeted fixes...', colors.blue);

  // Fix specific rules that can be auto-fixed
  const fixableRules = [
    'space-before-function-paren',
    'quotes',
    'semi',
    'comma-dangle',
    'indent',
    'space-infix-ops',
    'space-before-blocks',
    'keyword-spacing',
    'object-curly-spacing',
    'array-bracket-spacing'
  ];

  for (const rule of fixableRules) {
    log(`   Fixing ${rule}...`, colors.cyan);
    runCommand(`npx eslint . --ext .js --fix --rule "${rule}: error"`, true);
  }

  log('✅ Targeted fixes completed', colors.green);
}

/**
 * Generate a file-by-file report of issues
 */
function generateFileReport() {
  log('\n📝 Generating file-by-file report...', colors.blue);

  const result = runCommand('npm run lint', true);
  const output = result.stdout + result.stderr;

  const files = new Map();
  const lines = output.split('\n');
  let currentFile = '';

  for (const line of lines) {
    // Check if line is a file path
    if (line.includes('\\') && line.includes('.js')) {
      currentFile = line.trim();
      if (!files.has(currentFile)) {
        files.set(currentFile, { errors: 0, warnings: 0, issues: [] });
      }
    } else if (line.includes('error') || line.includes('warning')) {
      // Extract error/warning details
      const errorMatch = line.match(/(\d+):(\d+)\s+(error|warning)\s+(.+)/);
      if (errorMatch && currentFile) {
        const [, lineNum, colNum, type, message] = errorMatch;
        const fileData = files.get(currentFile);

        if (type === 'error') {
          fileData.errors++;
        } else {
          fileData.warnings++;
        }

        fileData.issues.push({ line: lineNum, col: colNum, type, message });
      }
    }
  }

  // Sort files by total issues (errors + warnings)
  const sortedFiles = Array.from(files.entries())
    .map(([file, data]) => ({
      file,
      total: data.errors + data.warnings,
      errors: data.errors,
      warnings: data.warnings,
      issues: data.issues
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10); // Top 10 files with most issues

  log('\n📈 Top 10 files with most issues:', colors.yellow);
  log('=====================================', colors.yellow);

  for (const { file, total, errors, warnings } of sortedFiles) {
    const fileName = path.basename(file);
    log(`${fileName}: ${total} issues (${errors} errors, ${warnings} warnings)`, colors.cyan);
  }

  return sortedFiles;
}

/**
 * Provide specific recommendations based on issue patterns
 */
function provideRecommendations() {
  log('\n💡 Recommendations for manual fixes:', colors.yellow);
  log('=====================================', colors.yellow);

  const recommendations = [
    {
      rule: 'unused-imports/no-unused-vars',
      description: 'Remove unused variables and imports',
      command: 'Search and manually remove unused variables/imports',
      impact: 'High - Cleans up code significantly'
    },
    {
      rule: 'radix',
      description: 'Add radix parameter to parseInt()',
      command: 'Change parseInt(value) to parseInt(value, 10)',
      impact: 'High - Prevents parsing errors'
    },
    {
      rule: 'consistent-return',
      description: 'Add return statements to functions',
      command: 'Add explicit return statements in functions',
      impact: 'High - Improves code reliability'
    },
    {
      rule: 'no-console',
      description: 'Remove or comment console statements',
      command: 'Replace console.log with proper logging',
      impact: 'Medium - Production readiness'
    },
    {
      rule: 'no-process-env',
      description: 'Move environment variables to config files',
      command: 'Use config files instead of direct process.env',
      impact: 'Medium - Better configuration management'
    }
  ];

  for (const rec of recommendations) {
    log(`\n${rec.rule}:`, colors.cyan);
    log(`  Description: ${rec.description}`, colors.reset);
    log(`  Fix: ${rec.command}`, colors.green);
    log(`  Impact: ${rec.impact}`, colors.yellow);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    log('🚀 JavaScript Backend Code Quality Quick Fix', colors.bright);
    log('============================================', colors.bright);

    // Get current status
    const before = getLintingSummary();

    // Run auto-fixes
    log('\n🔧 Running automatic fixes...', colors.blue);
    runCommand('npm run lint:fix', false);
    runCommand('npm run format', false);

    // Get status after fixes
    log('\n📊 Checking status after fixes...', colors.blue);
    const after = getLintingSummary();

    if (before && after) {
      const fixed = before.total - after.total;
      if (fixed > 0) {
        log(`\n✅ Fixed ${fixed} additional issues!`, colors.green);
      }
    }

    // Generate detailed report
    generateFileReport();

    // Provide recommendations
    provideRecommendations();

    log('\n🎯 Next Steps:', colors.bright);
    log('1. Focus on files with most issues first', colors.cyan);
    log('2. Fix unused imports/variables for biggest impact', colors.cyan);
    log('3. Add radix parameters to parseInt() calls', colors.cyan);
    log('4. Add missing return statements', colors.cyan);
    log('5. Run "npm run code:quality" to track progress', colors.cyan);

    log('\n✨ Code quality improvement in progress!', colors.green);

  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, getLintingSummary, fixSpecificIssues, generateFileReport };
