const checkIfEmailExists = async(email, knex) => {
  if (!email) {
    throw new Error('Email is required to check existence');
  }

  // Check if the email exists in the database
  const existingEmail = await knex('sellers').select('email').where('email', email).first();

  // Return true if email exists, false otherwise
  return !!existingEmail;
};

module.exports = checkIfEmailExists;
