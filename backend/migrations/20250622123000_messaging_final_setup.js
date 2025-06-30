/**
 * Migration: Enhanced Messaging System - Final Setup
 *
 * Final setup and validation for the enhanced messaging system.
 * Adds any missing constraints, indexes, and performs data validation.
 */

exports.up = function(knex) {
  return knex.schema
    .raw(
      `
    -- Add helpful comments for documentation
    COMMENT ON TABLE conversation_ownership_log IS 'Tracks changes in conversation ownership when listings are transferred between company members';
    COMMENT ON TABLE company_message_handlers IS 'Defines which company members can handle messages for transferred or company-managed listings';
    COMMENT ON COLUMN listed_cars.current_owner_id IS 'The current owner who receives messages for this listing';
    COMMENT ON COLUMN listed_cars.current_owner_type IS 'Type of current owner: seller (individual) or company (company-managed)';
    COMMENT ON COLUMN listed_cars.original_seller_id IS 'The original seller who created the listing (for audit trail)';
  `
    )
    .then(() => {
      // Add any missing indexes for performance
      return knex.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_conversation_participants_seller 
      ON conversation_participants(conversation_id, role) 
      WHERE role = 'seller';
    `);
    })
    .then(() => {
      // Verify migration completed successfully
      return knex.schema.raw(`
      DO $$
      DECLARE
        listing_count INTEGER;
        handler_count INTEGER;
        audit_table_exists BOOLEAN;
        tracking_table_exists BOOLEAN;
      BEGIN
        SELECT COUNT(*) INTO listing_count FROM listed_cars WHERE current_owner_id IS NOT NULL;
        SELECT COUNT(*) INTO handler_count FROM company_message_handlers;
        SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'company_member_audit') INTO audit_table_exists;
        SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_ownership_log') INTO tracking_table_exists;
        
        RAISE NOTICE 'Enhanced Messaging System Migration completed successfully:';
        RAISE NOTICE '  - Updated % listings with ownership tracking', listing_count;
        RAISE NOTICE '  - Created % company message handlers', handler_count;
        RAISE NOTICE '  - Member audit table exists: %', audit_table_exists;
        RAISE NOTICE '  - Conversation tracking table exists: %', tracking_table_exists;
        RAISE NOTICE '  - Added conversation ownership logging';
        RAISE NOTICE '  - Created message routing functions';
        
        -- Validate that all required components exist
        IF NOT audit_table_exists THEN
          RAISE EXCEPTION 'Migration failed: company_member_audit table not created';
        END IF;
        
        IF NOT tracking_table_exists THEN
          RAISE EXCEPTION 'Migration failed: conversation_ownership_log table not created';
        END IF;
        
        IF listing_count = 0 THEN
          RAISE WARNING 'No listings found with ownership tracking - this may be expected for new installations';
        END IF;
      END $$;
    `);
    });
};

exports.down = function(knex) {
  return knex.schema
    .raw(
      `
    DROP INDEX IF EXISTS idx_conversation_participants_seller;
  `
    )
    .then(() => {
      return knex.schema.raw(`
      COMMENT ON TABLE conversation_ownership_log IS NULL;
      COMMENT ON TABLE company_message_handlers IS NULL;
      COMMENT ON COLUMN listed_cars.current_owner_id IS NULL;
      COMMENT ON COLUMN listed_cars.current_owner_type IS NULL;
      COMMENT ON COLUMN listed_cars.original_seller_id IS NULL;
    `);
    });
};
