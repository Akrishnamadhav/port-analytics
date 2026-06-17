const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function generateSeeds() {
  const SALT_ROUNDS = 10;

  const adminHash = await bcrypt.hash('admin123', SALT_ROUNDS);
  const analystHash = await bcrypt.hash('analyst123', SALT_ROUNDS);
  const viewerHash = await bcrypt.hash('viewer123', SALT_ROUNDS);

  const sql = `-- Auto-generated seed data
-- Generated at: ${new Date().toISOString()}

-- Users
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin User', 'admin@portauthority.gov.in', '${adminHash}', 'admin'),
  ('Analyst User', 'analyst@portauthority.gov.in', '${analystHash}', 'analyst'),
  ('Viewer User', 'viewer@portauthority.gov.in', '${viewerHash}', 'viewer')
ON CONFLICT (email) DO NOTHING;

-- Revenue Category Map
INSERT INTO revenue_category_map (raw_value, field_source, category) VALUES
  ('DOCK DUES', 'invoice_group', 'Docking Fees'),
  ('BERTH HIRE', 'invoice_group', 'Docking Fees'),
  ('PILOTAGE', 'invoice_group', 'Docking Fees'),
  ('PORT DUES', 'invoice_group', 'Docking Fees'),
  ('WHARFAGE', 'invoice_group', 'Storage'),
  ('STORAGE', 'invoice_group', 'Storage'),
  ('DEMURRAGE', 'invoice_group', 'Storage'),
  ('WAREHOUSE', 'invoice_group', 'Storage'),
  ('CRANE HIRE', 'invoice_group', 'Logistics'),
  ('STEVEDORING', 'invoice_group', 'Logistics'),
  ('HANDLING', 'invoice_group', 'Logistics'),
  ('TRANSPORTATION', 'invoice_group', 'Logistics');

-- Cargo Category Map
INSERT INTO cargo_category_map (raw_value, field_source, category) VALUES
  ('DRY BULK', 'commodity_group', 'Dry Bulk'),
  ('LIQUID CARGO', 'commodity_group', 'Liquid Cargo'),
  ('LIQUID BULK', 'commodity_group', 'Liquid Cargo'),
  ('POL', 'commodity_group', 'Liquid Cargo'),
  ('CONTAINER', 'commodity_group', 'Containers'),
  ('CONTAINERS', 'commodity_group', 'Containers'),
  ('VEHICLE', 'commodity_group', 'Vehicles'),
  ('VEHICLES', 'commodity_group', 'Vehicles'),
  ('AUTOMOBILE', 'commodity_group', 'Vehicles');
`;

  const outputPath = path.join(__dirname, 'seed.sql');
  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log('Seed file generated at:', outputPath);
}

generateSeeds().catch(err => {
  console.error('Error generating seeds:', err);
  process.exit(1);
});

module.exports = { generateSeeds };
