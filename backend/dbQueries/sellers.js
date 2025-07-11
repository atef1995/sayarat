const getSellerByUsername = async (knex, username) => {
  if (!username) {
    throw new Error('Username is required to fetch seller');
  }

  // Fetch the seller by username from the database
  const seller = knex('sellers')
    .select(
      'id',
      'username',
      'email',
      'first_name',
      'salt',
      'hashed_password',
      'email_verified',
      'email_verification_token',
      'email_token_expiry',
      'last_login',
      'is_company',
      'company_id',
      'is_premium',
      'is_admin',
      'account_type',
      'picture'
    )
    .where('username', username)
    .first();

  if (!seller) {
    throw new Error(`Seller with username ${username} not found`);
  }

  return seller;
};

const getSellerById = async (knex, id) => {
  if (!id) {
    throw new Error('Seller ID is required to fetch seller');
  }
  // Fetch the seller by ID from the database
  const seller = await knex('sellers')
    .select(
      'id',
      'username',
      'email',
      'first_name',
      'salt',
      'hashed_password',
      'email_verified',
      'email_verification_token',
      'email_token_expiry',
      'last_login',
      'is_company',
      'company_id',
      'is_premium',
      'is_admin',
      'account_type',
      'picture'
    )
    .where('id', id)
    .first();
  if (!seller) {
    throw new Error(`Seller with ID ${id} not found`);
  }
  return seller;
};

module.exports = {
  getSellerByUsername,
  getSellerById
};
