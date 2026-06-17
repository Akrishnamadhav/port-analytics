const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function checkFile(fileName) {
  const filePath = path.join('c:/Madhav/Programming/Port Authority/Financial Analysis Reports', fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${fileName}`);
    return;
  }

  console.log(`\n========================================`);
  console.log(`Analyzing file: ${fileName}...`);
  const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Find header row
  let headerRowIndex = -1;
  const headerMapping = {};
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    for (let j = 0; j < row.length; j++) {
      if (String(row[j]).trim().toUpperCase() === 'VCN') {
        headerRowIndex = i;
        row.forEach((cell, colIdx) => {
          const name = String(cell).trim().toLowerCase();
          if (name) headerMapping[name] = colIdx;
        });
        break;
      }
    }
    if (headerRowIndex >= 0) break;
  }

  if (headerRowIndex < 0) {
    console.log('Could not find header row');
    return;
  }

  const dateColIdx = headerMapping['invoice date'];
  if (dateColIdx === undefined) {
    console.log('No "invoice date" column found!');
    return;
  }

  const dataRows = rawData.slice(headerRowIndex + 1);
  const formats = {};
  let dateObjectCount = 0;
  let totalRows = dataRows.length;

  for (let i = 0; i < dataRows.length; i++) {
    const val = dataRows[i][dateColIdx];
    if (val === undefined || val === null || String(val).trim() === '') {
      continue;
    }

    if (val instanceof Date) {
      dateObjectCount++;
    } else {
      const str = String(val).trim();
      let formatPattern = 'other';
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        formatPattern = 'YYYY-MM-DD';
      } else if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
        formatPattern = 'DD-MM-YYYY or MM-DD-YYYY';
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
        formatPattern = 'DD/MM/YYYY or MM/DD/YYYY';
      } else if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(str)) {
        formatPattern = 'var-len-slash-dash';
      } else if (/^\d+$/.test(str)) {
        formatPattern = 'excel-serial-number';
      }
      formats[formatPattern] = (formats[formatPattern] || 0) + 1;
      if (formatPattern === 'other' || i < 5) {
        // Log a few samples
        if ((formats[formatPattern] || 0) <= 3) {
          console.log(`  Sample [${formatPattern}]: "${str}" (type: ${typeof val})`);
        }
      }
    }
  }

  console.log(`Results for ${fileName}:`);
  console.log(`  Total rows after header: ${totalRows}`);
  console.log(`  Date objects: ${dateObjectCount}`);
  console.log(`  String format counts:`, formats);
}

const files = [
  'FinancialAnalysisReport 2021-2022.xlsx',
  'FinancialAnalysisReport 2022-2023.xlsx',
  'FinancialAnalysisReport 2023-2024.xlsx',
  'FinancialAnalysisReport 2024-2025.xlsx'
];

for (const f of files) {
  checkFile(f);
}
