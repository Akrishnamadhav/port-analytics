const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { cleanExcelFile } = require('../services/excelCleaner');

const router = express.Router();

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx and .xls files are allowed'), false);
    }
  },
});

// POST /api/reports/upload — analyst, admin
router.post('/upload', authenticate, authorize('analyst', 'admin'), upload.single('file'), async (req, res) => {
  const client = await pool.connect();
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const year = parseInt(req.body.year, 10);
    if (!year || isNaN(year)) {
      return res.status(400).json({ error: 'Valid year is required' });
    }

    // Clean the Excel file
    const { rows, metadata } = cleanExcelFile(req.file.buffer, year);

    await client.query('BEGIN');

    // Insert report record
    const reportResult = await client.query(
      `INSERT INTO reports (uploaded_by, year, original_filename, row_count, total_revenue_preview, date_range_start, date_range_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        year,
        req.file.originalname,
        metadata.rowCount,
        metadata.totalRevenue,
        metadata.dateRangeStart,
        metadata.dateRangeEnd,
      ]
    );

    const report = reportResult.rows[0];

    // Bulk insert cleaned rows into staging in batches of 500
    if (rows.length > 0) {
      const columns = [
        'report_id', 'invoice_date', 'invoice_amount', 'sor_amount', 'discount_amount',
        'currency', 'exchange_rate', 'amount_inr', 'party_name', 'party_code',
        'vessel_name', 'vessel_type', 'charge_name', 'invoice_group', 'sub_group',
        'account_code', 'commodity', 'commodity_group', 'sor_commodity', 'grt',
        'unit_quantity1', 'unit_quantity2', 'unit_rate', 'vcn', 'berth',
        'voyage_type', 'voyage_no', 'invoice_no', 'nature_of_ship', 'reference_no', 'year'
      ];

      const valuesPerRow = columns.length;
      const BATCH_SIZE = 500;

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batchRows = rows.slice(i, i + BATCH_SIZE);
        const valuePlaceholders = [];
        const flatValues = [];
        let paramIndex = 1;

        for (const row of batchRows) {
          const rowPlaceholders = [];
          const rowValues = [
            report.id,
            row.invoice_date,
            row.invoice_amount,
            row.sor_amount,
            row.discount_amount,
            row.currency,
            row.exchange_rate,
            row.amount_inr,
            row.party_name,
            row.party_code,
            row.vessel_name,
            row.vessel_type,
            row.charge_name,
            row.invoice_group,
            row.sub_group,
            row.account_code,
            row.commodity,
            row.commodity_group,
            row.sor_commodity,
            row.grt,
            row.unit_quantity1,
            row.unit_quantity2,
            row.unit_rate,
            row.vcn,
            row.berth,
            row.voyage_type,
            row.voyage_no,
            row.invoice_no,
            row.nature_of_ship,
            row.reference_no,
            row.year,
          ];

          for (let k = 0; k < valuesPerRow; k++) {
            rowPlaceholders.push(`$${paramIndex++}`);
          }
          valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
          flatValues.push(...rowValues);
        }

        const insertQuery = `INSERT INTO report_rows_staging (${columns.join(', ')}) VALUES ${valuePlaceholders.join(', ')}`;
        await client.query(insertQuery, flatValues);
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      report,
      metadata,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Upload error:', err);
    if (err.message && err.message.includes('Could not find header row')) {
      return res.status(400).json({ error: err.message });
    }
    if (err.message && err.message.includes('Only .xlsx and .xls')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Handle multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 15MB limit' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message && err.message.includes('Only .xlsx and .xls')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// GET /api/reports/mine — analyst, admin
router.get('/mine', authenticate, authorize('analyst', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reports WHERE uploaded_by = $1 ORDER BY uploaded_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get my reports error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/pending — admin only
router.get('/pending', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as uploader_name
       FROM reports r
       LEFT JOIN users u ON r.uploaded_by = u.id
       WHERE r.status = 'pending'
       ORDER BY r.uploaded_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get pending reports error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/approved — admin only
router.get('/approved', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as uploader_name
       FROM reports r
       LEFT JOIN users u ON r.uploaded_by = u.id
       WHERE r.status = 'approved'
       ORDER BY r.uploaded_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get approved reports error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/:id — admin only
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const reportId = parseInt(req.params.id, 10);
    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const reportResult = await pool.query('SELECT * FROM reports WHERE id = $1', [reportId]);
    if (reportResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = (page - 1) * limit;

    const rowsResult = await pool.query(
      'SELECT * FROM report_rows_staging WHERE report_id = $1 ORDER BY id LIMIT $2 OFFSET $3',
      [reportId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM report_rows_staging WHERE report_id = $1',
      [reportId]
    );

    res.json({
      report: reportResult.rows[0],
      rows: rowsResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count, 10),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit),
      },
    });
  } catch (err) {
    console.error('Get report detail error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/reports/:id/approve — admin only
router.patch('/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    const reportId = parseInt(req.params.id, 10);
    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    await client.query('BEGIN');

    // Check report exists and is pending
    const reportCheck = await client.query('SELECT * FROM reports WHERE id = $1', [reportId]);
    if (reportCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Report not found' });
    }
    if (reportCheck.rows[0].status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Report is not in pending status' });
    }

    // Update report status
    const updateResult = await client.query(
      `UPDATE reports SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
       WHERE id = $2 RETURNING *`,
      [req.user.id, reportId]
    );

    // Copy staging rows to port_statistics
    await client.query(
      `INSERT INTO port_statistics (
        report_id, invoice_date, invoice_amount, sor_amount, discount_amount,
        currency, exchange_rate, amount_inr, party_name, party_code,
        vessel_name, vessel_type, charge_name, invoice_group, sub_group,
        account_code, commodity, commodity_group, sor_commodity, grt,
        unit_quantity1, unit_quantity2, unit_rate, vcn, berth,
        voyage_type, voyage_no, invoice_no, nature_of_ship, reference_no, year
      )
      SELECT
        report_id, invoice_date, invoice_amount, sor_amount, discount_amount,
        currency, exchange_rate, amount_inr, party_name, party_code,
        vessel_name, vessel_type, charge_name, invoice_group, sub_group,
        account_code, commodity, commodity_group, sor_commodity, grt,
        unit_quantity1, unit_quantity2, unit_rate, vcn, berth,
        voyage_type, voyage_no, invoice_no, nature_of_ship, reference_no, year
      FROM report_rows_staging
      WHERE report_id = $1`,
      [reportId]
    );

    await client.query('COMMIT');

    res.json(updateResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Approve report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PATCH /api/reports/:id/reject — admin only
router.patch('/:id/reject', authenticate, authorize('admin'), async (req, res) => {
  try {
    const reportId = parseInt(req.params.id, 10);
    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    // Check report exists and is pending
    const reportCheck = await pool.query('SELECT * FROM reports WHERE id = $1', [reportId]);
    if (reportCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    if (reportCheck.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Report is not in pending status' });
    }

    const { reason } = req.body || {};

    const result = await pool.query(
      `UPDATE reports SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $2
       WHERE id = $3 RETURNING *`,
      [req.user.id, reason || null, reportId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Reject report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/reports/:id — admin only
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const reportId = parseInt(req.params.id, 10);
    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const result = await pool.query('DELETE FROM reports WHERE id = $1 RETURNING *', [reportId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully', report: result.rows[0] });
  } catch (err) {
    console.error('Delete report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
