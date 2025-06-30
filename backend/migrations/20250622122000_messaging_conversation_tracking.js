/**
 * Migration: Enhanced Messaging System - Conversation Ownership Tracking
 *
 * Creates tables and functions for tracking conversation ownership changes
 * when listings are transferred between company members.
 */

exports.up = function(knex) {
  return knex.schema
    .hasTable('conversation_ownership_log')
    .then(exists => {
      if (!exists) {
        return knex.schema.createTable('conversation_ownership_log', table => {
          table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
          table.uuid('conversation_id').notNullable();
          table.uuid('old_owner_id').nullable();
          table.uuid('new_owner_id').notNullable();
          table.string('owner_type').defaultTo('seller').notNullable().checkIn(['seller', 'company']);
          table.string('change_reason', 100).nullable();
          table.uuid('changed_by').nullable();
          table.timestamp('created_at').defaultTo(knex.fn.now());

          // Foreign key constraints
          table.foreign('conversation_id').references('id').inTable('conversations').onDelete('CASCADE');
          table.foreign('old_owner_id').references('id').inTable('sellers');
          table.foreign('new_owner_id').references('id').inTable('sellers');
          table.foreign('changed_by').references('id').inTable('sellers');

          // Indexes for efficient querying
          table.index('conversation_id');
          table.index('created_at');
        });
      }
    })
    .then(() => {
      // Create company message handlers table
      return knex.schema.hasTable('company_message_handlers').then(exists => {
        if (!exists) {
          return knex.schema.createTable('company_message_handlers', table => {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.uuid('company_id').notNullable();
            table.uuid('member_id').notNullable();
            table.boolean('is_active').defaultTo(true);
            table.boolean('can_handle_transferred_listings').defaultTo(true);
            table.integer('priority_order').defaultTo(1); // For multiple handlers
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());

            // Foreign key constraints
            table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE');
            table.foreign('member_id').references('id').inTable('sellers').onDelete('CASCADE');

            // Ensure one entry per company-member pair
            table.unique(['company_id', 'member_id']);

            // Indexes for efficient querying
            table.index(['company_id', 'is_active']);
            table.index('member_id');
          });
        }
      });
    })
    .then(() => {
      // Create view for listing ownership with active member status
      return knex.schema.raw(`
        CREATE OR REPLACE VIEW listing_message_routing AS
        SELECT 
          lc.id as listing_id,
          lc.current_owner_id,
          lc.current_owner_type,
          lc.original_seller_id,
          lc.company_id,
          lc.title as listing_title,
          
          -- Current owner info
          co.first_name as current_owner_name,
          co.email as current_owner_email,
          
          -- Check if current owner is active (for company members)
          CASE 
            WHEN lc.current_owner_type = 'seller' AND lc.company_id IS NULL THEN true
            WHEN lc.current_owner_type = 'seller' AND lc.company_id IS NOT NULL THEN 
              COALESCE(s.member_status = 'active', false)
            ELSE true
          END as is_current_owner_active,
          
          -- Original seller info
          os.first_name as original_seller_name,
          
          -- Company info
          c.name as company_name
          
        FROM listed_cars lc
        LEFT JOIN sellers co ON lc.current_owner_id = co.id
        LEFT JOIN sellers os ON lc.original_seller_id = os.id
        LEFT JOIN companies c ON lc.company_id = c.id
        LEFT JOIN sellers s ON (lc.company_id IS NOT NULL AND lc.current_owner_id = s.id);
      `);
    })
    .then(() => {
      // Create view for active company message handlers
      return knex.schema.raw(`
        CREATE OR REPLACE VIEW active_company_message_handlers AS
        SELECT 
          cmh.company_id,
          cmh.member_id,
          cmh.priority_order,
          s.first_name as handler_name,
          s.email as handler_email,
          s.role as member_role,
          s.member_status
        FROM company_message_handlers cmh
        JOIN sellers s ON cmh.member_id = s.id
        WHERE cmh.is_active = true 
          AND cmh.can_handle_transferred_listings = true
          AND s.member_status = 'active'
          AND s.company_id = cmh.company_id
        ORDER BY cmh.company_id, cmh.priority_order;
      `);
    })
    .then(() => {
      // Create function to get the appropriate message recipient for a listing
      return knex.schema.raw(`
        CREATE OR REPLACE FUNCTION get_listing_message_recipient(listing_id_param UUID)
        RETURNS TABLE(
          recipient_id UUID,
          recipient_type VARCHAR(20),
          recipient_name VARCHAR(255),
          recipient_email VARCHAR(255),
          is_original_seller BOOLEAN,
          company_name VARCHAR(255)
        ) AS $$
        DECLARE
          listing_info RECORD;
          handler_info RECORD;
        BEGIN
          -- Get listing and current owner info
          SELECT * INTO listing_info
          FROM listing_message_routing 
          WHERE listing_id = listing_id_param;
          
          IF NOT FOUND THEN
            RAISE EXCEPTION 'Listing not found: %', listing_id_param;
          END IF;
          
          -- If current owner is active, route to them
          IF listing_info.is_current_owner_active THEN
            RETURN QUERY SELECT 
              listing_info.current_owner_id,
              listing_info.current_owner_type,
              listing_info.current_owner_name,
              listing_info.current_owner_email,
              (listing_info.current_owner_id = listing_info.original_seller_id),
              listing_info.company_name;
            RETURN;
          END IF;
          
          -- If current owner is inactive and it's a company listing, find a handler
          IF listing_info.company_id IS NOT NULL THEN
            SELECT * INTO handler_info
            FROM active_company_message_handlers 
            WHERE company_id = listing_info.company_id
            ORDER BY priority_order
            LIMIT 1;
            
            IF FOUND THEN
              RETURN QUERY SELECT 
                handler_info.member_id,
                'company'::VARCHAR(20),
                handler_info.handler_name,
                handler_info.handler_email,
                false,
                listing_info.company_name;
              RETURN;
            END IF;
          END IF;
          
          -- No valid recipient found
          RAISE EXCEPTION 'No active recipient found for listing: %', listing_id_param;
        END;
        $$ LANGUAGE plpgsql;
      `);
    })
    .then(() => {
      // Create function to update conversation ownership
      return knex.schema.raw(`
        CREATE OR REPLACE FUNCTION update_conversation_ownership(
          listing_id_param UUID,
          new_owner_id_param UUID,
          change_reason_param VARCHAR(100),
          changed_by_param UUID
        ) RETURNS INTEGER AS $$
        DECLARE
          conv_record RECORD;
          current_seller_id UUID;
          updated_count INTEGER := 0;
        BEGIN
          -- Find all conversations for this listing
          FOR conv_record IN 
            SELECT id FROM conversations WHERE car_listing_id = listing_id_param
          LOOP
            -- Get current seller participant
            SELECT user_id INTO current_seller_id
            FROM conversation_participants 
            WHERE conversation_id = conv_record.id AND role = 'seller';
            
            -- Only update if the seller is different
            IF current_seller_id IS NOT NULL AND current_seller_id != new_owner_id_param THEN
              -- Log the ownership change
              INSERT INTO conversation_ownership_log (
                conversation_id, old_owner_id, new_owner_id, 
                owner_type, change_reason, changed_by
              ) VALUES (
                conv_record.id, current_seller_id, new_owner_id_param,
                'seller', change_reason_param, changed_by_param
              );
              
              -- Update conversation participant
              UPDATE conversation_participants 
              SET user_id = new_owner_id_param
              WHERE conversation_id = conv_record.id AND role = 'seller';
              
              updated_count := updated_count + 1;
            END IF;
          END LOOP;
          
          RETURN updated_count;
        END;
        $$ LANGUAGE plpgsql;
      `);
    })
    .then(() => {
      // Setup default message handlers for existing companies
      return knex.schema.raw(`
        INSERT INTO company_message_handlers (company_id, member_id, priority_order)
        SELECT DISTINCT 
          s.company_id,
          s.id,
          1 as priority_order
        FROM sellers s
        WHERE s.role IN ('admin', 'owner')
          AND s.member_status = 'active'
          AND s.company_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM company_message_handlers cmh 
            WHERE cmh.company_id = s.company_id
          )
        ON CONFLICT (company_id, member_id) DO NOTHING;
      `);
    });
};

exports.down = function(knex) {
  return knex.schema
    .raw('DROP FUNCTION IF EXISTS update_conversation_ownership(UUID, UUID, VARCHAR(100), UUID);')
    .then(() => {
      return knex.schema.raw('DROP FUNCTION IF EXISTS get_listing_message_recipient(UUID);');
    })
    .then(() => {
      return knex.schema.raw('DROP VIEW IF EXISTS active_company_message_handlers;');
    })
    .then(() => {
      return knex.schema.raw('DROP VIEW IF EXISTS listing_message_routing;');
    })
    .then(() => {
      return knex.schema.dropTableIfExists('company_message_handlers');
    })
    .then(() => {
      return knex.schema.dropTableIfExists('conversation_ownership_log');
    });
};
