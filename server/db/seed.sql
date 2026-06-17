-- Auto-generated seed data
-- Generated at: 2026-06-16T19:46:27.657Z

-- Users
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin User', 'admin@portauthority.gov.in', '$2b$10$HlBqgGQR0Q.Bg2PxwfWsweugodf/fibkJMKLPnoDf.Pofpn3MOvHS', 'admin'),
  ('Analyst User', 'analyst@portauthority.gov.in', '$2b$10$0UkT0u4UenJMZqQl5hCyNOdOClRWgEl2Hn9QACD8RrNMI1K5C.KZm', 'analyst'),
  ('Viewer User', 'viewer@portauthority.gov.in', '$2b$10$E8DRDa8ZwFyrGvI2CQJNd.vAOMmreC7Yqb6KjINnCWEsZMOJOmCL.', 'viewer')
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
