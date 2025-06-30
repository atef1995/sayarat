const router = require('express').Router();
const upload = require('../middleware/upload');
function advertisersRoutes(db) {
  router.post('/create', async(req, res) => {
    const { name, email, phone } = req.body;
    try {
      const result = await db.query('INSERT INTO advertisers (name, email, phone) VALUES ($1, $2, $3) RETURNING *', [
        name,
        email,
        phone
      ]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating advertiser:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
