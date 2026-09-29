-- Multi-Admin Nandini Milk Management System Schema
-- Database: PostgreSQL / Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (Admin & Delivery Boys)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for independent Admin, points to Admin for Delivery Boy
  auth_id UUID UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'DELIVERY_BOY')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  username TEXT NOT NULL,
  password_hash TEXT,
  mobile_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_admin_username_unique UNIQUE (admin_id, username)
);

-- 2. Shop & Agency Profile Settings
CREATE TABLE IF NOT EXISTS shop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  address TEXT NOT NULL,
  logo_url TEXT,
  invoice_prefix TEXT DEFAULT 'SS',
  footer_message TEXT DEFAULT 'Thank you for choosing Nandini Milk Delivery!',
  milk_500ml_charge NUMERIC(6, 2) NOT NULL DEFAULT 2.00,
  milk_1l_charge NUMERIC(6, 2) NOT NULL DEFAULT 3.00,
  curd_first_packet_charge NUMERIC(6, 2) NOT NULL DEFAULT 2.00,
  curd_additional_packet_charge NUMERIC(6, 2) NOT NULL DEFAULT 1.00,
  allow_auto_recalculation BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Delivery Routes table
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  assigned_delivery_boy_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_code TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  house_number TEXT,
  location TEXT,
  landmark TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  customer_type TEXT NOT NULL DEFAULT 'HOUSE' CHECK (customer_type IN ('HOUSE', 'BULK')),
  business_name TEXT,
  payment_type TEXT NOT NULL DEFAULT 'PREPAID' CHECK (payment_type IN ('PREPAID', 'POSTPAID')),
  assigned_delivery_boy_id UUID REFERENCES users(id) ON DELETE SET NULL,
  delivery_order INT DEFAULT 0,
  opening_credit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  opening_pending NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT customers_admin_code_unique UNIQUE (admin_id, customer_code)
);

-- 5. Products table (Configurable by Admin with historical price safety)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  packet_size_ml INT NOT NULL DEFAULT 1000,
  unit TEXT NOT NULL DEFAULT '1L',
  price NUMERIC(10, 2) NOT NULL,
  delivery_charge_applicable BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  icon TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT products_admin_code_unique UNIQUE (admin_id, product_code)
);

-- 6. Customer Product Requirements (Subscription with Effective Dates)
CREATE TABLE IF NOT EXISTS customer_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 1,
  unit TEXT,
  frequency TEXT DEFAULT 'DAILY',
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Daily Deliveries table
CREATE TABLE IF NOT EXISTS daily_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idempotency_key TEXT UNIQUE NOT NULL,
  delivery_date DATE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  delivery_boy_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  delivered_at TEXT,
  total_milk_litres NUMERIC(6, 2) NOT NULL DEFAULT 0,
  total_curd_packets INT NOT NULL DEFAULT 0,
  product_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('DELIVERED', 'SKIPPED', 'SKIPPED_BY_CUSTOMER', 'CUSTOMER_UNAVAILABLE', 'ROUTE_ISSUE', 'OTHER', 'DELIVERY_ISSUE')),
  skip_reason TEXT,
  remarks TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT daily_deliveries_unique_customer_date UNIQUE (admin_id, customer_id, delivery_date)
);

-- 8. Delivery Items (Historical rate snapshot preservation)
CREATE TABLE IF NOT EXISTS delivery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES daily_deliveries(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  packet_size_ml INT NOT NULL,
  packets_count INT NOT NULL DEFAULT 0,
  actual_quantity_litres NUMERIC(6, 2) NOT NULL DEFAULT 0,
  price_per_unit NUMERIC(10, 2) NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  is_extra BOOLEAN DEFAULT false,
  extra_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Payments table (Supports voiding with reason, Advance/Credit)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  bill_id UUID,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'UPI', 'BANK', 'OTHER')),
  reference_number TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'VOIDED')),
  void_reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Expenses (Admin only, supports voiding)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  amount NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_to TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'UPI', 'BANK', 'OTHER')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'VOIDED')),
  void_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Monthly Invoices / Bills (Non-GST, actual delivery based, credit carry-forward)
