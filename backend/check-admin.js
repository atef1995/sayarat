#!/usr/bin/env node

/**
 * Script to check and update user admin status
 * Usage: node check-admin.js [username]
 */

const knex = require('./config/database');

async function checkAndUpdateAdmin(username) {
  try {
    console.log(`Checking admin status for user: ${username}`);

    // First, check current status
    const user = await knex('sellers')
      .select('id', 'username', 'email', 'is_admin', 'account_type')
      .where('username', username)
      .first();

    if (!user) {
      console.error(`❌ User '${username}' not found!`);
      return;
    }

    console.log('Current user status:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Is Admin: ${user.is_admin || false}`);
    console.log(`  Account Type: ${user.account_type}`);

    if (user.is_admin) {
      console.log('✅ User is already an admin!');
    } else {
      console.log('❌ User is NOT an admin. Updating...');

      // Update user to admin
      await knex('sellers')
        .where('id', user.id)
        .update({
          is_admin: true,
          updated_at: knex.fn.now()
        });

      console.log('✅ User has been granted admin privileges!');

      // Verify the update
      const updatedUser = await knex('sellers')
        .select('is_admin')
        .where('id', user.id)
        .first();

      console.log(`  Updated Is Admin: ${updatedUser.is_admin}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await knex.destroy();
  }
}

// Get username from command line args or use default
const username = process.argv[2];

if (!username) {
  console.error('❌ Usage: node check-admin.js <username>');
  console.log('Example: node check-admin.js atefm');
  process.exit(1);
}

checkAndUpdateAdmin(username);
