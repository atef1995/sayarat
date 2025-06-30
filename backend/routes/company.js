const express = require('express');
const CompanyController = require('../controllers/companyController');
const { ensureAuthenticated } = require('../middleware/auth');
const upload = require('../middleware/upload');
const knex = require('knex')(require('../knexfile.js').development);

const router = express.Router();
const companyController = new CompanyController(knex);

// Apply authentication and company user check to all routes
router.use(ensureAuthenticated);

// Company profile routes
router.get('/profile', (req, res) => companyController.getCompanyProfile(req, res));
router.put('/update', (req, res) => companyController.updateCompanyProfile(req, res));

// Company image upload
router.post('/upload-image', upload.single('image'), (req, res) => companyController.uploadCompanyImage(req, res));

// Company statistics
router.get('/stats', (req, res) => companyController.getCompanyStats(req, res));
router.get('/analytics', (req, res) => companyController.getCompanyAnalytics(req, res));
router.get('/stats/enhanced', (req, res) => companyController.getEnhancedCompanyStats(req, res));

// Company listings
router.get('/listings', (req, res) => companyController.getCompanyListings(req, res));

// Company members
router.get('/members', (req, res) => companyController.getCompanyMembers(req, res));
router.post('/members', (req, res) => companyController.addCompanyMember(req, res));
router.delete('/members/:id', (req, res) => companyController.removeCompanyMember(req, res));
router.put('/members/:id/reactivate', (req, res) => companyController.reactivateCompanyMember(req, res));

module.exports = router;
