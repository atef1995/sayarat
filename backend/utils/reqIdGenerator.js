/**
 * This module is responsible for generating unique request IDs.
 * It can be used to track requests across the application,
 * especially useful for logging and debugging purposes.
 */
class ReqIdGenerator {
  constructor() {
    // No initialization needed for this utility class
  }

  /**
   * Generate a unique request ID
   * @returns {string} - Unique request identifier
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

module.exports = ReqIdGenerator;
