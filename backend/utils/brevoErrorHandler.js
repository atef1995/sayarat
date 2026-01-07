const logger = require('./logger');

/**
 * Handles Brevo email service errors with consistent logging and error details
 * @param {Error} error - The error object from axios/Brevo API
 * @param {Object} context - Context information about the failed operation
 * @param {string} context.operationType - Type of operation (e.g., 'verification', 'password-reset', 'payment-success')
 * @param {string} context.requestId - Request tracking ID
 * @param {string} context.recipient - Email recipient
 * @param {string} [context.paymentId] - Payment ID (optional, for payment-related emails)
 * @throws {Error} Re-throws the original error after logging
 */
function handleBrevoError(error, context) {
  const {
    operationType = 'email',
    requestId,
    recipient,
    paymentId
  } = context;

  // Extract Brevo-specific error details
  const brevoError = error.response?.data;
  const errorDetails = {
    requestId,
    recipient,
    errorMessage: error.message,
    brevoCode: brevoError?.code,
    brevoMessage: brevoError?.message,
    httpStatus: error.response?.status
  };

  // Include payment ID if provided
  if (paymentId) {
    errorDetails.paymentId = paymentId;
  }

  // Handle IP whitelist errors with helpful guidance
  if (error.response?.status === 401 && brevoError?.message?.includes('IP address')) {
    errorDetails.ipWhitelistIssue = true;
    errorDetails.solution = 'Add your IP address to https://app.brevo.com/security/authorised_ips';
    logger.error(`Brevo IP whitelist error - ${operationType} email not sent`, errorDetails);
  } else {
    logger.error(`Failed to send ${operationType} email`, errorDetails);
  }

  throw error;
}

module.exports = {
  handleBrevoError
};
