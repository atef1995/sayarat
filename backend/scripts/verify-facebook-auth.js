require('@dotenvx/dotenvx').config();
const knex = require('../config/database');

/**
 * Verification script for Facebook authentication setup
 * Checks database schema, services, and configuration
 */
async function verifyFacebookAuth() {
  console.log('🔍 Verifying Facebook Authentication Setup...\n');

  const checks = {
    database: false,
    fields: false,
    indexes: false,
    services: false,
    routes: false,
    environment: false
  };

  try {
    // 1. Database Connection
    console.log('1️⃣ Checking database connection...');
    await knex.raw('SELECT 1');
    checks.database = true;
    console.log('✅ Database connection successful\n');

    // 2. Facebook Fields
    console.log('2️⃣ Checking Facebook fields in sellers table...');
    const columns = await knex('information_schema.columns')
      .select('column_name')
      .where('table_name', 'sellers')
      .where('column_name', 'like', 'facebook%');

    const expectedFields = [
      'facebook_id',
      'facebook_picture_url',
      'facebook_profile_data',
      'facebook_linked_at'
    ];

    const foundFields = columns.map(col => col.column_name);
    const missingFields = expectedFields.filter(field => !foundFields.includes(field));

    if (missingFields.length === 0) {
      checks.fields = true;
      console.log('✅ All Facebook fields present:', foundFields.join(', '));
    } else {
      console.log('❌ Missing Facebook fields:', missingFields.join(', '));
    }

    // Check auth_provider field
    const authProviderExists = await knex.schema.hasColumn('sellers', 'auth_provider');
    if (authProviderExists) {
      console.log('✅ auth_provider field exists');
    } else {
      console.log('❌ auth_provider field missing');
    }
    console.log('');

    // 3. Database Indexes
    console.log('3️⃣ Checking database indexes...');
    try {
      const indexes = await knex.raw(`
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE tablename = 'sellers' 
        AND (indexname LIKE '%facebook%' OR indexname LIKE '%auth_provider%')
      `);

      if (indexes.rows.length > 0) {
        checks.indexes = true;
        console.log('✅ Facebook indexes found:', indexes.rows.map(idx => idx.indexname).join(', '));
      } else {
        console.log('⚠️ No Facebook-specific indexes found (this is optional)');
      }
    } catch (indexError) {
      console.log('⚠️ Could not check indexes:', indexError.message);
    }
    console.log('');

    // 4. Service Files
    console.log('4️⃣ Checking service files...');
    const fs = require('fs');
    const path = require('path');

    const serviceFiles = [
      '../service/authentication/facebookAuthService.js',
      '../routes/facebookAuthRoutes.js'
    ];

    let allServicesExist = true;
    for (const filePath of serviceFiles) {
      const fullPath = path.join(__dirname, filePath);
      if (fs.existsSync(fullPath)) {
        console.log('✅', path.basename(filePath), 'exists');
      } else {
        console.log('❌', path.basename(filePath), 'missing');
        allServicesExist = false;
      }
    }
    checks.services = allServicesExist;
    console.log('');

    // 5. Route Integration
    console.log('5️⃣ Checking route integration...');
    try {
      const authRouterPath = path.join(__dirname, '../routes/authorization.js');
      const authRouterContent = fs.readFileSync(authRouterPath, 'utf8');

      if (authRouterContent.includes('FacebookAuthRoutes')) {
        checks.routes = true;
        console.log('✅ Facebook routes integrated in authorization.js');
      } else {
        console.log('❌ Facebook routes not found in authorization.js');
      }
    } catch (routeError) {
      console.log('❌ Could not check route integration:', routeError.message);
    }
    console.log('');

    // 6. Environment Variables
    console.log('6️⃣ Checking environment configuration...');
    const envVars = [
      'FACEBOOK_APP_ID',
      'FACEBOOK_APP_SECRET',
      'FACEBOOK_CALLBACK_URL'
    ];

    let envComplete = true;
    for (const envVar of envVars) {
      if (process.env[envVar]) {
        if (envVar === 'FACEBOOK_APP_SECRET') {
          console.log('✅', envVar, '= [HIDDEN]');
        } else {
          console.log('✅', envVar, '=', process.env[envVar]);
        }
      } else {
        console.log('❌', envVar, 'not set');
        envComplete = false;
      }
    }
    checks.environment = envComplete;
    console.log('');

    // Summary
    console.log('📊 VERIFICATION SUMMARY');
    console.log('========================');

    const checkResults = [
      { name: 'Database Connection', status: checks.database },
      { name: 'Facebook Fields', status: checks.fields },
      { name: 'Database Indexes', status: checks.indexes },
      { name: 'Service Files', status: checks.services },
      { name: 'Route Integration', status: checks.routes },
      { name: 'Environment Variables', status: checks.environment }
    ];

    checkResults.forEach(check => {
      const icon = check.status ? '✅' : '❌';
      console.log(`${icon} ${check.name}`);
    });

    const passedChecks = checkResults.filter(check => check.status).length;
    const totalChecks = checkResults.length;

    console.log(`\n🎯 Overall Status: ${passedChecks}/${totalChecks} checks passed`);

    if (passedChecks === totalChecks) {
      console.log('🎉 Facebook authentication is fully configured and ready to use!');
    } else {
      console.log('⚠️ Some configuration items need attention. See details above.');
    }

    // Next Steps
    console.log('\n📋 NEXT STEPS:');
    if (!checks.environment) {
      console.log('1. Add Facebook app credentials to your .env file');
      console.log('2. Configure Facebook app OAuth settings');
    }
    if (passedChecks === totalChecks) {
      console.log('1. Test the Facebook authentication flow');
      console.log('2. Add Facebook login buttons to your frontend');
      console.log('3. Configure Facebook app for production use');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await knex.destroy();
  }
}

// Run verification if called directly
if (require.main === module) {
  verifyFacebookAuth()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Verification script failed:', error.message);
      process.exit(1);
    });
}

module.exports = verifyFacebookAuth;
