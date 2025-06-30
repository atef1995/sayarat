const express = require('express');
const { fetchDistinctFromDb, fetchModelsByMake, fetchModelsByMakes } = require('../service/fetchFromDb');
const router = express.Router();

function cars(knex) {
  router.get('/makes', async(req, res) => {
    try {
      const rows = await fetchDistinctFromDb(knex, 'all_cars', 'make');
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'No makes found' });
      }

      const makes = [...new Set(rows.map(car => car.make))].sort();
      res.json(makes);
    } catch (err) {
      console.error('Error fetching makes:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Example route: Fetch models by make
  router.get('/models', async(req, res) => {
    const makes = req.query.makes.split(',');
    if (!makes || makes.length === 0) {
      return res.status(400).json({ error: 'No makes provided' });
    }
    console.log(`Fetching models for makes: ${makes}`, typeof makes[0]);

    try {
      let carModels;
      if (makes.length > 1) {
        carModels = await fetchModelsByMakes(knex, makes);
      } else {
        carModels = await fetchModelsByMake(knex, makes[0]);
      }
      if (!carModels || carModels.length === 0) {
        return res.status(404).json({ error: 'No models found for the specified make' });
      }
      res.json(carModels);
    } catch (err) {
      console.error('Error fetching models:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  return router;
}

module.exports = { cars };
