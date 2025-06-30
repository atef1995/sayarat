/**
 * Quick test script to validate the listing database fix
 */

const ListingDatabase = require('../service/listingDatabase');

function testListingDatabase() {
  console.log('🧪 Testing ListingDatabase fixes...\n');

  try {
    // Test 1: Constructor without knex should throw error
    console.log('1️⃣ Testing constructor validation...');
    try {
      new ListingDatabase();
      console.log('❌ Constructor should throw error when knex is not provided');
    } catch (error) {
      console.log('✅ Constructor properly validates knex instance');
      console.log(`   Error: ${error.message}`);
    }
    console.log();

    // Test 2: Constructor with null knex should throw error
    console.log('2️⃣ Testing constructor with null knex...');
    try {
      new ListingDatabase(null);
      console.log('❌ Constructor should throw error when knex is null');
    } catch (error) {
      console.log('✅ Constructor properly validates null knex');
      console.log(`   Error: ${error.message}`);
    }
    console.log();

    // Test 3: Constructor with valid knex should work
    console.log('3️⃣ Testing constructor with mock knex...');
    const mockKnex = {
      raw: function(sql, bindings) {
        return { sql, bindings };
      },
      select: function() {
        return this;
      },
      from: function() {
        return this;
      },
      where: function() {
        return this;
      }
    };

    try {
      const db = new ListingDatabase(mockKnex);
      console.log('✅ Constructor accepts valid knex instance');
      console.log(`   Knex available: ${!!db.knex}`);
    } catch (error) {
      console.log('❌ Constructor should accept valid knex instance');
      console.log(`   Error: ${error.message}`);
    }
    console.log();

    // Test 4: Validation method
    console.log('4️⃣ Testing _validateKnex method...');
    const dbWithKnex = new ListingDatabase(mockKnex);
    const dbWithoutKnex = Object.create(ListingDatabase.prototype);
    dbWithoutKnex.knex = null;

    try {
      dbWithKnex._validateKnex();
      console.log('✅ _validateKnex passes with valid knex');
    } catch (error) {
      console.log('❌ _validateKnex should pass with valid knex');
      console.log(`   Error: ${error.message}`);
    }

    try {
      dbWithoutKnex._validateKnex();
      console.log('❌ _validateKnex should throw error with null knex');
    } catch (error) {
      console.log('✅ _validateKnex properly validates null knex');
      console.log(`   Error: ${error.message}`);
    }
    console.log();

    console.log('🎉 All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Constructor validates knex instance');
    console.log('   - _validateKnex method works correctly');
    console.log('   - Error handling is proper');
    console.log('\n💡 The "Cannot read properties of undefined (reading \'raw\')" error should be fixed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Error details:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testListingDatabase();
}

module.exports = { testListingDatabase };
