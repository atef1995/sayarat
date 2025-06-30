const router = require('express').Router();
const { Knex } = require('knex');
const { ensureAuthenticated } = require('../middleware/auth');

/**
 *
 * @param {Knex} knex - Knex database instance
 * @returns {Router} - Express router for report handling
 */
function reportRouter(knex) {
  router.post('/', ensureAuthenticated, async(req, res) => {
    const { id, reportType, reason, details, toReport } = req.body;
    const userId = req.user.id;
    if (!id || !reportType || !reason || !toReport) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    try {
      await knex('listing_reports').insert({
        listing_id: id,
        reporter_id: userId,
        report_type: reportType,
        reason,
        details,
        status: 'PENDING',
        to_report: toReport
      });
      res.json({ success: true, message: 'Report submitted successfully' });
    } catch (error) {
      console.error('Error submitting report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit report'
      });
    }
  });
  return router;
}

module.exports = reportRouter;
