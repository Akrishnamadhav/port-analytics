const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all operating expenses
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM operating_expenses ORDER BY year DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upsert operating expense for a year (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { year, amount } = req.body;
    
    const parsedYear = parseInt(year, 10);
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedYear) || isNaN(parsedAmount)) {
      return res.status(400).json({ error: 'Valid year and amount are required' });
    }

    const result = await pool.query(
      `INSERT INTO operating_expenses (year, amount, entered_by, entered_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (year) 
       DO UPDATE SET amount = EXCLUDED.amount, entered_by = EXCLUDED.entered_by, entered_at = NOW()
       RETURNING *`,
      [parsedYear, parsedAmount, req.user.id]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Upsert expense error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
