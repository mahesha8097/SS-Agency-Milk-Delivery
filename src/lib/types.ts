// Types for Multi-Admin Nandini Milk Delivery Management System

export type UserRole = 'ADMIN' | 'DELIVERY_BOY';

export interface AppUser {
  id: string;
  admin_id?: string; // For Delivery Boy, points to parent Admin ID. For Admin, matches self id.
  auth_id?: string;
  name: string;
  phone: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  username: string;
  password?: string; // Securely hashed in storage
  mobile_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export type CustomerType = 'HOUSE' | 'BULK';
export type PaymentType = 'PREPAID' | 'POSTPAID' | 'WEEKLY' | 'MONTHLY_ADVANCE';
export type CustomerCategory = 'RESIDENTIAL' | 'BULK_ORDER';
export type BillingType = 'PREPAID' | 'POSTPAID' | 'WEEKLY' | 'MONTHLY_ADVANCE';

export interface Customer {
  id: string;
  admin_id: string; // Enforces strict Admin isolation
  customer_code: string; // e.g. C001
  name: string;
  phone: string;
  address: string;
  house_number?: string;
  location?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  customer_type: CustomerType;
  business_name?: string; // For Bulk customers (Hotel, Restaurant, School, etc.)
  establishment_type?: string; // For Bulk customers
  payment_type: PaymentType;
  billing_type?: BillingType;
  customer_category?: CustomerCategory;
  is_bulk_order?: boolean;
  bulk_billing_cycle?: 'WEEKLY' | 'MONTHLY';
  assigned_delivery_boy_id?: string;
  delivery_boy_id?: string; // Backward compat alias
  route_id?: string;
  delivery_order?: number; // Sorting order on delivery route
  opening_credit: number;
  opening_pending: number;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ProductCategory = 'MILK' | 'CURD' | 'BUTTERMILK' | 'PANEER' | 'GHEE' | 'SWEETS' | 'OTHER';

export interface Product {
  id: string;
  admin_id: string;
  product_code: string;
  name: string; // e.g. "Special Milk 1L", "Curd 500g"
  category: string;
  packet_size_ml: number; // e.g. 500, 1000, 200
  unit: string; // e.g. '1L', '500ml', '500g', 'Packet', 'Bottle'
  price: number;
  delivery_charge_applicable: boolean; // Configurable per product
  active: boolean;
  icon?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerProductRequirement {
  id: string;
  admin_id: string;
  customer_id: string;
  product_id: string;
  quantity: number; // Packets or units count
  default_packets: number; // Backward compat alias
  unit?: string;
  frequency?: 'DAILY' | 'ALTERNATE' | 'WEEKDAYS' | 'CUSTOM';
  effective_from: string; // YYYY-MM-DD
  effective_to?: string; // YYYY-MM-DD
  status?: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export type DeliveryStatus =
  | 'DELIVERED'
  | 'SKIPPED'
  | 'SKIPPED_BY_CUSTOMER'
  | 'CUSTOMER_UNAVAILABLE'
  | 'ROUTE_ISSUE'
  | 'OTHER'
  | 'DELIVERY_ISSUE';

export interface DeliveryItem {
  id: string;
  delivery_id: string;
  product_id: string;
  product_name: string;
  category: string;
  packet_size_ml: number;
  packets_count: number;
  actual_quantity_litres: number;
  price_per_unit: number; // Snapshot of rate at time of delivery
  total_amount: number;
  is_extra?: boolean; // If added as temporary extra product for today
  extra_reason?: string;
  created_at: string;
}

export interface DailyDelivery {
  id: string;
  admin_id: string;
  idempotency_key: string;
  delivery_date: string; // YYYY-MM-DD
  customer_id: string;
  delivery_boy_id: string;
  route_id?: string;
  delivered_at?: string; // Exact delivery timestamp e.g. "06:42 AM" or ISO string
  total_milk_litres: number;
  total_curd_packets: number;
  product_total: number;
  delivery_charge: number;
  grand_total: number;
  status: DeliveryStatus;
  skip_reason?: string;
  remarks?: string;
  notes?: string;
  total_litres?: number;
  total_packets?: number;
  created_by?: string;
  is_offline_synced?: boolean;
  items?: DeliveryItem[];
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK' | 'OTHER';

export interface Payment {
  id: string;
  admin_id: string;
  customer_id: string;
  bill_id?: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string; // YYYY-MM-DD
  reference_number?: string;
  notes?: string;
  billing_month?: string; // e.g. YYYY-MM
  status: 'ACTIVE' | 'VOIDED';
  void_reason?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface ExpenseCategory {
  id: string;
  admin_id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface Expense {
  id: string;
  admin_id: string;
  category_id: string;
  category_name?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paid_to: string;
  payment_method: PaymentMethod;
  description?: string;
  status: 'ACTIVE' | 'VOIDED';
  void_reason?: string;
  created_at: string;
  updated_at: string;
}

export type BillStatus = 'DRAFT' | 'GENERATED' | 'PARTIALLY_PAID' | 'PAID';
export type BalanceStatus = 'NONE' | 'PENDING' | 'CREDIT';
export type BillingPeriod = 'MONTHLY' | 'WEEKLY';

export interface BillItem {
  id: string;
  bill_id: string;
  product_id: string;
  product_name: string;
  unit: string;
  quantity: number;
  price_per_unit: number; // Historical rate snapshot
  total_amount: number;
}

export interface MonthlyInvoice {
  id: string;
  admin_id: string;
  invoice_number: string;
  customer_id: string;
  month_year: string; // YYYY-MM
  billing_period?: string; // e.g. "August 2026" or 'MONTHLY' | 'WEEKLY'
  billing_type?: BillingType;
  date_start?: string;
  date_end?: string;
  period_label?: string;
  total_product_amount: number;
  total_delivery_charges: number;
  grand_total: number; // Product amount + delivery charges
  previous_pending?: number;
  previous_balance_credit: number; // Previous credit applied
  previous_credit?: number; // Alias for previous_balance_credit
  advance_paid: number; // Total payments allocated to this cycle
  payment_received?: number; // Alias
  total_payable?: number; // Net amount payable
  remaining_pending?: number;
  remaining_credit?: number;
  amount_payable: number; // Payable amount
  extra_amount_to_pay?: number;
  next_month_estimate?: number;
  next_month_amount_to_pay?: number;
  status: BillStatus;
  balance_status?: BalanceStatus;
  recalculation_required?: boolean;
  items?: BillItem[];
  generated_at: string;
  updated_at?: string;
}

export interface Route {
  id: string;
  admin_id?: string;
  name: string;
  description?: string;
  assigned_delivery_boy_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerLedgerEntry {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number; // Balance display formatted in UI
}

export interface ShopSettings {
  id: string;
  admin_id: string;
  shop_name: string;
  admin_name: string;
  phone: string;
  alternate_phone?: string;
  address: string;
  logo_url?: string;
  invoice_prefix: string;
  footer_message?: string;
  // Delivery Charge configuration
  milk_500ml_charge: number; // default ₹2
  milk_1L_charge: number; // default ₹3
  curd_first_packet_charge: number; // default ₹2
  curd_additional_packet_charge: number; // default ₹1
  allow_auto_recalculation?: boolean;
  updated_at: string;
}

// Backward compatibility alias for profile
export interface AgencyProfile {
  id?: string;
  admin_id?: string;
  business_name: string;
  shop_name?: string;
  name?: string;
  phone: string;
  alternate_phone?: string;
  email: string;
  account_beginning_date?: string;
  business_type?: string;
  business_category?: string;
  state?: string;
  pincode?: string;
  address: string;
  logo_url?: string;
  signature_url?: string;
  payment_qr_url?: string;
  invoice_prefix?: string;
  terms_conditions?: string;
  footer_message?: string;
  milk_500ml_charge?: number;
  milk_1L_charge?: number;
  curd_first_packet_charge?: number;
  curd_additional_packet_charge?: number;
}

export interface AuditLog {
  id: string;
  admin_id?: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  created_at: string;
}

