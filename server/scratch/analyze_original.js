const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function analyze() {
  const filePath = 'c:/Madhav/Programming/Port Authority/Financial Analysis Reports/FinancialAnalysisReport 2021-2022.xlsx';
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  console.log('Reading file...');
  const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  console.log(`Total raw rows in sheet (including headers/empty rows at top/bottom): ${rawData.length}`);

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

  console.log(`Header row index: ${headerRowIndex}`);
  console.log('Header mapping:', headerMapping);

  if (headerRowIndex < 0) {
    console.log('Could not find header containing VCN');
    return;
  }

  const dataRows = rawData.slice(headerRowIndex + 1);
  console.log(`Rows after header: ${dataRows.length}`);

  // Let's trace invoice dates
  const dateColIdx = headerMapping['invoice date'];
  if (dateColIdx === undefined) {
    console.log('No "invoice date" column found!');
    return;
  }

  let missingDateColCount = 0;
  let emptyStringDateCount = 0;
  let parsedDateFailCount = 0;
  let validDateCount = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rawVal = row[dateColIdx];
    
    if (rawVal === undefined || rawVal === null) {
      missingDateColCount++;
    } else if (String(rawVal).trim() === '') {
      emptyStringDateCount++;
    } else {
      let isDateValid = false;
      if (rawVal instanceof Date) {
        isDateValid = !isNaN(rawVal.getTime());
      } else {
        const d = new Date(rawVal);
        isDateValid = !isNaN(d.getTime());
      }
      if (isDateValid) {
        validDateCount++;
      } else {
        parsedDateFailCount++;
        if (parsedDateFailCount <= 5) {
          console.log(`Sample failed date parsing at row ${i}:`, rawVal, typeof rawVal);
        }
      }
    }
  }

  console.log('\n--- Analysis of Invoice Date column ---');
  console.log(`Missing/undefined value count: ${missingDateColCount}`);
  console.log(`Empty string count: ${emptyStringDateCount}`);
  console.log(`Failed date parsing count: ${parsedDateFailCount}`);
  console.log(`Valid date count: ${validDateCount}`);
  console.log(`Total checked: ${missingDateColCount + emptyStringDateCount + parsedDateFailCount + validDateCount}`);
}

analyze();
