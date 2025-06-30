#!/usr/bin/env node
/**
 * Pre-commit Hook Setup
 *
 * This script sets up a Git pre-commit hook that runs code quality checks
 * before allowing commits to proceed.
 */

const fs = require('fs');
const path = require('path');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

const preCommitHookContent = `#!/bin/sh
#
# Pre-commit hook for code quality checks
# This hook runs ESLint and Prettier checks before allowing commits
#

echo "🔍 Running pre-commit code quality checks..."

# Run the code quality check script
npm run code:quality

# Check the exit code
if [ $? -ne 0 ]; then
    echo "❌ Pre-commit checks failed. Please fix the issues and try again."
    echo "💡 Run 'npm run code:fix' to auto-fix most issues"
    exit 1
fi

echo "✅ Pre-commit checks passed!"
exit 0
`;

function setupPreCommitHook() {
  try {
    // Check if we're in a git repository
    const gitDir = path.join(process.cwd(), '.git');
    if (!fs.existsSync(gitDir)) {
      log('❌ Not a git repository. Initialize git first with: git init', colors.red);
      return false;
    }

    // Create hooks directory if it doesn't exist
    const hooksDir = path.join(gitDir, 'hooks');
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
      log('📁 Created .git/hooks directory', colors.blue);
    }

    // Write the pre-commit hook
    const hookPath = path.join(hooksDir, 'pre-commit');
    fs.writeFileSync(hookPath, preCommitHookContent);

    // Make the hook executable (Unix systems)
    if (process.platform !== 'win32') {
      fs.chmodSync(hookPath, '755');
    }

    log('✅ Pre-commit hook installed successfully!', colors.green);
    log('🔧 The hook will run code quality checks before each commit', colors.blue);

    return true;
  } catch (error) {
    log(`❌ Failed to setup pre-commit hook: ${error.message}`, colors.red);
    return false;
  }
}

function removePreCommitHook() {
  try {
    const hookPath = path.join(process.cwd(), '.git', 'hooks', 'pre-commit');

    if (fs.existsSync(hookPath)) {
      fs.unlinkSync(hookPath);
      log('✅ Pre-commit hook removed successfully!', colors.green);
      return true;
    } else {
      log('ℹ️  No pre-commit hook found to remove', colors.yellow);
      return true;
    }
  } catch (error) {
    log(`❌ Failed to remove pre-commit hook: ${error.message}`, colors.red);
    return false;
  }
}

function main() {
  const command = process.argv[2];

  switch (command) {
    case 'install':
    case 'setup':
      setupPreCommitHook();
      break;
    case 'remove':
    case 'uninstall':
      removePreCommitHook();
      break;
    case 'help':
    case '--help':
    case '-h':
      log('📋 Pre-commit Hook Setup Commands:', colors.blue);
      log('  install   - Install the pre-commit hook', colors.green);
      log('  remove    - Remove the pre-commit hook', colors.red);
      log('  help      - Show this help message', colors.yellow);
      break;
    default:
      log('🤔 Installing pre-commit hook by default...', colors.blue);
      setupPreCommitHook();
      log('\nℹ️  Use "node scripts/setup-pre-commit.js help" for more options', colors.yellow);
  }
}

if (require.main === module) {
  main();
}

module.exports = { setupPreCommitHook, removePreCommitHook };
