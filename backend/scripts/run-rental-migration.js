const path = require('path');
const fs = require('fs');

const knexConfig = require('../knexFile.js');
const knex = require('knex')(knexConfig.development);

async function runRentalMigration() {
  try {
    console.log('🚀 Starting rental support migration...');
    
    // Check if columns already exist
    const hasListingType = await knex.schema.hasColumn('listed_cars', 'listing_type');
    const hasIsRental = await knex.schema.hasColumn('listed_cars', 'is_rental');
    const hasRentalDetails = await knex.schema.hasColumn('listed_cars', 'rental_details');
    
    if (hasListingType && hasIsRental && hasRentalDetails) {
      console.log('✅ Rental columns already exist! Migration not needed.');
      return;
    }
    
    console.log('📝 Adding rental support columns to listed_cars table...');
    
    await knex.schema.alterTable('listed_cars', function(table) {
      if (!hasListingType) {
        table.string('listing_type').defaultTo('sale');
        console.log('✅ Added listing_type column');
      }
      
      if (!hasIsRental) {
        table.boolean('is_rental').defaultTo(false);
        console.log('✅ Added is_rental column');
      }
      
      if (!hasRentalDetails) {
        table.jsonb('rental_details').nullable();
        console.log('✅ Added rental_details column');
      }
    });
    
    // Add indexes for better performance
    await knex.schema.alterTable('listed_cars', function(table) {
      try {
        table.index('listing_type');
        table.index('is_rental');
        console.log('✅ Added indexes for rental columns');
      } catch (error) {
        console.log('⚠️  Indexes might already exist, skipping...');
      }
    });
    
    console.log('🎉 Rental support migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await knex.destroy();
  }
}

// Run the migration
runRentalMigration()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });