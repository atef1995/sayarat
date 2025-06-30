const express = require('express');
const multer = require('multer');
const { ensureAuthenticated } = require('../middleware/auth');
const { analyzeCarImage } = require('../controllers/aiController');

const router = express.Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Analyze car image using AI
router.post('/analyze-car', ensureAuthenticated, upload.single('image'), analyzeCarImage);

module.exports = router;
