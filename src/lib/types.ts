// Types for S.S Agency - Nandini Milk Delivery Management

export type UserRole = 'ADMIN' | 'DELIVERY_BOY';

export interface AppUser {
  id: string;
  auth_id?: string;
  name: string;
  phone: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  username?: string;
  password?: string;
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  name: string; // e.g. "Route 1: Orchid Enclave"
  description?: string;
  assigned_delivery_boy_id?: string;
  created_at: string;
  updated_at: string;
}

export type PaymentType = 'MONTHLY_ADVANCE' | 'DAILY_CASH' | 'WEEKLY';
export type CustomerCategory = 'RESIDENTIAL' | 'BULK_ORDER';

export interface Customer {
  id: string;
  customer_code: string; // e.g. C001
  name: string;
  phone: string;
  house_number: string; // e.g. A-103 or Building
  location: string; // e.g. Orchid Enclave
  route_id: string;
  delivery_boy_id: string;
  payment_type: PaymentType;
  customer_category?: CustomerCategory; // RESIDENTIAL | BULK_ORDER
  establishment_type?: string; // Hotel, Restaurant, School, Caterer, Office, Canteen
  is_bulk_order?: boolean; // If true, delivery charge is ₹0
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ProductCategory = 'MILK' | 'CURD';

export interface Product {
  id: string;
  product_code: string;
  name: string; // e.g. "Blue Milk 1L", "Blue Milk 500ml", "Curd 1L"
  category: ProductCategory;
  packet_size_ml: number; // 1000 or 500
  price: number;
  active: boolean;
  icon?: string; // Optional custom Lucide icon key
  image_url?: string; // Optional custom product image URL or Base64 string
  created_at: string;
  updated_at: string;
}

export interface CustomerProductRequirement {
  id: string;
  customer_id: string;
  product_id: string;
  default_packets: number;
  created_at: string;
}

export type DeliveryStatus =
  | 'DELIVERED'
  | 'SKIPPED_BY_CUSTOMER'
  | 'CUSTOMER_UNAVAILABLE'
  | 'DELIVERY_ISSUE';

export interface DailyDelivery {
  id: string;
  idempotency_key: string;
  delivery_date: string; // YYYY-MM-DD
  customer_id: string;
  delivery_boy_id: string;
  route_id: string;
  total_milk_litres: number;
  total_curd_packets: number;
  product_total: number;
  delivery_charge: number;
  grand_total: number;
  status: DeliveryStatus;
  remarks?: string;
  created_by?: string;
  is_offline_synced?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryItem {
  id: string;
  delivery_id: string;
  product_id: string;
  product_name: string;
  category: ProductCategory;
  packet_size_ml: number;
  packets_count: number;
  actual_quantity_litres: number;
  price_per_unit: number; // Rate at time of delivery
  total_amount: number;
  created_at: string;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK';

export interface Payment {
  id: string;
  customer_id: string;
  payment_date: string; // YYYY-MM-DD
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export type BillingPeriod = 'MONTHLY' | 'WEEKLY';

export interface MonthlyInvoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  month_year: string; // YYYY-MM or YYYY-MM-W1
  billing_period?: BillingPeriod; // MONTHLY or WEEKLY
  period_label?: string; // e.g. "Week 1 (1-7 Aug 2026)"
  date_start?: string;
  date_end?: string;
  total_product_amount: number;
  total_delivery_charges: number;
  grand_total: number;
  previous_balance_credit: number;
  advance_paid: number;
  amount_payable: number;
  status: 'DRAFT' | 'GENERATED' | 'PAID' | 'PARTIALLY_PAID';
  generated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  created_at: string;
}
