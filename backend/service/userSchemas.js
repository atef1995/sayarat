async function fetchSellerIdByusername(knex, username) {
  try {
    const seller = await knex('sellers').select('id').where('username', username).first();

    return seller ? seller.id : null;
  } catch (error) {
    console.error('Error fetching seller by username:', error);
    return null;
  }
}

module.exports = {
  fetchSellerIdByusername
};
