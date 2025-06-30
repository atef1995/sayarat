/**
 * Test Script for Step-Based Validation Routes
 *
 * This script tests that all new step-based validation routes are properly
 * registered and available in the authorization router.
 */

const express = require('express');
const authRouter = require('../routes/authorization');

// Mock knex for testing
const mockKnex = {
  schema: {
    hasTable: () => Promise.resolve(true)
  },
  select: () => ({
    from: () => ({
      where: () => Promise.resolve([])
    })
  })
};

async function testRoutes() {
  console.log('🧪 Testing Step-Based Validation Routes\n');

  try {
    // Create a test app
    const app = express();
    app.use(express.json());

    // Initialize auth router
    const router = authRouter(mockKnex);
    app.use('/api/auth', router);

    // Get all registered routes
    const routes = [];

    function extractRoutes(stack, basePath = '') {
      stack.forEach(layer => {
        if (layer.route) {
          // Route level
          const methods = Object.keys(layer.route.methods);
          methods.forEach(method => {
            routes.push({
              method: method.toUpperCase(),
              path: basePath + layer.route.path
            });
          });
        } else if (layer.name === 'router') {
          // Router level - extract nested routes
          const routerBasePath = layer.regexp.source
            .replace(/^\^\\?/, '')
            .replace(/\$/, '')
            .replace(/\\\//g, '/')
            .replace(/\(\?\:\[\^\\\/\]\+\)\?\$/, '');

          if (layer.handle.stack) {
            extractRoutes(layer.handle.stack, basePath + routerBasePath);
          }
        }
      });
    }

    extractRoutes(app._router.stack);

    console.log('📋 Registered Routes:');
    console.log('=====================');

    // Expected routes
    const expectedRoutes = [
      'POST /api/auth/signup',
      'POST /api/auth/company-signup',
      'POST /api/auth/validate-company-signup',
      'POST /api/auth/validate-company-step',
      'POST /api/auth/validate-admin-step',
      'POST /api/auth/validate-field',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET /api/auth/profile',
      'GET /api/auth/check'
    ];

    // Filter and display auth routes
    const authRoutes = routes.filter(route => route.path.startsWith('/api/auth'));

    authRoutes.forEach(route => {
      const fullRoute = `${route.method} ${route.path}`;
      const isExpected = expectedRoutes.includes(fullRoute);
      const status = isExpected ? '✅' : '⚠️';
      console.log(`${status} ${fullRoute}`);
    });

    console.log('\n📊 Route Analysis:');
    console.log('==================');

    // Check for new step validation routes
    const stepValidationRoutes = [
      'POST /api/auth/validate-company-step',
      'POST /api/auth/validate-admin-step',
      'POST /api/auth/validate-field'
    ];

    stepValidationRoutes.forEach(expectedRoute => {
      const exists = authRoutes.some(route => `${route.method} ${route.path}` === expectedRoute);
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${expectedRoute} - ${exists ? 'Available' : 'Missing'}`);
    });

    console.log('\n🎯 Summary:');
    console.log('===========');
    const newRoutesCount = stepValidationRoutes.filter(expectedRoute =>
      authRoutes.some(route => `${route.method} ${route.path}` === expectedRoute)
    ).length;

    console.log(`✅ ${newRoutesCount}/3 new step validation routes are properly registered`);
    console.log(`📍 Total auth routes: ${authRoutes.length}`);

    if (newRoutesCount === 3) {
      console.log('\n🎉 All step-based validation routes are successfully configured!');
      console.log('\n🚀 Frontend can now use these endpoints:');
      console.log('   - /api/auth/validate-company-step (for step 1 validation)');
      console.log('   - /api/auth/validate-admin-step (for step 2 validation)');
      console.log('   - /api/auth/validate-field (for real-time field validation)');
      console.log('   - /api/auth/validate-company-signup (for full validation)');
    } else {
      console.log('\n❌ Some routes are missing. Please check the authorization.js file.');
    }
  } catch (error) {
    console.error('❌ Error testing routes:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testRoutes().catch(console.error);
