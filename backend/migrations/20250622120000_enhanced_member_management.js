/**
 * Migration: Enhanced Member Management Schema
 *
 * Adds proper member status tracking, audit trail, and listing management
 * for company member management system.
 */

exports.up = function(knex) {
  return knex.schema
    .hasColumn('sellers', 'member_status')
    .then(exists => {
      if (!exists) {
        return knex.schema.alterTable('sellers', table => {
          // Add member status and tracking fields
          table.string('member_status').defaultTo('active').checkIn(['active', 'pending', 'removed', 'suspended']);
          table.timestamp('removal_date').nullable();
          table.text('removal_reason').nullable();
          table.uuid('removed_by').nullable();
          table.uuid('reactivated_by').nullable();
          table.timestamp('reactivated_at').nullable();

          // Add foreign key constraints
          table.foreign('removed_by').references('id').inTable('sellers');
          table.foreign('reactivated_by').references('id').inTable('sellers');

          // Add indexes for better performance
          table.index('member_status');
          table.index(['company_id', 'member_status']);
          table.index('removal_date');
        });
      }
    })
    .then(() => {
      // Update existing data - set default member_status for existing records
      return knex('sellers').whereNotNull('company_id').whereNull('member_status').update({ member_status: 'active' });
    })
    .then(() => {
      // Ensure all listing status values are valid before adding constraint
      console.log('Verifying listing status values...');
      return knex.raw(`
        SELECT COUNT(*) as invalid_count
        FROM listed_cars 
        WHERE status NOT IN ('active', 'sold', 'removed', 'expired', 'suspended');
      `);
    })
    .then(result => {
      const invalidCount = parseInt(result.rows[0].invalid_count);
      if (invalidCount > 0) {
        console.log(`Found ${invalidCount} listings with invalid status. Updating to 'active'...`);
        return knex.raw(`
          UPDATE listed_cars 
          SET status = 'active' 
          WHERE status NOT IN ('active', 'sold', 'removed', 'expired', 'suspended');
        `);
      }
      console.log('All listing status values are valid');
    })
    .then(() => {
      // Add new listing status constraint with suspended_member_removed
      console.log('Adding enhanced listing status constraint...');
      return knex.schema.raw(`
        ALTER TABLE listed_cars DROP CONSTRAINT IF EXISTS listed_cars_status_check;
        ALTER TABLE listed_cars ADD CONSTRAINT listed_cars_status_check 
        CHECK (status IN ('active', 'sold', 'removed', 'expired', 'suspended', 'suspended_member_removed'));
      `);
    })
    .then(() => {
      // Create company member audit trail table
      return knex.schema.hasTable('company_member_audit').then(exists => {
        if (!exists) {
          return knex.schema.createTable('company_member_audit', table => {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.uuid('company_id').notNullable();
            table.uuid('member_id').notNullable();
            table
              .string('action')
              .notNullable()
              .checkIn(['added', 'removed', 'reactivated', 'role_changed', 'status_changed']);
            table.uuid('performed_by').notNullable();
            table.text('reason').nullable();
            table.jsonb('metadata').nullable(); // Store additional context
            table.timestamp('created_at').defaultTo(knex.fn.now());

            // Foreign key constraints
            table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE');
            table.foreign('member_id').references('id').inTable('sellers').onDelete('CASCADE');
            table.foreign('performed_by').references('id').inTable('sellers');

            // Indexes for better performance
            table.index(['company_id', 'member_id']);
            table.index(['action', 'created_at']);
          });
        }
      });
    })
    .then(() => {
      // Add additional indexes for listing queries
      return knex.schema.raw(`
        CREATE INDEX IF NOT EXISTS idx_listed_cars_seller_status 
        ON listed_cars(seller_id, status);
      `);
    })
    .then(() => {
      // Create view for active company members
      return knex.schema.raw(`
        CREATE OR REPLACE VIEW active_company_members AS
        SELECT 
          s.*,
          c.name as company_name,
          COUNT(lc.id) as active_listings_count
        FROM sellers s
        LEFT JOIN companies c ON s.company_id = c.id
        LEFT JOIN listed_cars lc ON s.id = lc.seller_id AND lc.status = 'active'
        WHERE s.company_id IS NOT NULL 
        AND s.member_status = 'active'
        GROUP BY s.id, c.name;
      `);
    })
    .then(() => {
      // Create function to get member statistics
      return knex.schema.raw(`
        CREATE OR REPLACE FUNCTION get_member_statistics(company_uuid UUID)
        RETURNS TABLE (
          total_members BIGINT,
          active_members BIGINT,
          pending_members BIGINT,
          removed_members BIGINT,
          total_listings BIGINT,
          active_listings BIGINT,
          suspended_listings BIGINT
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            COUNT(*) as total_members,
            COUNT(*) FILTER (WHERE member_status = 'active') as active_members,
            COUNT(*) FILTER (WHERE member_status = 'pending') as pending_members,
            COUNT(*) FILTER (WHERE member_status = 'removed') as removed_members,
            (SELECT COUNT(*) FROM listed_cars lc 
             JOIN sellers s ON lc.seller_id = s.id 
             WHERE s.company_id = company_uuid) as total_listings,
            (SELECT COUNT(*) FROM listed_cars lc 
             JOIN sellers s ON lc.seller_id = s.id 
             WHERE s.company_id = company_uuid AND lc.status = 'active') as active_listings,
            (SELECT COUNT(*) FROM listed_cars lc 
             JOIN sellers s ON lc.seller_id = s.id 
             WHERE s.company_id = company_uuid AND lc.status LIKE 'suspended%') as suspended_listings
          FROM sellers 
          WHERE company_id = company_uuid;
        END;
        $$ LANGUAGE plpgsql;
      `);
    });
};

exports.down = function(knex) {
  return knex.schema
    .raw('DROP FUNCTION IF EXISTS get_member_statistics(UUID);')
    .then(() => {
      return knex.schema.raw('DROP VIEW IF EXISTS active_company_members;');
    })
    .then(() => {
      return knex.schema.raw('DROP INDEX IF EXISTS idx_listed_cars_seller_status;');
    })
    .then(() => {
      return knex.schema.dropTableIfExists('company_member_audit');
    })
    .then(() => {
      return knex.schema.raw(`
        ALTER TABLE listed_cars DROP CONSTRAINT IF EXISTS listed_cars_status_check;
        ALTER TABLE listed_cars ADD CONSTRAINT listed_cars_status_check 
        CHECK (status IN ('active', 'sold', 'removed', 'expired', 'suspended'));
      `);
    })
    .then(() => {
      return knex.schema.hasColumn('sellers', 'member_status').then(exists => {
        if (exists) {
          return knex.schema.alterTable('sellers', table => {
            table.dropForeign('removed_by');
            table.dropForeign('reactivated_by');
            table.dropIndex(['company_id', 'member_status']);
            table.dropIndex('member_status');
            table.dropIndex('removal_date');
            table.dropColumn('member_status');
            table.dropColumn('removal_date');
            table.dropColumn('removal_reason');
            table.dropColumn('removed_by');
            table.dropColumn('reactivated_by');
            table.dropColumn('reactivated_at');
          });
        }
      });
    });
};
