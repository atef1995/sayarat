/**
 * Debug script to check account type data in database
 * Run this to see what account type information is stored for users
 */

const knex = require('knex')(require('./knexfile.js').development);

async function debugAccountData() {
  try {
    console.log('=== DEBUGGING ACCOUNT TYPE DATA ===\n');

    // Get all sellers with their account information
    const sellers = await knex('sellers')
      .select('id', 'username', 'email', 'account_type', 'company_id', 'is_company', 'is_premium', 'role')
      .limit(10);

    console.log('Sellers data:');
    console.table(sellers);

    // Check if companies table exists and has data
    try {
      const companies = await knex('companies').select('*').limit(5);

      console.log('\nCompanies data:');
      console.table(companies);
    } catch (err) {
      console.log('\nCompanies table not found or error:', err.message);
    }

    // Check for any sellers with company associations
    try {
      const sellersWithCompanies = await knex('sellers')
        .leftJoin('companies', 'sellers.company_id', 'companies.id')
        .select(
          'sellers.id as seller_id',
          'sellers.username',
          'sellers.account_type',
          'sellers.company_id',
          'sellers.is_company',
          'companies.name as company_name',
          'companies.email as company_email'
        )
        .whereNotNull('sellers.company_id')
        .orWhere('sellers.is_company', true)
        .orWhere('sellers.account_type', 'company');

      console.log('\nSellers with company associations:');
      console.table(sellersWithCompanies);
    } catch (err) {
      console.log('\nError checking company associations:', err.message);
    }

    // Check database schema for sellers table
    try {
      const sellerColumns = await knex('sellers').columnInfo();
      console.log('\nSellers table columns:');
      console.log(Object.keys(sellerColumns));
    } catch (err) {
      console.log('\nError getting sellers table schema:', err.message);
    }
  } catch (error) {
    console.error('Error debugging account data:', error);
  } finally {
    await knex.destroy();
  }
}

debugAccountData();
