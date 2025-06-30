// Load database configuration
const knexFile = require('../knexFile');
const knex = require('knex')(knexFile.development);

const ListingDatabase = require('../service/listingDatabase');

async function testHighlightStrategies() {
  console.log('🧪 Testing Highlight Strategies...\n');

  try {
    const listingDb = new ListingDatabase(knex);

    const strategies = ['auto', 'distributed', 'golden-ratio', 'alternating', 'weighted', 'top-bottom', 'mixed'];

    for (const strategy of strategies) {
      console.log(`\n📊 Testing strategy: ${strategy.toUpperCase()}`);
      console.log('='.repeat(50));

      try {
        // Test smart strategy
        if (strategy === 'auto') {
          const result = await listingDb.getSmartHighlightedListings({ limit: 8, offset: 0 }, null, {
            preferredStrategy: 'auto',
            highlightRatio: 0.3
          });

          console.log('✅ Smart Strategy Results:');
          console.log(`   - Applied Strategy: ${result.strategy}`);
          console.log(`   - Total Listings: ${result.total}`);
          console.log(`   - Highlighted Count: ${result.highlightedCount}`);
          console.log(`   - Fetched: ${result.rows.length}`);

          // Show placement pattern
          const pattern = result.rows
            .map((listing, i) => {
              const isHighlighted = listing.highlight || listing.products === 'تمييز الإعلان';
              return `${i + 1}:${isHighlighted ? 'H' : 'R'}`;
            })
            .join(' ');
          console.log(`   - Pattern: ${pattern}`);
        } else {
          // Test specific strategy
          const result = await listingDb.getListingsWithHighlightStrategy({ limit: 8, offset: 0 }, null, {
            highlightRatio: 0.3,
            highlightPositions: strategy,
            maxHighlightedPerPage: 3
          });

          console.log('✅ Strategy Results:');
          console.log(`   - Total Listings: ${result.total}`);
          console.log(`   - Highlighted Count: ${result.highlightedCount}`);
          console.log(`   - Fetched: ${result.rows.length}`);

          // Show placement pattern
          const pattern = result.rows
            .map((listing, i) => {
              const isHighlighted = listing.highlight || listing.products === 'تمييز الإعلان';
              const placement = listing._placement?.split('-')[1] || '';
              return `${i + 1}:${isHighlighted ? 'H' : 'R'}${placement ? `(${placement})` : ''}`;
            })
            .join(' ');
          console.log(`   - Pattern: ${pattern}`);

          // Show placement breakdown
          const placements = result.rows.reduce((acc, listing) => {
            const placement = listing._placement || 'unknown';
            acc[placement] = (acc[placement] || 0) + 1;
            return acc;
          }, {});
          console.log(`   - Placements: ${JSON.stringify(placements)}`);
        }
      } catch (error) {
        console.log(`❌ Error testing ${strategy}: ${error.message}`);
      }
    }

    console.log('\n🎯 Testing different page scenarios...');
    console.log('='.repeat(50));

    // Test pagination scenarios
    const paginationTests = [
      { page: 1, offset: 0, label: 'First Page' },
      { page: 2, offset: 8, label: 'Second Page' },
      { page: 5, offset: 32, label: 'Fifth Page' }
    ];

    for (const test of paginationTests) {
      console.log(`\n📄 ${test.label} (offset: ${test.offset})`);

      try {
        const result = await listingDb.getSmartHighlightedListings({ limit: 8, offset: test.offset }, null, {
          preferredStrategy: 'auto'
        });

        const pattern = result.rows
          .map((listing, i) => {
            const isHighlighted = listing.highlight || listing.products === 'تمييز الإعلان';
            return isHighlighted ? 'H' : 'R';
          })
          .join('');

        console.log(`   Strategy: ${result.strategy}, Pattern: ${pattern}`);
        console.log(`   Highlighted: ${result.highlightedCount}/${result.rows.length}`);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Test setup error:', error.message);
  } finally {
    await knex.destroy();
    console.log('\n✅ Tests completed!');
  }
}

// Run the test
testHighlightStrategies().catch(console.error);
