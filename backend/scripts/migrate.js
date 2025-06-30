#!/usr/bin/env node
/**
 * Environment-aware migration runner for dotenvx
 *
 * This script provides a convenient wrapper for running migrations
 * with proper environment variable loading using dotenvx.
 *
 * Usage:
 *   node scripts/migrate.js [environment] [action]
 *
 * Examples:
 *   node scripts/migrate.js development migrate
 *   node scripts/migrate.js production verify
 *   node scripts/migrate.js local rollback
 */

const { spawn } = require('child_process');
const path = require('path');

/**
 * Available migration actions
 */
const ACTIONS = {
  migrate: 'Apply migrations',
  rollback: 'Rollback last migration batch',
  status: 'Check migration status',
  verify: 'Verify migration integrity',
  force: 'Force apply migrations (use with caution)'
};

/**
 * Available environments
 */
const ENVIRONMENTS = {
  development: '.env.development',
  production: '.env.production',
  staging: '.env.staging',
  local: '.env.local',
  test: '.env.test'
};

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);

  let environment = 'development';
  let action = 'migrate';
  let force = false;

  // Parse environment (first argument)
  if (args[0] && ENVIRONMENTS[args[0]]) {
    environment = args[0];
    args.shift();
  }

  // Parse action (next argument)
  if (args[0] && ACTIONS[args[0]]) {
    action = args[0];
    args.shift();
  }

  // Check for force flag
  if (args.includes('--force')) {
    force = true;
  }

  return { environment, action, force };
}

/**
 * Display usage information
 */
function showUsage() {
  console.log('🎯 Environment-aware Migration Runner for dotenvx');
  console.log('');
  console.log('Usage: node scripts/migrate.js [environment] [action] [--force]');
  console.log('');
  console.log('Environments:');
  Object.entries(ENVIRONMENTS).forEach(([env, file]) => {
    console.log(`  ${env.padEnd(12)} - Uses ${file}`);
  });
  console.log('');
  console.log('Actions:');
  Object.entries(ACTIONS).forEach(([action, desc]) => {
    console.log(`  ${action.padEnd(12)} - ${desc}`);
  });
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/migrate.js development migrate');
  console.log('  node scripts/migrate.js production verify');
  console.log('  node scripts/migrate.js local status');
  console.log('  node scripts/migrate.js staging rollback');
  console.log('  node scripts/migrate.js development migrate --force');
  console.log('');
}

/**
 * Run migration with dotenvx
 */
async function runMigration(environment, action, force) {
  const envFile = ENVIRONMENTS[environment];

  console.log('🚀 Running migration with dotenvx...');
  console.log(`📁 Environment: ${environment} (${envFile})`);
  console.log(`⚡ Action: ${action}`);
  if (force) {
    console.log('⚠️ Force mode enabled');
  }
  console.log(''.padEnd(50, '='));
  // Prepare command arguments
  const args = ['dotenvx', 'run', '-f'];

  // Add environment file
  args.push(envFile);

  args.push('--');
  args.push('node', path.join(__dirname, 'run-migration.js'));
  args.push(action);

  if (force) {
    args.push('--force');
  }

  // Spawn dotenvx process
  const child = spawn('npx', args, {
    stdio: 'inherit',
    shell: true,
    cwd: path.dirname(__dirname)
  });

  return new Promise((resolve, reject) => {
    child.on('close', code => {
      if (code === 0) {
        console.log('');
        console.log('✅ Migration completed successfully!');
        resolve(code);
      } else {
        console.log('');
        console.log(`❌ Migration failed with exit code ${code}`);
        reject(new Error(`Migration failed with exit code ${code}`));
      }
    });

    child.on('error', error => {
      console.error('❌ Error spawning migration process:', error.message);
      reject(error);
    });
  });
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Check for help flag
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      showUsage();
      return;
    }

    const { environment, action, force } = parseArguments();

    // Validate environment
    if (!ENVIRONMENTS[environment]) {
      console.error(`❌ Unknown environment: ${environment}`);
      console.log('Available environments:', Object.keys(ENVIRONMENTS).join(', '));
      process.exit(1);
    }

    // Validate action
    if (!ACTIONS[action]) {
      console.error(`❌ Unknown action: ${action}`);
      console.log('Available actions:', Object.keys(ACTIONS).join(', '));
      process.exit(1);
    }

    // Run migration
    await runMigration(environment, action, force);
  } catch (error) {
    console.error('❌ Migration runner error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runMigration,
  parseArguments,
  ACTIONS,
  ENVIRONMENTS
};
