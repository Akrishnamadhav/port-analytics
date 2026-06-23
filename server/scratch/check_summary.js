const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/Madhav/Programming/Port Authority/new/server/.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function run() {
  try {
    // Get all years
    const yearsRes = await pool.query('SELECT DISTINCT year FROM port_statistics ORDER BY year');
    const years = yearsRes.rows.map(r => r.year);
    
    let sumRevenue = 0;
    let sumVessels = 0;
    let sumTonnage = 0;
    let sumInvoices = 0;

    console.log('--- INDIVIDUAL YEARS ---');
    for (const year of years) {
      const res = await pool.query(`
        SELECT 
           SUM(amount_inr) as revenue,
           COUNT(DISTINCT vessel_name || vcn) as vessels,
           SUM(grt) as tonnage,
           COUNT(DISTINCT invoice_no) as invoices
         FROM port_statistics
         WHERE year = $1
      `, [year]);
      
      const row = res.rows[0];
      const rev = parseFloat(row.revenue) || 0;
      const ves = parseInt(row.vessels, 10) || 0;
      const ton = parseFloat(row.tonnage) || 0;
      const inv = parseInt(row.invoices, 10) || 0;

      console.log(`Year ${year}: Revenue=${rev.toFixed(2)}, Vessels=${ves}, Tonnage=${ton.toFixed(2)}, Invoices=${inv}`);
      
      sumRevenue += rev;
      sumVessels += ves;
      sumTonnage += ton;
      sumInvoices += inv;
    }

    console.log('\n--- SUM OF INDIVIDUAL YEARS ---');
    console.log(`Total Revenue: ${sumRevenue.toFixed(2)}`);
    console.log(`Total Vessels: ${sumVessels}`);
    console.log(`Total Tonnage: ${sumTonnage.toFixed(2)}`);
    console.log(`Total Invoices: ${sumInvoices}`);

    console.log('\n--- ALL YEARS AGGREGATION (from DB with fix) ---');
    const allRes = await pool.query(`
      SELECT 
         SUM(amount_inr) as revenue,
         COUNT(DISTINCT vessel_name || vcn || year::text) as vessels,
         SUM(grt) as tonnage,
         COUNT(DISTINCT invoice_no || year::text) as invoices
       FROM port_statistics
     `);
    
    const allRow = allRes.rows[0];
    const allRev = parseFloat(allRow.revenue) || 0;
    const allVes = parseInt(allRow.vessels, 10) || 0;
    const allTon = parseFloat(allRow.tonnage) || 0;
    const allInv = parseInt(allRow.invoices, 10) || 0;

    console.log(`Total Revenue: ${allRev.toFixed(2)}`);
    console.log(`Total Vessels: ${allVes}`);
    console.log(`Total Tonnage: ${allTon.toFixed(2)}`);
    console.log(`Total Invoices: ${allInv}`);

    console.log('\n--- DIFFERENCES ---');
    console.log(`Revenue Diff: ${(allRev - sumRevenue).toFixed(2)}`);
    console.log(`Vessels Diff: ${allVes - sumVessels}`);
    console.log(`Tonnage Diff: ${(allTon - sumTonnage).toFixed(2)}`);
    console.log(`Invoices Diff: ${allInv - sumInvoices}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
