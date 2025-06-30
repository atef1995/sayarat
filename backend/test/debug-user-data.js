const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

const knexConfig = require('../knexFile');
const knex = require('knex')(knexConfig.development);

async function debugUserData() {
  try {
    console.log('🔍 Checking user data structure...');

    // Get a sample user from the sellers table
    const sampleUser = await knex('sellers').select('*').limit(1).first();

    if (sampleUser) {
      console.log('📋 Sample user fields available:');
      console.log('User ID:', sampleUser.id);
      console.log('Available fields:', Object.keys(sampleUser));

      // Check for email-related fields
      const emailFields = Object.keys(sampleUser).filter(key => key.toLowerCase().includes('email'));
      console.log('Email-related fields:', emailFields);

      // Check for name-related fields
      const nameFields = Object.keys(sampleUser).filter(key => key.toLowerCase().includes('name'));
      console.log('Name-related fields:', nameFields);

      // Show specific user data (redacted for privacy)
      console.log('\nUser data structure:');
      Object.keys(sampleUser).forEach(key => {
        if (key.toLowerCase().includes('email')) {
          console.log(`${key}: ${sampleUser[key] ? '[REDACTED EMAIL]' : 'NULL/UNDEFINED'}`);
        } else if (key.toLowerCase().includes('name')) {
          console.log(`${key}: ${sampleUser[key] || 'NULL/UNDEFINED'}`);
        }
      });
    } else {
      console.log('❌ No users found in sellers table');
    }

    // Also check the specific user ID from the error
    const errorUserId = 'fdaf9cbf-d32c-40e1-af9a-4e1eb6216296';
    const specificUser = await knex('sellers').select('*').where('id', errorUserId).first();

    if (specificUser) {
      console.log('\n🎯 Specific user from error:');
      console.log('User ID:', specificUser.id);

      const emailField = Object.keys(specificUser).find(key => key.toLowerCase().includes('email'));

      if (emailField) {
        console.log(`Email field (${emailField}):`, specificUser[emailField] ? '[REDACTED EMAIL]' : 'NULL/UNDEFINED');
      } else {
        console.log('❌ No email field found for this user');
      }

      const nameField = Object.keys(specificUser).find(key => key.toLowerCase().includes('name'));

      if (nameField) {
        console.log(`Name field (${nameField}):`, specificUser[nameField] || 'NULL/UNDEFINED');
      }
    }
  } catch (error) {
    console.error('❌ Error checking user data:', error.message);
  } finally {
    await knex.destroy();
  }
}

debugUserData();
