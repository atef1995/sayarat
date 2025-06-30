/**
 * Test script to validate subscription badge query functionality
 * Tests the updated getListingById query with company subscription fields
 */

const knexFile = require('../knexfile');
const knex = require('knex');
const logger = require('../utils/logger');

async function testSubscriptionBadgeQuery() {
  console.log('🧪 Testing subscription badge query functionality...\n');

  // Use the knex configuration from knexfile.js
  const db = knex(knexFile.development);

  try {
    console.log('📊 Testing updated getListingById query...');

    // Import the updated function
    const { getListingById } = require('../dbQueries/listed_cars');

    // First, let's find a listing ID to test with
    const sampleListing = await db('listed_cars').select('id').first();

    if (!sampleListing) {
      console.log('❌ No listings found in database. Please create a listing first.');
      return;
    }

    const listingId = sampleListing.id;
    console.log(`   🔍 Testing with listing ID: ${listingId}`);

    // Test the query
    const result = await getListingById(db, listingId);

    if (result) {
      console.log('\n✅ Query executed successfully!');
      console.log('📦 Result structure:');
      console.log(`   - ID: ${result.id}`);
      console.log(`   - Title: ${result.title}`);
      console.log(`   - Seller: ${result.first_name} (${result.username})`);
      console.log(`   - Phone: ${result.phone || 'N/A'}`);
      console.log(`   - Is Company: ${result.is_company || false}`);
      console.log(`   - Company Name: ${result.company_name || 'N/A'}`);
      console.log(`   - Company Logo: ${result.company_logo || 'N/A'}`);
      console.log(`   - Subscription Status: ${result.subscription_status || 'N/A'}`);
      console.log(`   - Subscription Plan: ${result.subscription_plan || 'N/A'}`);
      console.log(`   - Is Verified: ${result.is_verified || false}`);
      console.log(`   - Image URLs: ${result.image_urls ? result.image_urls.length : 0} images`);

      // Test subscription badge logic
      console.log('\n🏷️ Testing subscription badge logic:');

      const hasActiveSubscription = result.subscription_status === 'active';
      const isPremiumPlan = result.subscription_plan === 'premium' || result.subscription_plan === 'enterprise';
      const shouldShowBadge = result.is_company && (hasActiveSubscription || result.is_verified);

      console.log(`   - Has Active Subscription: ${hasActiveSubscription}`);
      console.log(`   - Is Premium Plan: ${isPremiumPlan}`);
      console.log(`   - Should Show Badge: ${shouldShowBadge}`);

      if (shouldShowBadge) {
        const badgeType = hasActiveSubscription && isPremiumPlan ? 'premium' : 'company';
        console.log(`   - Badge Type: ${badgeType}`);
        console.log('   ✅ Badge should be displayed');
      } else {
        console.log('   ℹ️  No badge should be displayed');
      }
    } else {
      console.log('❌ No result returned from query');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    await db.destroy();
    console.log('\n🏁 Test completed');
  }
}

// Run the test
testSubscriptionBadgeQuery().catch(console.error);
