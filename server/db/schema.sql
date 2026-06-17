-- Drop existing tables
DROP TABLE IF EXISTS port_statistics CASCADE;
DROP TABLE IF EXISTS report_rows_staging CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS operating_expenses CASCADE;
DROP TABLE IF EXISTS revenue_category_map CASCADE;
DROP TABLE IF EXISTS cargo_category_map CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('viewer', 'analyst', 'admin')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  year INTEGER NOT NULL,
  original_filename VARCHAR(512),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  row_count INTEGER DEFAULT 0,
  total_revenue_preview NUMERIC(18,2) DEFAULT 0,
  date_range_start DATE,
  date_range_end DATE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT
);

CREATE TABLE report_rows_staging (
  id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
  invoice_date DATE,
  invoice_amount NUMERIC(18,2) DEFAULT 0,
  sor_amount NUMERIC(18,2) DEFAULT 0,
  discount_amount NUMERIC(18,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  exchange_rate NUMERIC(12,4) DEFAULT 1,
  amount_inr NUMERIC(18,2) DEFAULT 0,
  party_name VARCHAR(512) DEFAULT 'Unknown',
  party_code VARCHAR(100),
  vessel_name VARCHAR(512) DEFAULT 'Not Available',
  vessel_type VARCHAR(255),
  charge_name VARCHAR(512),
  invoice_group VARCHAR(255),
  sub_group VARCHAR(255),
  account_code VARCHAR(100),
  commodity VARCHAR(255),
  commodity_group VARCHAR(255),
  sor_commodity VARCHAR(255),
  grt NUMERIC(12,2) DEFAULT 0,
  unit_quantity1 NUMERIC(14,4) DEFAULT 0,
  unit_quantity2 NUMERIC(14,4) DEFAULT 0,
  unit_rate NUMERIC(14,4) DEFAULT 0,
  vcn VARCHAR(100),
  berth VARCHAR(100),
  voyage_type VARCHAR(100),
  voyage_no VARCHAR(100),
  invoice_no VARCHAR(100),
  nature_of_ship VARCHAR(255),
  reference_no VARCHAR(255),
  year INTEGER
);

CREATE TABLE port_statistics (
  id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
  invoice_date DATE,
  invoice_amount NUMERIC(18,2) DEFAULT 0,
  sor_amount NUMERIC(18,2) DEFAULT 0,
  discount_amount NUMERIC(18,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  exchange_rate NUMERIC(12,4) DEFAULT 1,
  amount_inr NUMERIC(18,2) DEFAULT 0,
  party_name VARCHAR(512) DEFAULT 'Unknown',
  party_code VARCHAR(100),
  vessel_name VARCHAR(512) DEFAULT 'Not Available',
  vessel_type VARCHAR(255),
  charge_name VARCHAR(512),
  invoice_group VARCHAR(255),
  sub_group VARCHAR(255),
  account_code VARCHAR(100),
  commodity VARCHAR(255),
  commodity_group VARCHAR(255),
  sor_commodity VARCHAR(255),
  grt NUMERIC(12,2) DEFAULT 0,
  unit_quantity1 NUMERIC(14,4) DEFAULT 0,
  unit_quantity2 NUMERIC(14,4) DEFAULT 0,
  unit_rate NUMERIC(14,4) DEFAULT 0,
  vcn VARCHAR(100),
  berth VARCHAR(100),
  voyage_type VARCHAR(100),
  voyage_no VARCHAR(100),
  invoice_no VARCHAR(100),
  nature_of_ship VARCHAR(255),
  reference_no VARCHAR(255),
  year INTEGER
);

CREATE TABLE revenue_category_map (
  id SERIAL PRIMARY KEY,
  raw_value VARCHAR(512) NOT NULL,
  field_source VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Other'
);

CREATE TABLE cargo_category_map (
  id SERIAL PRIMARY KEY,
  raw_value VARCHAR(512) NOT NULL,
  field_source VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Other'
);

CREATE TABLE operating_expenses (
  id SERIAL PRIMARY KEY,
  year INTEGER UNIQUE NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  entered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  entered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_port_stats_year ON port_statistics(year);
CREATE INDEX idx_port_stats_invoice_date ON port_statistics(invoice_date);
CREATE INDEX idx_port_stats_party ON port_statistics(party_name);
CREATE INDEX idx_port_stats_commodity_group ON port_statistics(commodity_group);
CREATE INDEX idx_staging_report_id ON report_rows_staging(report_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_uploaded_by ON reports(uploaded_by);
