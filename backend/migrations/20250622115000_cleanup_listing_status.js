/**
 * Data Cleanup Migration: Fix Listing Status Values
 *
 * This migration cleans up any invalid status values in listed_cars table
 * before applying the enhanced messaging system constraints.
 */

exports.up = function(knex) {
  return knex
    .raw(
      `
    -- Check current status distribution
    SELECT 'Before cleanup:' as phase, status, COUNT(*) as count 
    FROM listed_cars 
    GROUP BY status 
    ORDER BY status;
  `
    )
    .then(result => {
      console.log('Current status distribution:', result.rows);

      // Update invalid status values
      return knex.raw(`
      -- Update 'pending' status to 'active' (pending listings should be active)
      UPDATE listed_cars 
      SET status = 'active' 
      WHERE status = 'pending';
      
      -- Update any other invalid status values to 'active'
      UPDATE listed_cars 
      SET status = 'active' 
      WHERE status NOT IN ('active', 'sold', 'removed', 'expired', 'suspended');
    `);
    })
    .then(result => {
      console.log('Data cleanup completed');

      // Show final status distribution
      return knex.raw(`
      SELECT 'After cleanup:' as phase, status, COUNT(*) as count 
      FROM listed_cars 
      GROUP BY status 
      ORDER BY status;
    `);
    })
    .then(result => {
      console.log('Final status distribution:', result.rows);

      // Verify no invalid statuses remain
      return knex.raw(`
      SELECT COUNT(*) as invalid_count
      FROM listed_cars 
      WHERE status NOT IN ('active', 'sold', 'removed', 'expired', 'suspended');
    `);
    })
    .then(result => {
      const invalidCount = parseInt(result.rows[0].invalid_count);
      if (invalidCount > 0) {
        throw new Error(`Still have ${invalidCount} listings with invalid status values`);
      }
      console.log('✅ All listing status values are now valid');
    });
};

exports.down = function(knex) {
  // This cleanup is generally not reversible since we don't know
  // what the original invalid values were
  console.log('⚠️  Data cleanup rollback: Cannot restore original invalid status values');
  return Promise.resolve();
};
