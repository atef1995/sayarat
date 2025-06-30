/**
 * Script to fix subscription field references in listingDatabase.js
 */

const fs = require('fs');
const path = require('path');

async function fixSubscriptionFields() {
  const filePath = path.join(__dirname, '../service/listingDatabase.js');

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    console.log('🔧 Fixing subscription field references...');

    // Replace subscription_plan_id with subscription_type
    content = content.replace(
      /c\.subscription_plan_id as subscription_plan/g,
      'c.subscription_type as subscription_plan'
    );

    // Replace is_verified references in group by clauses
    content = content.replace(/c\.subscription_plan_id/g, 'c.subscription_type');

    // Replace is_verified with computed field
    content = content.replace(
      /'c\.is_verified',/g,
      "this.knex.raw('CASE WHEN c.subscription_status = ? THEN true ELSE false END as is_verified', ['active']),"
    );

    // Fix group by clauses to remove is_verified
    content = content.replace(
      /'c\.name', 'c\.logo_url', 'c\.subscription_status', 'c\.subscription_type', 'c\.is_verified'/g,
      "'c.name', 'c.logo_url', 'c.subscription_status', 'c.subscription_type'"
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Successfully fixed subscription field references');
  } catch (error) {
    console.error('❌ Error fixing subscription fields:', error.message);
  }
}

fixSubscriptionFields().catch(console.error);
