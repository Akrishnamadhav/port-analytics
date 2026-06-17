const XLSX = require('xlsx');

function cleanExcelFile(fileBuffer, reportYear) {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // RULE 1: Header detection — scan for row containing 'VCN'
  let headerRowIndex = -1;
  const headerMapping = {};
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    for (let j = 0; j < row.length; j++) {
      if (String(row[j]).trim().toUpperCase() === 'VCN') {
        headerRowIndex = i;
        // Map all header names to column indices (case-insensitive)
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
    throw new Error('Could not find header row containing VCN');
  }

  // Build column accessor
  function getCol(row, ...possibleNames) {
    for (const name of possibleNames) {
      const idx = headerMapping[name.toLowerCase()];
      if (idx !== undefined && row[idx] !== undefined && row[idx] !== '') {
        return row[idx];
      }
    }
    return undefined;
  }

  // Get data rows (everything after header)
  const dataRows = rawData.slice(headerRowIndex + 1);

  // First pass: extract raw values
  let rows = dataRows.map((row, rowIndex) => ({
    _rowIndex: rowIndex,
    vcn: getCol(row, 'vcn'),
    vessel_name: getCol(row, 'vessel name'),
    berth: getCol(row, 'berth'),
    grt: getCol(row, 'grt'),
    commodity: getCol(row, 'commodity'),
    sor_commodity: getCol(row, 'sor commodity'),
    account_code: getCol(row, 'account code'),
    charge_name: getCol(row, 'charge name'),
    party_code: getCol(row, 'party code'),
    party_name: getCol(row, 'party name'),
    voyage_type: getCol(row, 'voyage type'),
    invoice_no: getCol(row, 'invoice no.', 'invoice no'),
    invoice_date: getCol(row, 'invoice date'),
    voyage_no: getCol(row, 'voyage no.', 'voyage no'),
    invoice_amount: getCol(row, 'invoice amount'),
    sor_amount: getCol(row, 'sor amount'),
    discount_amount: getCol(row, 'discount amount'),
    currency: getCol(row, 'currency'),
    unit_quantity1: getCol(row, 'unit quantity1'),
    unit_quantity2: getCol(row, 'unit quantity2'),
    unit_rate: getCol(row, 'unit rate'),
    exchange_rate: getCol(row, 'exchange rate'),
    nature_of_ship: getCol(row, 'nature of ship'),
    invoice_group: getCol(row, 'invoice group'),
    sub_group: getCol(row, 'sub group'),
    vessel_type: getCol(row, 'vessel type'),
    commodity_group: getCol(row, 'commodity group'),
    reference_no: getCol(row, 'reference no.', 'reference no'),
  }));

  // RULE 2: Drop rows with no Invoice Date
  rows = rows.filter(r => r.invoice_date !== undefined && r.invoice_date !== null && String(r.invoice_date).trim() !== '');

  // RULE 3: Numeric blanks → 0 (convert currency amounts to absolute positive values)
  const numericFields = ['invoice_amount', 'sor_amount', 'discount_amount', 'unit_quantity1', 'unit_quantity2', 'unit_rate', 'exchange_rate', 'grt'];
  const amountFields = ['invoice_amount', 'sor_amount', 'discount_amount'];
  rows.forEach(r => {
    numericFields.forEach(f => {
      let val = parseFloat(r[f]);
      if (isNaN(val)) {
        val = 0;
      }
      if (amountFields.includes(f)) {
        val = Math.abs(val);
      }
      r[f] = val;
    });
  });

  // RULE 4: Text blanks → placeholder
  rows.forEach(r => {
    if (!r.party_name || String(r.party_name).trim() === '') r.party_name = 'Unknown';
    if (!r.currency || String(r.currency).trim() === '') r.currency = 'INR';
    const textFields = ['vcn', 'berth', 'commodity', 'sor_commodity', 'account_code', 'charge_name', 'party_code', 'voyage_type', 'invoice_no', 'voyage_no', 'nature_of_ship', 'invoice_group', 'sub_group', 'vessel_type', 'commodity_group', 'reference_no'];
    textFields.forEach(f => {
      if (!r[f] || String(r[f]).trim() === '') r[f] = 'Not Available';
    });
  });

  // RULE 5: Vessel Name nearest-fill
  for (let i = 0; i < rows.length; i++) {
    if (!rows[i].vessel_name || String(rows[i].vessel_name).trim() === '') {
      let found = false;
      for (let dist = 1; dist < rows.length && !found; dist++) {
        const above = i - dist >= 0 ? rows[i - dist].vessel_name : null;
        const below = i + dist < rows.length ? rows[i + dist].vessel_name : null;
        const aboveValid = above && String(above).trim() !== '' && above !== 'Not Available';
        const belowValid = below && String(below).trim() !== '' && below !== 'Not Available';
        if (aboveValid && belowValid) {
          rows[i].vessel_name = above; // tie-break: use above
          found = true;
        } else if (aboveValid) {
          rows[i].vessel_name = above;
          found = true;
        } else if (belowValid) {
          rows[i].vessel_name = below;
          found = true;
        }
      }
      if (!found) rows[i].vessel_name = 'Not Available';
    }
  }

  // RULE 6: Currency normalization (absolute positive value)
  rows.forEach(r => {
    if (r.exchange_rate === 0) r.exchange_rate = 1; // avoid zero multiplication
    r.amount_inr = Math.abs(r.invoice_amount * r.exchange_rate);
  });

  // Parse invoice_date to proper date
  rows.forEach(r => {
    if (r.invoice_date instanceof Date) {
      // already a date
    } else {
      // try parsing
      const d = new Date(r.invoice_date);
      r.invoice_date = isNaN(d.getTime()) ? null : d;
    }
  });

  // Drop any rows where date parsing failed
  rows = rows.filter(r => r.invoice_date !== null);

  // Add year
  rows.forEach(r => { r.year = reportYear; });

  // Compute metadata
  const totalRevenue = rows.reduce((sum, r) => sum + r.amount_inr, 0);
  const dates = rows.map(r => r.invoice_date).filter(d => d instanceof Date);
  const dateRangeStart = dates.length > 0 ? new Date(Math.min(...dates)) : null;
  const dateRangeEnd = dates.length > 0 ? new Date(Math.max(...dates)) : null;

  return {
    rows,
    metadata: {
      rowCount: rows.length,
      totalRevenue,
      dateRangeStart,
      dateRangeEnd,
    }
  };
}

module.exports = { cleanExcelFile };
