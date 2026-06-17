const { Pool } = require('pg');
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
    console.log('--- REPORTS ---');
    const reports = await client.query('SELECT id, year, status, original_filename, row_count FROM reports');
    console.table(reports.rows);

    console.log('--- STAGING ROWS WITH UNRESOLVED VESSEL NAMES ---');
    const stagingUnresolved = await client.query(
      "SELECT report_id, COUNT(*) as count FROM report_rows_staging WHERE vessel_name IS NULL OR vessel_name = '' OR vessel_name = 'Not Available' GROUP BY report_id"
    );
    console.table(stagingUnresolved.rows);

    console.log('--- STATS ROWS WITH UNRESOLVED VESSEL NAMES ---');
    const statsUnresolved = await client.query(
      "SELECT year, COUNT(*) as count FROM port_statistics WHERE vessel_name IS NULL OR vessel_name = '' OR vessel_name = 'Not Available' GROUP BY year"
    );
    console.table(statsUnresolved.rows);

    console.log('--- VESSEL NAMES IN PORT_STATISTICS ---');
    const statsVessels = await client.query(
      'SELECT DISTINCT vessel_name, COUNT(*) as count FROM port_statistics GROUP BY vessel_name ORDER BY count DESC LIMIT 15'
    );
    console.table(statsVessels.rows);

    console.log('--- VESSEL NAMES IN STAGING ---');
    const stagingVessels = await client.query(
      'SELECT DISTINCT vessel_name, COUNT(*) as count FROM report_rows_staging GROUP BY vessel_name ORDER BY count DESC LIMIT 15'
    );
    console.table(stagingVessels.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
