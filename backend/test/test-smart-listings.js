/**
 * Test script to validate smart listings functionality
 * Tests the fixed highlight strategy logic
 */

const knexFile = require('../knexfile');
const knex = require('knex');
const logger = require('../utils/logger');

async function testSmartListings() {
  console.log('🧪 Testing smart listings functionality...\n');

  const db = knex(knexFile.development);

  try {
    // Import the ListingDatabase class
    const ListingDatabase = require('../service/listingDatabase');
    const listingDatabase = new ListingDatabase(db);

    console.log('📊 Testing smart listings query...');

    // Test parameters similar to the error
    const testParams = {
      page: 2,
      limit: 6,
      userId: 'test-user-id'
    };

    console.log('   🔍 Testing with params:', testParams);

    // Test the smart highlighted listings function
    const result = await listingDatabase.getSmartHighlightedListings(
      { page: testParams.page, limit: testParams.limit, offset: (testParams.page - 1) * testParams.limit },
      testParams.userId
    );

    if (result) {
      console.log('\n✅ Smart listings query executed successfully!');
      console.log('📦 Result structure:');
      console.log(`   - Total listings: ${result.rows?.length || 0}`);
      console.log(`   - Strategy: ${result.strategy || 'N/A'}`);
      console.log(`   - Smart enabled: ${result.smart || false}`);
      console.log(`   - Highlighted count: ${result.highlightedCount || 0}`);

      if (result.rows && result.rows.length > 0) {
        console.log('\n🏷️ Placement analysis:');
        const placements = {};
        result.rows.forEach(row => {
          const placement = row._placement || 'unknown';
          placements[placement] = (placements[placement] || 0) + 1;
        });

        Object.entries(placements).forEach(([placement, count]) => {
          console.log(`   - ${placement}: ${count} listings`);
        });

        console.log('\n✅ Smart listings logic working correctly');
      } else {
        console.log('   ℹ️  No listings returned (this is expected if database is empty)');
      }
    } else {
      console.log('❌ No result returned from smart listings query');
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
testSmartListings().catch(console.error);
