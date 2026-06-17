const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// 1. GET /api/stats/yearly-comparison?years=2022,2023
router.get('/yearly-comparison', async (req, res) => {
  try {
    const yearsParam = req.query.years;
    if (!yearsParam) {
      return res.status(400).json({ error: 'years parameter is required (comma-separated)' });
    }

    const years = yearsParam.split(',').map(y => parseInt(y.trim(), 10)).filter(y => !isNaN(y));
    if (years.length === 0) {
      return res.status(400).json({ error: 'No valid years provided' });
    }

    // Build parameterized query for IN clause
    const placeholders = years.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(
      `SELECT year, SUM(amount_inr) as revenue, COUNT(DISTINCT vessel_name) as vessels, SUM(grt) as tonnage
       FROM port_statistics
       WHERE year IN (${placeholders})
       GROUP BY year
       ORDER BY year`,
      years
    );

    res.json(result.rows.map(r => ({
      year: r.year,
      revenue: parseFloat(r.revenue) || 0,
      vessels: parseInt(r.vessels, 10) || 0,
      tonnage: parseFloat(r.tonnage) || 0,
    })));
  } catch (err) {
    console.error('Yearly comparison error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. GET /api/stats/historical-trends?range=5
router.get('/historical-trends', async (req, res) => {
  try {
    const range = parseInt(req.query.range, 10) || 5;
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - range;

    const result = await pool.query(
      `SELECT year, SUM(amount_inr) as revenue
       FROM port_statistics
       WHERE year >= $1
       GROUP BY year
       ORDER BY year`,
      [startYear]
    );

    res.json(result.rows.map(r => ({
      year: r.year,
      revenue: parseFloat(r.revenue) || 0,
    })));
  } catch (err) {
    console.error('Historical trends error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. GET /api/stats/revenue-breakdown?year=2023
router.get('/revenue-breakdown', async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10);
    if (!year || isNaN(year)) {
      return res.status(400).json({ error: 'Valid year parameter is required' });
    }

    const result = await pool.query(
      `SELECT COALESCE(rcm.category, 'Other') as name, SUM(ps.amount_inr) as value
       FROM port_statistics ps
       LEFT JOIN revenue_category_map rcm ON (
         (UPPER(ps.invoice_group) = UPPER(rcm.raw_value) AND rcm.field_source = 'invoice_group')
         OR (UPPER(ps.charge_name) = UPPER(rcm.raw_value) AND rcm.field_source = 'charge_name')
         OR (UPPER(ps.sub_group) = UPPER(rcm.raw_value) AND rcm.field_source = 'sub_group')
       )
       WHERE ps.year = $1
       GROUP BY COALESCE(rcm.category, 'Other')
       ORDER BY value DESC`,
      [year]
    );

    res.json(result.rows.map(r => ({
      name: r.name,
      value: parseFloat(r.value) || 0,
    })));
  } catch (err) {
    console.error('Revenue breakdown error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. GET /api/stats/profit-vs-expenses?years=2022,2023
router.get('/profit-vs-expenses', async (req, res) => {
  try {
    let revenueQuery;
    let revenueParams = [];

    if (req.query.years) {
      const years = req.query.years.split(',').map(y => parseInt(y.trim(), 10)).filter(y => !isNaN(y));
      if (years.length === 0) {
        return res.status(400).json({ error: 'No valid years provided' });
      }
      const placeholders = years.map((_, i) => `$${i + 1}`).join(', ');
      revenueQuery = `SELECT year, SUM(amount_inr) as revenue FROM port_statistics WHERE year IN (${placeholders}) GROUP BY year ORDER BY year`;
      revenueParams = years;
    } else {
      revenueQuery = 'SELECT year, SUM(amount_inr) as revenue FROM port_statistics GROUP BY year ORDER BY year';
    }

    const revenueResult = await pool.query(revenueQuery, revenueParams);
    const expensesResult = await pool.query('SELECT year, amount as expenses FROM operating_expenses ORDER BY year');

    // Merge revenue and expenses by year
    const revenueMap = {};
    revenueResult.rows.forEach(r => {
      revenueMap[r.year] = parseFloat(r.revenue) || 0;
    });

    const expensesMap = {};
    expensesResult.rows.forEach(r => {
      expensesMap[r.year] = parseFloat(r.expenses) || 0;
    });

    const allYears = [...new Set([...Object.keys(revenueMap), ...Object.keys(expensesMap)])]
      .map(Number)
      .sort((a, b) => a - b);

    const merged = allYears.map(year => ({
      year,
      revenue: revenueMap[year] || 0,
      expenses: expensesMap[year] || 0,
    }));

    res.json(merged);
  } catch (err) {
    console.error('Profit vs expenses error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. GET /api/stats/top-shipping-lines?year=2023&metric=visits&limit=10
router.get('/top-shipping-lines', async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10);
    if (!year || isNaN(year)) {
      return res.status(400).json({ error: 'Valid year parameter is required' });
    }

    const metric = req.query.metric || 'visits';
    const limit = parseInt(req.query.limit, 10) || 10;

    let result;
    if (metric === 'revenue') {
      result = await pool.query(
        `SELECT party_name as name, SUM(amount_inr) as value
         FROM port_statistics
         WHERE year = $1
         GROUP BY party_name
         ORDER BY value DESC
         LIMIT $2`,
        [year, limit]
      );
    } else {
      // Default: visits
      result = await pool.query(
        `SELECT party_name as name, COUNT(DISTINCT vessel_name || vcn) as value
         FROM port_statistics
         WHERE year = $1
         GROUP BY party_name
         ORDER BY value DESC
         LIMIT $2`,
        [year, limit]
      );
    }

    res.json(result.rows.map(r => ({
      name: r.name,
      value: parseFloat(r.value) || 0,
    })));
  } catch (err) {
    console.error('Top shipping lines error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. GET /api/stats/company-revenue-share?year=2023
router.get('/company-revenue-share', async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10);
    if (!year || isNaN(year)) {
      return res.status(400).json({ error: 'Valid year parameter is required' });
    }

    const result = await pool.query(
      `SELECT party_name as name, SUM(amount_inr) as value
       FROM port_statistics
       WHERE year = $1
       GROUP BY party_name
       ORDER BY value DESC`,
      [year]
    );

    res.json(result.rows.map(r => ({
      name: r.name,
      value: parseFloat(r.value) || 0,
    })));
  } catch (err) {
    console.error('Company revenue share error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 7. GET /api/stats/cargo-breakdown?year=2023
router.get('/cargo-breakdown', async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10);
    if (!year || isNaN(year)) {
      return res.status(400).json({ error: 'Valid year parameter is required' });
    }

    const result = await pool.query(
      `SELECT COALESCE(ccm.category, 'Other') as name, SUM(ps.amount_inr) as value
       FROM port_statistics ps
       LEFT JOIN cargo_category_map ccm ON (
         UPPER(ps.commodity_group) = UPPER(ccm.raw_value) AND ccm.field_source = 'commodity_group'
       )
       WHERE ps.year = $1
       GROUP BY COALESCE(ccm.category, 'Other')
       ORDER BY value DESC`,
      [year]
    );

    res.json(result.rows.map(r => ({
      name: r.name,
      value: parseFloat(r.value) || 0,
    })));
  } catch (err) {
    console.error('Cargo breakdown error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 8. GET /api/stats/tonnage-trends?granularity=yearly&year=2023
router.get('/tonnage-trends', async (req, res) => {
  try {
    const granularity = req.query.granularity || 'yearly';

    let result;
    if (granularity === 'monthly') {
      const year = parseInt(req.query.year, 10);
      if (!year || isNaN(year)) {
        return res.status(400).json({ error: 'Valid year parameter is required for monthly granularity' });
      }
      result = await pool.query(
        `SELECT TO_CHAR(invoice_date, 'YYYY-MM') as name, SUM(grt) as value
         FROM port_statistics
         WHERE year = $1
         GROUP BY name
         ORDER BY name`,
        [year]
      );
    } else {
      // Default: yearly
      result = await pool.query(
        `SELECT year::text as name, SUM(grt) as value
         FROM port_statistics
         GROUP BY year
         ORDER BY year`
      );
    }

    res.json(result.rows.map(r => ({
      name: r.name,
      value: parseFloat(r.value) || 0,
    })));
  } catch (err) {
    console.error('Tonnage trends error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
