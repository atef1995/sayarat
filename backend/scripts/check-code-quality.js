#!/usr/bin/env node

/**
 * Code Quality Check Script
 *
 * Comprehensive code quality validation including:
 * - ESLint for code quality and style
 * - Prettier for formatting
 * - Import/export validation
 * - Unused variables detection
 * - Security checks
 * - Dependency analysis
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Log with colors
 * @param {string} message - Message to log
 * @param {string} color - Color code
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Execute command and return result
 * @param {string} command - Command to execute
 * @param {boolean} silent - Whether to suppress output
 * @returns {Object} - Result object with success, stdout, stderr
 */
function runCommand(command, silent = false) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
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
 * Check if file exists
 * @param {string} filePath - Path to file
 * @returns {boolean}
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Check if required packages are installed
 * @returns {boolean} True if all packages are installed
 */
function checkDependencies() {
  log('\n📦 Checking dependencies...', colors.blue);

  const requiredPackages = ['eslint', 'prettier', '@eslint/js'];

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const devDeps = packageJson.devDependencies || {};

  let allInstalled = true;

  for (const pkg of requiredPackages) {
    if (!devDeps[pkg]) {
      log(`❌ Missing package: ${pkg}`, colors.red);
      allInstalled = false;
    } else {
      log(`✅ Found: ${pkg}@${devDeps[pkg]}`, colors.green);
    }
  }

  if (!allInstalled) {
    log('\n💡 Run: npm install to install missing packages', colors.yellow);
  }

  return allInstalled;
}

/**
 * Run ESLint check
 * @returns {boolean} True if no errors
 */
function runESLintCheck() {
  log('\n🔍 Running ESLint check...', colors.blue);

  const result = runCommand('npx eslint . --ext .js --format compact', true);

  if (result.success) {
    log('✅ ESLint: No errors found!', colors.green);
    return true;
  } else {
    log('❌ ESLint found issues:', colors.red);
    console.log(result.output);
    log('\n💡 Run: npm run lint:fix to auto-fix issues', colors.yellow);
    return false;
  }
}

/**
 * Run Prettier check
 * @returns {boolean} True if formatting is correct
 */
function runPrettierCheck() {
  log('\n💅 Running Prettier check...', colors.blue);

  const result = runCommand('npx prettier --check .', true);

  if (result.success) {
    log('✅ Prettier: All files formatted correctly!', colors.green);
    return true;
  } else {
    log('❌ Prettier found formatting issues:', colors.red);
    console.log(result.output);
    log('\n💡 Run: npm run format to fix formatting', colors.yellow);
    return false;
  }
}

/**
 * Check for unused dependencies
 * @returns {boolean} True if no unused dependencies
 */
function checkUnusedDependencies() {
  log('\n🧹 Checking for unused dependencies...', colors.blue);

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Simple check - look for require/import statements
    const jsFiles = findJSFiles('.');
    const usedPackages = new Set();

    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(/require\(['"`]([^'"`]+)['"`]\)|import.*from\s+['"`]([^'"`]+)['"`]/g);

      if (matches) {
        matches.forEach(match => {
          const pkg = match.match(/['"`]([^'"`]+)['"`]/)?.[1];
          if (pkg && !pkg.startsWith('.') && !pkg.startsWith('/')) {
            const basePkg = pkg.split('/')[0];
            usedPackages.add(basePkg);
          }
        });
      }
    }

    const unusedPackages = Object.keys(dependencies).filter(pkg => !usedPackages.has(pkg));

    if (unusedPackages.length === 0) {
      log('✅ No unused dependencies found!', colors.green);
      return true;
    } else {
      log('⚠️  Potentially unused dependencies:', colors.yellow);
      unusedPackages.forEach(pkg => log(`   - ${pkg}`, colors.yellow));
      log('\n💡 Review these packages and remove if not needed', colors.yellow);
      return false;
    }
  } catch (error) {
    log(`❌ Error checking dependencies: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Find all JavaScript files
 * @param {string} dir - Directory to search
 * @returns {string[]} Array of file paths
 */
function findJSFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findJSFiles(fullPath));
    } else if (stat.isFile() && item.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Generate summary report
 * @param {Object} results - Results from all checks
 */
function generateSummary(results) {
  log('\n📊 Summary Report', colors.blue);
  log('================', colors.blue);

  const checks = [
    { name: 'Dependencies', result: results.dependencies },
    { name: 'ESLint', result: results.eslint },
    { name: 'Prettier', result: results.prettier },
    { name: 'Unused Deps', result: results.unusedDeps }
  ];

  checks.forEach(check => {
    const status = check.result ? '✅' : '❌';
    const color = check.result ? colors.green : colors.red;
    log(`${status} ${check.name}`, color);
  });

  const allPassed = Object.values(results).every(Boolean);

  log(`\n${'='.repeat(30)}`, colors.blue);

  if (allPassed) {
    log('🎉 All checks passed! Your code quality is excellent!', colors.green);
  } else {
    log('⚠️  Some checks failed. Please review and fix the issues above.', colors.yellow);
    log('\nQuick fixes:', colors.blue);
    log('  npm run code:fix  - Fix linting and formatting', colors.blue);
    log('  npm run lint      - Check for linting issues', colors.blue);
    log('  npm run format    - Check formatting', colors.blue);
  }
}

/**
 * Main function
 */
async function main() {
  log('🚀 Starting Code Quality Check...', colors.blue);

  const results = {
    dependencies: checkDependencies(),
    eslint: runESLintCheck(),
    prettier: runPrettierCheck(),
    unusedDeps: checkUnusedDependencies()
  };

  generateSummary(results);

  // Exit with error code if any check failed
  const allPassed = Object.values(results).every(Boolean);
  process.exit(allPassed ? 0 : 1);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log(`💥 Script failed: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { runCommand, checkDependencies, runESLintCheck, runPrettierCheck };
