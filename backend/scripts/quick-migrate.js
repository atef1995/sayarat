#!/usr/bin/env node
/**
 * Quick Migration Command
 *
 * A simple one-command migration runner for the unified subscription system
 * that automatically detects environment and handles dotenvx integration.
 *
 * Usage: node quick-migrate.js [action]
 *
 * This script automatically:
 * - Detects the current environment
 * - Loads appropriate .env file
 * - Runs the migration with proper error handling
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Detect environment based on available .env files and NODE_ENV
 */
function detectEnvironment() {
  const nodeEnv = process.env.NODE_ENV;

  // Check for environment-specific files
  const envFiles = ['.env.local', '.env.development', '.env.staging', '.env.production'];

  // Prefer NODE_ENV if set and file exists
  if (nodeEnv) {
    const envFile = `.env.${nodeEnv}`;
    if (fs.existsSync(path.join(__dirname, '..', envFile))) {
      return nodeEnv;
    }
  }

  // Fall back to first available env file
  for (const envFile of envFiles) {
    if (fs.existsSync(path.join(__dirname, '..', envFile))) {
      return envFile.replace('.env.', '');
    }
  }

  return 'development';
}

/**
 * Run migration command
 */
async function runQuickMigration() {
  const action = process.argv[2] || 'migrate';
  const environment = detectEnvironment();

  console.log('🚀 Quick Migration Runner');
  console.log(`🔧 Auto-detected environment: ${environment}`);
  console.log(`⚡ Action: ${action}`);
  console.log(''.padEnd(40, '='));
  // Build dotenvx command
  const args = ['dotenvx', 'run', '-f'];

  // Add environment file
  args.push(`.env.${environment}`);

  args.push('--', 'node', 'scripts/run-migration.js', action);

  // Add any additional flags
  if (process.argv.includes('--force')) {
    args.push('--force');
  }

  // Run the command
  const child = spawn('npx', args, {
    stdio: 'inherit',
    shell: true,
    cwd: path.dirname(__dirname)
  });

  return new Promise((resolve, reject) => {
    child.on('close', code => {
      if (code === 0) {
        console.log('');
        console.log('✅ Quick migration completed!');

        // Show next steps based on action
        if (action === 'migrate') {
          console.log('💡 Next steps:');
          console.log('   1. Test your application');
          console.log('   2. Verify subscription endpoints');
          console.log('   3. Check frontend integration');
        }

        resolve(code);
      } else {
        reject(new Error(`Migration failed with exit code ${code}`));
      }
    });

    child.on('error', error => {
      reject(error);
    });
  });
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🎯 Quick Migration Runner');
  console.log('');
  console.log('Usage: node quick-migrate.js [action] [--force]');
  console.log('');
  console.log('Actions:');
  console.log('  migrate  - Apply migration (default)');
  console.log('  status   - Check migration status');
  console.log('  verify   - Verify migration integrity');
  console.log('  rollback - Rollback migration');
  console.log('');
  console.log('Examples:');
  console.log('  node quick-migrate.js');
  console.log('  node quick-migrate.js status');
  console.log('  node quick-migrate.js migrate --force');
  console.log('');
  console.log('Environment is auto-detected from:');
  console.log('  1. NODE_ENV variable');
  console.log('  2. Available .env files');
  process.exit(0);
}

// Run migration
if (require.main === module) {
  runQuickMigration().catch(error => {
    console.error('❌ Quick migration failed:', error.message);
    process.exit(1);
  });
}
