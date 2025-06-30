const crypto = require('crypto');

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateTokenExpiry = () => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 1); // Token valid for 1 day
  return expiry.toISOString();
};

module.exports = { generateResetToken, generateTokenExpiry };
