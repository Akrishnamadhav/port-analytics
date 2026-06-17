const XLSX = require('xlsx');
const path = require('path');

function generateSampleExcel() {
  const data = [
    // Junk metadata rows at the top
    ['COCHIN PORT AUTHORITY FINANCIAL REPORT'],
    ['CONFIDENTIAL - FOR INTERNAL USE ONLY'],
    ['Prepared by: Finance Dept'],
    [''], // blank line
    
    // Header row containing VCN
    [
      'VCN', 'Vessel Name', 'Berth', 'GRT', 'Commodity', 'SOR Commodity', 
      'Account Code', 'Charge Name', 'Party Code', 'Party Name', 'Voyage Type', 
      'Invoice No', 'Invoice Date', 'Voyage No', 'Invoice Amount', 'SOR Amount', 
      'Discount Amount', 'Currency', 'Unit Quantity1', 'Unit Quantity2', 'Unit Rate', 
      'Exchange Rate', 'Nature of Ship', 'ATA', 'Invoice Group', 'Sub Group', 
      'Vessel Type', 'Commodity Group', 'Reference No', 'Invoice Date Time', 
      'From Date', 'To Date'
    ],
    
    // Row 1: Normal valid row
    [
      'VCN001', 'M.T. Sea Swift', 'Berth 1', 25000, 'Crude Oil', 'POL',
      'AC001', 'BERTH HIRE CHARGES', 'P001', 'Indian Oil Corp Ltd', 'Import',
      'INV-001', new Date(2026, 0, 5), 'VOY-01', 500000, 480000,
      10000, 'INR', 1, 1, 500000,
      1, 'Foreign', new Date(2026, 0, 4), 'BERTH HIRE', 'PORT SERVICES',
      'Tanker', 'POL', 'REF001', new Date(2026, 0, 5, 10, 0),
      new Date(2026, 0, 4, 8, 0), new Date(2026, 0, 5, 12, 0)
    ],
    
    // Row 2: Blank Vessel Name (should nearest-fill with 'M.T. Sea Swift' from above)
    [
      'VCN001', '', 'Berth 1', 25000, 'Crude Oil', 'POL',
      'AC002', 'PORT DUES', 'P001', 'Indian Oil Corp Ltd', 'Import',
      'INV-002', new Date(2026, 0, 5), 'VOY-01', 120000, 120000,
      0, 'INR', 1, 1, 120000,
      1, 'Foreign', new Date(2026, 0, 4), 'PORT DUES', 'PORT SERVICES',
      'Tanker', 'POL', 'REF002', new Date(2026, 0, 5, 10, 30),
      new Date(2026, 0, 4, 8, 0), new Date(2026, 0, 5, 12, 0)
    ],
    
    // Row 3: Critical key missing: Invoice Date (should be dropped entirely)
    [
      'VCN002', 'M.V. Ocean Cargo', 'Berth 3', 35000, 'Containers', 'General Cargo',
      'AC003', 'WHARFAGE DEMURRAGE', 'P002', 'Maersk India Pvt Ltd', 'Export',
      'INV-003', '', 'VOY-02', 300000, 300000,
      0, 'INR', 200, 200, 1500,
      1, 'Coastal', new Date(2026, 0, 10), 'WHARFAGE', 'CARGO SERVICES',
      'Container', 'CONTAINERS', 'REF003', '',
      new Date(2026, 0, 10, 6, 0), new Date(2026, 0, 12, 18, 0)
    ],
    
    // Row 4: Valid row with foreign currency
    [
      'VCN003', 'M.V. Desert Storm', 'Berth 2', 42000, 'Coal', 'Coal Bulk',
      'AC004', 'PILOTAGE CHARGES', 'P003', 'Adani Enterprises Ltd', 'Import',
      'INV-004', new Date(2026, 0, 15), 'VOY-03', 5000, 5000,
      0, 'USD', 1, 1, 5000,
      83.5, 'Foreign', new Date(2026, 0, 14), 'PILOTAGE', 'PORT SERVICES',
      'Bulk Carrier', 'DRY BULK', 'REF004', new Date(2026, 0, 15, 14, 0),
      new Date(2026, 0, 14, 20, 0), new Date(2026, 0, 15, 16, 0)
    ],
    
    // Row 5: Blank Vessel Name (should nearest-fill with 'M.V. Desert Storm' from above)
    [
      'VCN003', '', 'Berth 2', 42000, 'Coal', 'Coal Bulk',
      'AC005', 'CRANE HIRE', 'P003', 'Adani Enterprises Ltd', 'Import',
      'INV-005', new Date(2026, 0, 15), 'VOY-03', 80000, 80000,
      0, 'INR', 8, 8, 10000,
      1, 'Foreign', new Date(2026, 0, 14), 'CRANE HIRE', 'PORT SERVICES',
      'Bulk Carrier', 'DRY BULK', 'REF005', new Date(2026, 0, 15, 15, 0),
      new Date(2026, 0, 14, 20, 0), new Date(2026, 0, 15, 16, 0)
    ]
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Format cells if needed (e.g., date formats)
  XLSX.utils.book_append_sheet(wb, ws, 'Financial Data');
  
  const outputPath = path.join(__dirname, '..', 'test_sample_dirty.xlsx');
  XLSX.writeFile(wb, outputPath);
  console.log('Sample dirty Excel generated successfully at:', outputPath);
}

generateSampleExcel();
