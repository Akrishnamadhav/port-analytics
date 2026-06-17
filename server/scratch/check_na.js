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
    console.log('--- VESSEL NAMES CONTAINING NA or NULL/empty ---');
    const result = await client.query(
      `SELECT vessel_name, COUNT(*), SUM(amount_inr) as total_revenue
       FROM report_rows_staging 
       WHERE vessel_name IS NULL 
          OR vessel_name = '' 
          OR UPPER(vessel_name) = 'NA' 
          OR UPPER(vessel_name) = 'N.A.' 
          OR UPPER(vessel_name) = 'NOT AVAILABLE'
       GROUP BY vessel_name`
    );
    console.table(result.rows);

    console.log('--- TOP 20 VESSEL NAMES BY REVENUE ---');
    const result2 = await client.query(
      `SELECT vessel_name, COUNT(*), SUM(amount_inr) as total_revenue
       FROM report_rows_staging 
       GROUP BY vessel_name
       ORDER BY total_revenue DESC
       LIMIT 20`
    );
    console.table(result2.rows);

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
