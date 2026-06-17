const fs = require('fs');
const path = require('path');
const { cleanExcelFile } = require('../services/excelCleaner');

function run() {
  const filePath = path.join(__dirname, '..', 'test_sample_dirty.xlsx');
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const result = cleanExcelFile(fileBuffer, 2026);
  
  console.log(`Successfully cleaned file! Number of rows: ${result.rows.length}`);
  
  // Print first 50 rows of vessel names and their index, original row index if any
  console.log('Sample rows:');
  const sample = result.rows.slice(0, 50).map((r, i) => ({
    index: i,
    vcn: r.vcn,
    vessel_name: r.vessel_name,
    party_name: r.party_name,
    invoice_date: r.invoice_date,
  }));
  console.table(sample);
}

run();
