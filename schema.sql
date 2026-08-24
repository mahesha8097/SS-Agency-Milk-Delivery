-- S.S Agency - Nandini Milk Delivery Management Schema
-- Database: Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (Admin & Delivery Boys)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'DELIVERY_BOY')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  username TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Delivery Routes table
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  assigned_delivery_boy_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  house_number TEXT NOT NULL,
  location TEXT NOT NULL,
  route_id UUID REFERENCES routes(id) ON DELETE RESTRICT,
  delivery_boy_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  payment_type TEXT NOT NULL DEFAULT 'MONTHLY_ADVANCE' CHECK (payment_type IN ('MONTHLY_ADVANCE', 'DAILY_CASH', 'WEEKLY')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('MILK', 'CURD')),
  packet_size_ml INT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Customer Default Product Requirements table
CREATE TABLE IF NOT EXISTS customer_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  default_packets INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, product_id)
);

-- 6. Daily Deliveries table
CREATE TABLE IF NOT EXISTS daily_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE NOT NULL,
  delivery_date DATE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  delivery_boy_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  route_id UUID REFERENCES routes(id) ON DELETE RESTRICT,
  total_milk_litres NUMERIC(6, 2) NOT NULL DEFAULT 0,
  total_curd_packets INT NOT NULL DEFAULT 0,
  product_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('DELIVERED', 'SKIPPED_BY_CUSTOMER', 'CUSTOMER_UNAVAILABLE', 'DELIVERY_ISSUE')),
  remarks TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, delivery_date)
);

-- 7. Delivery Items (Preserves rate at time of delivery)
CREATE TABLE IF NOT EXISTS delivery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES daily_deliveries(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  packet_size_ml INT NOT NULL,
  packets_count INT NOT NULL DEFAULT 0,
  actual_quantity_litres NUMERIC(6, 2) NOT NULL DEFAULT 0,
  price_per_unit NUMERIC(10, 2) NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'UPI', 'BANK')),
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Monthly Invoices table
CREATE TABLE IF NOT EXISTS monthly_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  month_year VARCHAR(7) NOT NULL,
  total_product_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_delivery_charges NUMERIC(10, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  previous_balance_credit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  advance_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  amount_payable NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'GENERATED' CHECK (status IN ('DRAFT', 'GENERATED', 'PAID', 'PARTIALLY_PAID')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, month_year)
);

-- 10. Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_customers_route ON customers(route_id);
CREATE INDEX IF NOT EXISTS idx_customers_delivery_boy ON customers(delivery_boy_id);
CREATE INDEX IF NOT EXISTS idx_daily_deliveries_date ON daily_deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_daily_deliveries_customer ON daily_deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin Policy: Full Access to all tables
CREATE POLICY admin_full_access ON users FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
CREATE POLICY admin_customers ON customers FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
CREATE POLICY admin_deliveries ON daily_deliveries FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Delivery Boy Policy: Access restricted to assigned customers and routes
CREATE POLICY dboy_read_customers ON customers FOR SELECT USING (
  delivery_boy_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);
CREATE POLICY dboy_insert_deliveries ON daily_deliveries FOR INSERT WITH CHECK (
  delivery_boy_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);
CREATE POLICY dboy_select_deliveries ON daily_deliveries FOR SELECT USING (
  delivery_boy_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);
