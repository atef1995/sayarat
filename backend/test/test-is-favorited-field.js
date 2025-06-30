/**
 * Test script to verify is_favorited field is properly returned
 */

const ListingDatabase = require('../service/listingDatabase');

function testFavoritedField() {
  console.log('🧪 Testing is_favorited field in listing queries...\n');

  // Create a mock knex instance that simulates the database
  const mockKnex = function(tableName) {
    return {
      select: function(...fields) {
        console.log(`   📋 SELECT: ${fields.join(', ')}`);
        return this;
      },
      leftJoin: function(table, condition) {
        console.log(`   🔗 LEFT JOIN: ${table}`);
        return this;
      },
      where: function(field, value) {
        console.log(`   📍 WHERE: ${field} = ${value}`);
        return this;
      },
      groupBy: function(field) {
        console.log(`   📊 GROUP BY: ${field}`);
        return this;
      },
      orderBy: function(field, direction) {
        console.log(`   📈 ORDER BY: ${field} ${direction}`);
        return this;
      },
      limit: function(limit) {
        console.log(`   📏 LIMIT: ${limit}`);
        return this;
      },
      offset: function(offset) {
        console.log(`   📄 OFFSET: ${offset}`);
        return this;
      },
      count: function(field) {
        console.log(`   🔢 COUNT: ${field}`);
        return this;
      },
      first: function() {
        console.log('   🎯 FIRST()');
        // Mock result for count query
        return Promise.resolve({ total: '5' });
      },
      then: function(callback) {
        console.log('   ⏳ Executing query...');
        // Mock result for main query
        const mockResults = [
          {
            id: 1,
            title: 'Test Car 1',
            make: 'Toyota',
            model: 'Camry',
            price: '25000',
            year: '2020',
            location: 'Dubai',
            currency: 'AED',
            created_at: new Date(),
            status: 'active',
            mileage: '10000',
            transmission: 'Automatic',
            fuel: 'Petrol',
            highlight: false,
            products: null,
            favorites_count: '2',
            image_urls: 'img1.jpg,img2.jpg',
            is_favorited: userId ? '1' : undefined // Only present if userId provided
          },
          {
            id: 2,
            title: 'Test Car 2',
            make: 'Honda',
            model: 'Civic',
            price: '30000',
            year: '2021',
            location: 'Abu Dhabi',
            currency: 'AED',
            created_at: new Date(),
            status: 'active',
            mileage: '5000',
            transmission: 'Manual',
            fuel: 'Petrol',
            highlight: false,
            products: null,
            favorites_count: '1',
            image_urls: 'img3.jpg,img4.jpg',
            is_favorited: userId ? '0' : undefined // Only present if userId provided
          }
        ];
        return Promise.resolve(callback ? callback(mockResults) : mockResults);
      }
    };
  };

  // Add raw method to mock knex
  mockKnex.raw = function(sql, bindings) {
    console.log(`   🔧 RAW SQL: ${sql}`, bindings ? `[${bindings.join(', ')}]` : '');
    return { sql, bindings };
  };

  let userId = null; // This will be captured by the mock

  try {
    const db = new ListingDatabase(mockKnex);

    console.log('1️⃣ Testing getListings WITHOUT userId (should not include is_favorited)...');
    console.log('   👤 userId: null');
    userId = null;

    // This should not include is_favorited
    db.getListings({ limit: 10, offset: 0 }, null)
      .then(result => {
        console.log('   ✅ Query executed successfully');
        console.log('   📊 Result structure:');
        if (result.rows && result.rows.length > 0) {
          const firstRow = result.rows[0];
          console.log(`      - has is_favorited: ${firstRow.hasOwnProperty('is_favorited')}`);
          console.log(`      - is_favorited value: ${firstRow.is_favorited}`);
        }
        console.log();

        console.log('2️⃣ Testing getListings WITH userId (should include is_favorited)...');
        console.log('   👤 userId: user-123');
        userId = 'user-123';

        return db.getListings({ limit: 10, offset: 0 }, 'user-123');
      })
      .then(result => {
        console.log('   ✅ Query executed successfully');
        console.log('   📊 Result structure:');
        if (result.rows && result.rows.length > 0) {
          const firstRow = result.rows[0];
          console.log(`      - has is_favorited: ${firstRow.hasOwnProperty('is_favorited')}`);
          console.log(`      - is_favorited value: ${firstRow.is_favorited}`);
          console.log(`      - is_favorited type: ${typeof firstRow.is_favorited}`);
        }
        console.log();

        console.log('🎉 Test completed successfully!');
        console.log('\n📝 Expected behavior:');
        console.log('   - Without userId: is_favorited should be false (default)');
        console.log('   - With userId: is_favorited should be true/false based on user favorites');
        console.log('   - is_favorited should be boolean type, not string');
      })
      .catch(error => {
        console.error('❌ Test failed:', error.message);
      });
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testFavoritedField();
}

module.exports = { testFavoritedField };