CREATE TABLE IF NOT EXISTS monthly_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  month_year TEXT NOT NULL,
  billing_period TEXT,
  billing_type TEXT NOT NULL DEFAULT 'PREPAID' CHECK (billing_type IN ('PREPAID', 'POSTPAID')),
  date_start DATE,
  date_end DATE,
  total_product_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_delivery_charges NUMERIC(10, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  previous_pending NUMERIC(10, 2) NOT NULL DEFAULT 0,
  previous_balance_credit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  advance_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_payable NUMERIC(10, 2) NOT NULL DEFAULT 0,
  remaining_pending NUMERIC(10, 2) NOT NULL DEFAULT 0,
  remaining_credit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'GENERATED' CHECK (status IN ('DRAFT', 'GENERATED', 'PARTIALLY_PAID', 'PAID')),
  balance_status TEXT DEFAULT 'NONE' CHECK (balance_status IN ('NONE', 'PENDING', 'CREDIT')),
  recalculation_required BOOLEAN DEFAULT false,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT monthly_invoices_admin_cust_month_unique UNIQUE (admin_id, customer_id, month_year)
);

-- 13. Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for optimal multi-tenant query performance
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(admin_id);
CREATE INDEX IF NOT EXISTS idx_customers_admin ON customers(admin_id);
CREATE INDEX IF NOT EXISTS idx_customers_delivery_boy ON customers(assigned_delivery_boy_id);
CREATE INDEX IF NOT EXISTS idx_products_admin ON products(admin_id);
CREATE INDEX IF NOT EXISTS idx_daily_deliveries_admin_date ON daily_deliveries(admin_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_daily_deliveries_boy ON daily_deliveries(delivery_boy_id);
CREATE INDEX IF NOT EXISTS idx_payments_admin_customer ON payments(admin_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_admin_date ON expenses(admin_id, date);
CREATE INDEX IF NOT EXISTS idx_invoices_admin_month ON monthly_invoices(admin_id, month_year);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS & POLICIES
-- -------------------------------------------------------------------------

-- 1. Helper function: Get Current User's Admin ID
CREATE OR REPLACE FUNCTION current_admin_id()
RETURNS UUID AS $$
  SELECT admin_id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Helper function: Get Current User's Internal ID
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Helper function: Check if Current User is Admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE auth_id = auth.uid() AND role = 'ADMIN' AND status = 'ACTIVE'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- -------------------------------------------------------------------------
-- POLICIES: users Table
-- -------------------------------------------------------------------------
CREATE POLICY "Admin full access to own tenant users"
  ON users FOR ALL TO authenticated
  USING (admin_id = current_admin_id() OR id = current_user_id())
  WITH CHECK (admin_id = current_admin_id() AND is_admin());

-- -------------------------------------------------------------------------
-- POLICIES: shop_settings Table (Admin Only)
-- -------------------------------------------------------------------------
CREATE POLICY "Admin full access to own shop settings"
  ON shop_settings FOR ALL TO authenticated
  USING (admin_id = current_admin_id() AND is_admin())
  WITH CHECK (admin_id = current_admin_id() AND is_admin());

CREATE POLICY "Delivery boy read shop settings for branding"
  ON shop_settings FOR SELECT TO authenticated
  USING (admin_id = current_admin_id());

-- -------------------------------------------------------------------------
-- POLICIES: routes Table
-- -------------------------------------------------------------------------
CREATE POLICY "Admin full access to routes"
  ON routes FOR ALL TO authenticated
  USING (admin_id = current_admin_id() AND is_admin())
  WITH CHECK (admin_id = current_admin_id() AND is_admin());

CREATE POLICY "Delivery boy view assigned routes"
  ON routes FOR SELECT TO authenticated
  USING (admin_id = current_admin_id() AND (assigned_delivery_boy_id = current_user_id() OR is_admin()));

-- -------------------------------------------------------------------------
-- POLICIES: customers Table (Cross-Admin Isolated & Delivery Boy Filtered)
-- -------------------------------------------------------------------------
CREATE POLICY "Admin full access to customers"
  ON customers FOR ALL TO authenticated
  USING (admin_id = current_admin_id() AND is_admin())
  WITH CHECK (admin_id = current_admin_id() AND is_admin());

CREATE POLICY "Delivery boy view assigned customers only"
  ON customers FOR SELECT TO authenticated
  USING (
    admin_id = current_admin_id() 
    AND assigned_delivery_boy_id = current_user_id()
  );

-- -------------------------------------------------------------------------
-- POLICIES: products & customer_products Table
-- -------------------------------------------------------------------------
CREATE POLICY "Admin full access to products"
  ON products FOR ALL TO authenticated
  USING (admin_id = current_admin_id())
  WITH CHECK (admin_id = current_admin_id() AND is_admin());

CREATE POLICY "Delivery boy read products"
  ON products FOR SELECT TO authenticated
  USING (admin_id = current_admin_id());

CREATE POLICY "Admin full access to customer products"
  ON customer_products FOR ALL TO authenticated
  USING (admin_id = current_admin_id() AND is_admin())
  WITH CHECK (admin_id = current_admin_id() AND is_admin());

CREATE POLICY "Delivery boy read customer products for assigned customers"
  ON customer_products FOR SELECT TO authenticated
  USING (
    admin_id = current_admin_id()
    AND customer_id IN (SELECT id FROM customers WHERE assigned_delivery_boy_id = current_user_id())
  );

-- -------------------------------------------------------------------------
-- POLICIES: daily_deliveries & delivery_items
-- -------------------------------------------------------------------------
CREATE POLICY "Admin full access to daily deliveries"
  ON daily_deliveries FOR ALL TO authenticated
  USING (admin_id = current_admin_id() AND is_admin())
  WITH CHECK (admin_id = current_admin_id() AND is_admin());

CREATE POLICY "Delivery boy manage assigned daily deliveries"
  ON daily_deliveries FOR ALL TO authenticated
  USING (
    admin_id = current_admin_id() 
    AND delivery_boy_id = current_user_id()
  )
  WITH CHECK (
    admin_id = current_admin_id() 
    AND delivery_boy_id = current_user_id()
  );

CREATE POLICY "Admin full access to delivery items"
  ON delivery_items FOR ALL TO authenticated
  USING (
    delivery_id IN (SELECT id FROM daily_deliveries WHERE admin_id = current_admin_id())
  )
  WITH CHECK (
    delivery_id IN (SELECT id FROM daily_deliveries WHERE admin_id = current_admin_id())
  );

CREATE POLICY "Delivery boy manage assigned delivery items"
  ON delivery_items FOR ALL TO authenticated
  USING (
    delivery_id IN (SELECT id FROM daily_deliveries WHERE delivery_boy_id = current_user_id())
  )
  WITH CHECK (
    delivery_id IN (SELECT id FROM daily_deliveries WHERE delivery_boy_id = current_user_id())
  );

-- -------------------------------------------------------------------------
-- POLICIES: payments, invoices, expenses (STRICTLY ADMIN ONLY)
-- -------------------------------------------------------------------------
CREATE POLICY "Admin only access to payments"
  ON payments FOR ALL TO authenticated
  USING (admin_id = current_admin_id() AND is_admin())
  WITH CHECK (admin_id = current_admin_id() AND is_admin());

CREATE POLICY "Admin only access to expense categories"
  ON expense_categories FOR ALL TO authenticated
  USING (admin_id = current_admin_id() AND is_admin())
  WITH CHECK (admin_id = current_admin_id() AND is_admin());

CREATE POLICY "Admin only access to expenses"
  ON expenses FOR ALL TO authenticated
  USING (admin_id = current_admin_id() AND is_admin())
  WITH CHECK (admin_id = current_admin_id() AND is_admin());

CREATE POLICY "Admin only access to monthly invoices"
  ON monthly_invoices FOR ALL TO authenticated
  USING (admin_id = current_admin_id() AND is_admin())
  WITH CHECK (admin_id = current_admin_id() AND is_admin());

CREATE POLICY "Admin only access to audit logs"
  ON audit_logs FOR ALL TO authenticated
  USING (admin_id = current_admin_id() AND is_admin())
  WITH CHECK (admin_id = current_admin_id() AND is_admin());


