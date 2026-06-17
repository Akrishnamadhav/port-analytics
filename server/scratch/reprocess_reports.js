const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { cleanExcelFile } = require('../services/excelCleaner');

require('dotenv').config({ path: 'c:/Madhav/Programming/Port Authority/new/server/.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function main() {
  const client = await pool.connect();
  try {
    // Get all pending reports
    const reportsRes = await client.query("SELECT id, year, original_filename FROM reports WHERE status = 'pending' ORDER BY year");
    const reports = reportsRes.rows;
    console.log(`Found ${reports.length} pending reports to reprocess.`);

    const reportsDir = 'c:/Madhav/Programming/Port Authority/Financial Analysis Reports';

    for (const report of reports) {
      console.log(`\n========================================`);
      console.log(`Reprocessing Report ID: ${report.id}, Year: ${report.year}, File: ${report.original_filename}`);
      
      const filePath = path.join(reportsDir, report.original_filename);
      if (!fs.existsSync(filePath)) {
        console.error(`Error: Original Excel file not found at ${filePath}`);
        continue;
      }

      console.log(`Reading file ${report.original_filename}...`);
      const fileBuffer = fs.readFileSync(filePath);

      console.log(`Running cleanExcelFile for year ${report.year}...`);
      const { rows, metadata } = cleanExcelFile(fileBuffer, report.year);
      console.log(`Cleaned ${rows.length} rows. Total revenue preview: ${metadata.totalRevenue}`);

      await client.query('BEGIN');

      // 1. Delete existing rows in staging
      console.log(`Deleting existing staging rows for report ${report.id}...`);
      await client.query('DELETE FROM report_rows_staging WHERE report_id = $1', [report.id]);

      // 2. Insert new cleaned rows
      console.log(`Inserting new cleaned rows for report ${report.id}...`);
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

      // 3. Update report metadata
      console.log(`Updating report metadata...`);
      await client.query(
        `UPDATE reports
         SET row_count = $1, total_revenue_preview = $2, date_range_start = $3, date_range_end = $4
         WHERE id = $5`,
        [
          metadata.rowCount,
          metadata.totalRevenue,
          metadata.dateRangeStart,
          metadata.dateRangeEnd,
          report.id
        ]
      );

      await client.query('COMMIT');
      console.log(`Report ${report.id} reprocessed successfully!`);
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during reprocessing:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
