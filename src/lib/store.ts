// Central Data Store & Service Layer for S.S Agency Milk Delivery
import {
  AppUser,
  Route,
  Customer,
  Product,
  CustomerProductRequirement,
  DailyDelivery,
  DeliveryItem,
  Payment,
  MonthlyInvoice,
  AuditLog,
  DeliveryStatus,
} from './types';
import { calculateDeliveryTotals, calculateMonthlyInvoiceSummary } from './calculations';
import { queueOfflineDelivery, getPendingOfflineDeliveries, markDeliverySynced } from './offlineSync';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'ss_agency_store_v1';

export interface StoreData {
  users: AppUser[];
  routes: Route[];
  customers: Customer[];
  products: Product[];
  customerProducts: CustomerProductRequirement[];
  deliveries: DailyDelivery[];
  deliveryItems: DeliveryItem[];
  payments: Payment[];
  invoices: MonthlyInvoice[];
  auditLogs: AuditLog[];
  currentUser: AppUser | null;
}

// Initial Sample Seed Data with Valid Hexadecimal PostgreSQL UUIDs
export const INITIAL_PRODUCTS: Product[] = [
  { id: '20000000-0000-0000-0000-000000000001', product_code: 'BM1', name: 'Blue Milk 1L', category: 'MILK', packet_size_ml: 1000, price: 44, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '20000000-0000-0000-0000-000000000002', product_code: 'BM5', name: 'Blue Milk 500ml', category: 'MILK', packet_size_ml: 500, price: 23, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '20000000-0000-0000-0000-000000000003', product_code: 'OM1', name: 'Orange Milk 1L', category: 'MILK', packet_size_ml: 1000, price: 52, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '20000000-0000-0000-0000-000000000004', product_code: 'OM5', name: 'Orange Milk 500ml', category: 'MILK', packet_size_ml: 500, price: 27, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '20000000-0000-0000-0000-000000000005', product_code: 'SM1', name: 'Special Milk 1L', category: 'MILK', packet_size_ml: 1000, price: 48, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '20000000-0000-0000-0000-000000000006', product_code: 'SM5', name: 'Special Milk 500ml', category: 'MILK', packet_size_ml: 500, price: 25, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '20000000-0000-0000-0000-000000000007', product_code: 'CD1', name: 'Curd 1L', category: 'CURD', packet_size_ml: 1000, price: 55, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const INITIAL_USERS: AppUser[] = [
  { id: '30000000-0000-0000-0000-000000000001', name: 'S.S Agency Admin', phone: '9876543210', role: 'ADMIN', status: 'ACTIVE', username: 'admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '30000000-0000-0000-0000-000000000002', name: 'Delivery Boy 1 (Ramesh)', phone: '9876543211', role: 'DELIVERY_BOY', status: 'ACTIVE', username: 'boy1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '30000000-0000-0000-0000-000000000003', name: 'Delivery Boy 2 (Suresh)', phone: '9876543212', role: 'DELIVERY_BOY', status: 'ACTIVE', username: 'boy2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const INITIAL_ROUTES: Route[] = [
  { id: '40000000-0000-0000-0000-000000000001', name: 'Route 1 - Orchid Enclave & Janapriya', description: 'Includes Orchid Enclave and Janapriya apartments', assigned_delivery_boy_id: '30000000-0000-0000-0000-000000000002', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '40000000-0000-0000-0000-000000000002', name: 'Route 2 - Wasthoboomi Sunshine', description: 'Includes Wasthoboomi Sunshine complex', assigned_delivery_boy_id: '30000000-0000-0000-0000-000000000003', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: '10000000-0000-0000-0000-000000000001', customer_code: 'C001', name: 'Ravi Kumar', phone: '9845012345', house_number: 'A-103', location: 'Orchid Enclave', route_id: '40000000-0000-0000-0000-000000000001', delivery_boy_id: '30000000-0000-0000-0000-000000000002', payment_type: 'MONTHLY_ADVANCE', status: 'ACTIVE', notes: 'Leave at front door box', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '10000000-0000-0000-0000-000000000002', customer_code: 'C002', name: 'Suresh Gowda', phone: '9845012346', house_number: 'B-204', location: 'Janapriya', route_id: '40000000-0000-0000-0000-000000000001', delivery_boy_id: '30000000-0000-0000-0000-000000000002', payment_type: 'MONTHLY_ADVANCE', status: 'ACTIVE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '10000000-0000-0000-0000-000000000003', customer_code: 'C003', name: 'Priya Sharma', phone: '9845012347', house_number: 'C-305', location: 'Wasthoboomi Sunshine', route_id: '40000000-0000-0000-0000-000000000002', delivery_boy_id: '30000000-0000-0000-0000-000000000003', payment_type: 'MONTHLY_ADVANCE', status: 'ACTIVE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '10000000-0000-0000-0000-000000000004', customer_code: 'C004', name: 'Mahesh Reddy', phone: '9845012348', house_number: 'D-401', location: 'Wasthoboomi Sunshine', route_id: '40000000-0000-0000-0000-000000000002', delivery_boy_id: '30000000-0000-0000-0000-000000000003', payment_type: 'MONTHLY_ADVANCE', status: 'ACTIVE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const INITIAL_CUSTOMER_PRODUCTS: CustomerProductRequirement[] = [
  { id: '50000000-0000-0000-0000-000000000001', customer_id: '10000000-0000-0000-0000-000000000001', product_id: '20000000-0000-0000-0000-000000000001', default_packets: 1, created_at: new Date().toISOString() },
  { id: '50000000-0000-0000-0000-000000000002', customer_id: '10000000-0000-0000-0000-000000000001', product_id: '20000000-0000-0000-0000-000000000004', default_packets: 1, created_at: new Date().toISOString() },
  { id: '50000000-0000-0000-0000-000000000003', customer_id: '10000000-0000-0000-0000-000000000001', product_id: '20000000-0000-0000-0000-000000000007', default_packets: 1, created_at: new Date().toISOString() },
  { id: '50000000-0000-0000-0000-000000000004', customer_id: '10000000-0000-0000-0000-000000000002', product_id: '20000000-0000-0000-0000-000000000002', default_packets: 2, created_at: new Date().toISOString() },
  { id: '50000000-0000-0000-0000-000000000005', customer_id: '10000000-0000-0000-0000-000000000003', product_id: '20000000-0000-0000-0000-000000000003', default_packets: 1, created_at: new Date().toISOString() },
  { id: '50000000-0000-0000-0000-000000000006', customer_id: '10000000-0000-0000-0000-000000000004', product_id: '20000000-0000-0000-0000-000000000001', default_packets: 2, created_at: new Date().toISOString() },
];



class Store {
  private data: StoreData = {
    users: INITIAL_USERS,
    routes: INITIAL_ROUTES,
    customers: INITIAL_CUSTOMERS,
    products: INITIAL_PRODUCTS,
    customerProducts: INITIAL_CUSTOMER_PRODUCTS,
    deliveries: [],
    deliveryItems: [],
    payments: [],
    invoices: [],
    auditLogs: [],
    currentUser: INITIAL_USERS[0], // Default logged in as admin
  };

  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
      this.initAutoSync();
      this.fetchLiveCloudData();
      setInterval(() => {
        this.fetchLiveCloudData();
      }, 5000);
    }
  }


  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.saveToStorage();
    this.listeners.forEach((l) => l());
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
      } else {
        this.seedDemoData();
      }
    } catch (e) {
      console.error('Failed to load local store', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save local store', e);
    }
  }

  public seedDemoData() {
    this.data.users = INITIAL_USERS;
    this.data.routes = INITIAL_ROUTES;
    this.data.customers = INITIAL_CUSTOMERS;
    this.data.products = INITIAL_PRODUCTS;
    this.data.customerProducts = INITIAL_CUSTOMER_PRODUCTS;
    this.data.deliveries = [];
    this.data.deliveryItems = [];
    this.data.payments = [
      {
        id: 'pay1',
        customer_id: 'c1',
        payment_date: '2026-08-01',
        amount: 2000,
        payment_method: 'UPI',
        reference_number: 'UPI987654321',
        notes: 'Monthly advance for August 2026',
        created_by: 'u-admin',
        created_at: new Date().toISOString(),
      },
    ];
    this.data.invoices = [];
    this.data.auditLogs = [
      {
        id: 'log1',
        user_id: 'u-admin',
        user_name: 'S.S Agency Admin',
        action: 'SYSTEM_INIT',
        entity_type: 'SYSTEM',
        details: { message: 'Initialized S.S Agency Milk Delivery System' },
        created_at: new Date().toISOString(),
      },
    ];
    this.notify();
  }

  // --- Auth Methods ---
  public login(username: string, role: 'ADMIN' | 'DELIVERY_BOY'): AppUser | null {
    const user = this.data.users.find(
      (u) => u.username?.toLowerCase() === username.toLowerCase() && u.role === role && u.status === 'ACTIVE'
    );
    if (user) {
      this.data.currentUser = user;
      this.notify();
      return user;
    }
    return null;
  }

  public setCurrentUser(user: AppUser | null) {
    this.data.currentUser = user;
    this.notify();
  }

  public getCurrentUser(): AppUser | null {
    return this.data.currentUser;
  }

  // --- Users & Delivery Boys ---
  public getUsers(): AppUser[] {
    return this.data.users;
  }

  public getDeliveryBoys(): AppUser[] {
    return this.data.users.filter((u) => u.role === 'DELIVERY_BOY');
  }

  public saveUser(user: Omit<AppUser, 'id' | 'created_at' | 'updated_at'> & { id?: string }): AppUser {
    const now = new Date().toISOString();
    let updated: AppUser;
    if (user.id) {
      updated = {
        ...this.data.users.find((u) => u.id === user.id)!,
        ...user,
        updated_at: now,
      };
      this.data.users = this.data.users.map((u) => (u.id === user.id ? updated : u));
    } else {
      updated = {
        id: 'u-' + Math.random().toString(36).substr(2, 9),
        created_at: now,
        updated_at: now,
        ...user,
      };
      this.data.users.push(updated);
    }
    this.logAudit('USER_SAVE', 'USER', updated.id, { name: updated.name, role: updated.role });
    this.notify();
    return updated;
  }

  // --- Routes ---
  public getRoutes(): Route[] {
    return this.data.routes;
  }

  public saveRoute(route: Omit<Route, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Route {
    const now = new Date().toISOString();
    let updated: Route;
    if (route.id) {
      updated = {
        ...this.data.routes.find((r) => r.id === route.id)!,
        ...route,
        updated_at: now,
      };
      this.data.routes = this.data.routes.map((r) => (r.id === route.id ? updated : r));
    } else {
      updated = {
        id: 'r-' + Math.random().toString(36).substr(2, 9),
        created_at: now,
        updated_at: now,
        ...route,
      };
      this.data.routes.push(updated);
    }
    this.logAudit('ROUTE_SAVE', 'ROUTE', updated.id, { name: updated.name });
    this.notify();
    return updated;
  }

  // --- Products ---
  public getProducts(): Product[] {
    return this.data.products;
  }

  public updateProductPrice(productId: string, newPrice: number): Product | null {
    const product = this.data.products.find((p) => p.id === productId);
    if (!product) return null;

    const oldPrice = product.price;
    product.price = newPrice;
    product.updated_at = new Date().toISOString();

    this.logAudit('PRODUCT_PRICE_UPDATE', 'PRODUCT', productId, {
      product_name: product.name,
      old_price: oldPrice,
      new_price: newPrice,
    });
    this.notify();
    return product;
  }

  // --- Customers ---
  public getCustomers(): Customer[] {
    return this.data.customers;
  }

  public getCustomersByDeliveryBoy(deliveryBoyId: string): Customer[] {
    return this.data.customers.filter((c) => c.delivery_boy_id === deliveryBoyId && c.status === 'ACTIVE');
  }

  public saveCustomer(
    customer: Omit<Customer, 'id' | 'customer_code' | 'created_at' | 'updated_at'> & { id?: string },
    productRequirements: { productId: string; defaultPackets: number }[]
  ): Customer {
    const now = new Date().toISOString();
    let updated: Customer;
    if (customer.id) {
      updated = {
        ...this.data.customers.find((c) => c.id === customer.id)!,
        ...customer,
        updated_at: now,
      };
      this.data.customers = this.data.customers.map((c) => (c.id === customer.id ? updated : c));
    } else {
      const codeIndex = this.data.customers.length + 1;
      const code = 'C' + codeIndex.toString().padStart(3, '0');
      updated = {
        id: 'c-' + Math.random().toString(36).substr(2, 9),
        customer_code: code,
        created_at: now,
        updated_at: now,
        ...customer,
      };
      this.data.customers.push(updated);
    }

    // Save product requirements
    this.data.customerProducts = this.data.customerProducts.filter((cp) => cp.customer_id !== updated.id);
    for (const req of productRequirements) {
      if (req.defaultPackets > 0) {
        this.data.customerProducts.push({
          id: 'cp-' + Math.random().toString(36).substr(2, 9),
          customer_id: updated.id,
          product_id: req.productId,
          default_packets: req.defaultPackets,
          created_at: now,
        });
      }
    }

    this.logAudit('CUSTOMER_SAVE', 'CUSTOMER', updated.id, { name: updated.name, code: updated.customer_code });
    this.notify();
    return updated;
  }

  public getCustomerProducts(customerId: string): CustomerProductRequirement[] {
    return this.data.customerProducts.filter((cp) => cp.customer_id === customerId);
  }

  // --- Daily Deliveries & Offline Sync ---
  public getDeliveries(date?: string, customerId?: string): DailyDelivery[] {
    return this.data.deliveries.filter((d) => {
      if (date && d.delivery_date !== date) return false;
      if (customerId && d.customer_id !== customerId) return false;
      return true;
    });
  }

  public getDeliveryItems(deliveryId: string): DeliveryItem[] {
    return this.data.deliveryItems.filter((di) => di.delivery_id === deliveryId);
  }

  public getExistingDelivery(customerId: string, date: string): DailyDelivery | undefined {
    return this.data.deliveries.find((d) => d.customer_id === customerId && d.delivery_date === date);
  }

  public async saveDailyDelivery(
    customerId: string,
    deliveryBoyId: string,
    routeId: string,
    deliveryDate: string,
    status: DeliveryStatus,
    packetEntries: { productId: string; packetsCount: number }[],
    remarks?: string,
    existingDeliveryId?: string
  ): Promise<{ delivery: DailyDelivery; items: DeliveryItem[]; isDuplicate: boolean }> {
    const customer = this.data.customers.find((c) => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    const idempotencyKey = `${customerId}_${deliveryDate}`;

    // Duplicate protection check
    const existing = this.getExistingDelivery(customerId, deliveryDate);
    if (existing && existing.id !== existingDeliveryId) {
      return { delivery: existing, items: this.getDeliveryItems(existing.id), isDuplicate: true };
    }

    const totals = calculateDeliveryTotals(packetEntries, this.data.products);
    const now = new Date().toISOString();

    const deliveryId = existingDeliveryId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'd' + Math.random().toString(36).substr(2, 8) + '-0000-0000-0000-000000000000');

    const deliveryRecord: DailyDelivery = {
      id: deliveryId,
      idempotency_key: idempotencyKey,
      delivery_date: deliveryDate,
      customer_id: customerId,
      delivery_boy_id: deliveryBoyId,
      route_id: routeId,
      total_milk_litres: totals.totalMilkLitres,
      total_curd_packets: totals.totalCurdPackets,
      product_total: totals.productTotal,
      delivery_charge: totals.deliveryCharge,
      grand_total: totals.grandTotal,
      status,
      remarks,
      created_by: this.data.currentUser?.id,
      is_offline_synced: typeof navigator !== 'undefined' ? navigator.onLine : true,
      created_at: existing ? existing.created_at : now,
      updated_at: now,
    };

    const newItems: DeliveryItem[] = totals.items.map((item) => ({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'i' + Math.random().toString(36).substr(2, 8) + '-0000-0000-0000-000000000000',
      delivery_id: deliveryId,

      product_id: item.productId,
      product_name: item.productName,
      category: item.category,
      packet_size_ml: item.packetSizeMl,
      packets_count: item.packetsCount,
      actual_quantity_litres: item.actualQuantityLitres,
      price_per_unit: item.pricePerUnit,
      total_amount: item.totalAmount,
      created_at: now,
    }));

    // Update in-memory store
    this.data.deliveries = this.data.deliveries.filter((d) => d.id !== deliveryId);
    this.data.deliveries.push(deliveryRecord);

    this.data.deliveryItems = this.data.deliveryItems.filter((di) => di.delivery_id !== deliveryId);
    this.data.deliveryItems.push(...newItems);

    // Queue in IndexedDB if offline or for sync resilience
    await queueOfflineDelivery(deliveryRecord, newItems);

    this.logAudit('DELIVERY_RECORD', 'DELIVERY', deliveryId, {
      customer_name: customer.name,
      date: deliveryDate,
      total_milk: totals.totalMilkLitres,
      delivery_charge: totals.deliveryCharge,
      grand_total: totals.grandTotal,
      status,
    });

    this.notify();

    // Trigger cloud sync if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.syncPendingOfflineQueue();
    }

    return { delivery: deliveryRecord, items: newItems, isDuplicate: false };
  }

  // --- Cloud Sync & Offline Sync Handlers ---
  public async fetchLiveCloudData() {
    if (!isSupabaseConfigured()) return;
    try {
      await this.ensureCloudBaseData();

      const { data: cloudDeliveries, error: delErr } = await supabase.from('daily_deliveries').select('*');
      if (!delErr && cloudDeliveries) {
        const cloudMap = new Map(cloudDeliveries.map((d: any) => [d.idempotency_key || d.id, d]));
        const localOnly = this.data.deliveries.filter((d) => !cloudMap.has(d.idempotency_key || d.id));
        this.data.deliveries = [...cloudDeliveries, ...localOnly];
      }

      const { data: cloudItems, error: itemErr } = await supabase.from('delivery_items').select('*');
      if (!itemErr && cloudItems) {
        const itemMap = new Map(cloudItems.map((i: any) => [i.id, i]));
        const localOnlyItems = this.data.deliveryItems.filter((i) => !itemMap.has(i.id));
        this.data.deliveryItems = [...cloudItems, ...localOnlyItems];
      }

      const { data: cloudPayments, error: payErr } = await supabase.from('payments').select('*');
      if (!payErr && cloudPayments) {
        const payMap = new Map(cloudPayments.map((p: any) => [p.id, p]));
        const localOnlyPay = this.data.payments.filter((p) => !payMap.has(p.id));
        this.data.payments = [...cloudPayments, ...localOnlyPay];
      }

      this.notify();
    } catch (e) {
      console.error('Error fetching live cloud data from Supabase', e);
    }
  }

  private async ensureCloudBaseData() {
    try {
      const { data: existingUsers } = await supabase.from('users').select('id').limit(1);
      if (!existingUsers || existingUsers.length === 0) {
        await supabase.from('users').upsert(INITIAL_USERS);
        await supabase.from('routes').upsert(INITIAL_ROUTES);
        await supabase.from('products').upsert(INITIAL_PRODUCTS);
        await supabase.from('customers').upsert(INITIAL_CUSTOMERS);
        await supabase.from('customer_products').upsert(INITIAL_CUSTOMER_PRODUCTS);
      }
    } catch (e) {
      console.error('Error ensuring cloud base data', e);
    }
  }


  private initAutoSync() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('Network connected. Triggering offline sync...');
      this.syncPendingOfflineQueue();
    });
  }

  public async syncPendingOfflineQueue(): Promise<number> {
    try {
      const pending = await getPendingOfflineDeliveries();
      if (pending.length === 0) return 0;

      let syncedCount = 0;
      for (const item of pending) {
        if (isSupabaseConfigured()) {
          const { error: delError } = await supabase.from('daily_deliveries').upsert(
            {
              id: item.delivery.id,
              idempotency_key: item.idempotencyKey,
              delivery_date: item.delivery.delivery_date,
              customer_id: item.delivery.customer_id,
              delivery_boy_id: item.delivery.delivery_boy_id,
              route_id: item.delivery.route_id,
              total_milk_litres: item.delivery.total_milk_litres,
              total_curd_packets: item.delivery.total_curd_packets,
              product_total: item.delivery.product_total,
              delivery_charge: item.delivery.delivery_charge,
              grand_total: item.delivery.grand_total,
              status: item.delivery.status,
              remarks: item.delivery.remarks,
              created_by: item.delivery.created_by,
              updated_at: item.delivery.updated_at,
            },
            { onConflict: 'idempotency_key' }
          );

          if (!delError) {
            if (item.items && item.items.length > 0) {
              await supabase.from('delivery_items').upsert(
                item.items.map((di) => ({
                  id: di.id,
                  delivery_id: item.delivery.id,
                  product_id: di.product_id,
                  product_name: di.product_name,
                  category: di.category,
                  packet_size_ml: di.packet_size_ml,
                  packets_count: di.packets_count,
                  actual_quantity_litres: di.actual_quantity_litres,
                  price_per_unit: di.price_per_unit,
                  total_amount: di.total_amount,
                })),
                { onConflict: 'id' }
              );
            }
            await markDeliverySynced(item.idempotencyKey);
            syncedCount++;
          }
        } else {
          await markDeliverySynced(item.idempotencyKey);
          syncedCount++;
        }
      }

      if (syncedCount > 0) {
        this.data.deliveries = this.data.deliveries.map((d) => ({ ...d, is_offline_synced: true }));
        this.notify();
      }
      return syncedCount;
    } catch (e) {
      console.error('Error syncing offline queue', e);
      return 0;
    }
  }


  // --- Payments & Advances ---
  public getPayments(customerId?: string): Payment[] {
    return this.data.payments.filter((p) => (!customerId ? true : p.customer_id === customerId));
  }

  public recordPayment(payment: Omit<Payment, 'id' | 'created_at'>): Payment {
    const now = new Date().toISOString();
    const newPayment: Payment = {
      id: 'pay-' + Math.random().toString(36).substr(2, 9),
      created_at: now,
      created_by: this.data.currentUser?.id,
      ...payment,
    };
    this.data.payments.push(newPayment);

    const customer = this.data.customers.find((c) => c.id === payment.customer_id);
    this.logAudit('PAYMENT_RECORD', 'PAYMENT', newPayment.id, {
      customer_name: customer?.name,
      amount: payment.amount,
      method: payment.payment_method,
    });

    this.notify();
    return newPayment;
  }

  // --- Monthly Billing & Invoices ---
  public getInvoices(monthYear?: string, customerId?: string): MonthlyInvoice[] {
    return this.data.invoices.filter((inv) => {
      if (monthYear && inv.month_year !== monthYear) return false;
      if (customerId && inv.customer_id !== customerId) return false;
      return true;
    });
  }

  public generateMonthlyBills(monthYear: string): MonthlyInvoice[] {
    const activeCustomers = this.data.customers.filter((c) => c.status === 'ACTIVE');
    const generated: MonthlyInvoice[] = [];

    for (const customer of activeCustomers) {
      // Get all deliveries in this month
      const monthDeliveries = this.data.deliveries.filter(
        (d) => d.customer_id === customer.id && d.delivery_date.startsWith(monthYear)
      );

      // Get payments in this month
      const monthPayments = this.data.payments.filter(
        (p) => p.customer_id === customer.id && p.payment_date.startsWith(monthYear)
      );

      // Get previous balance/credit
      const previousInvoices = this.data.invoices.filter(
        (inv) => inv.customer_id === customer.id && inv.month_year < monthYear
      );
      const prevUnpaidBalance = previousInvoices.reduce((sum, inv) => sum + inv.amount_payable, 0);

      const summary = calculateMonthlyInvoiceSummary(monthDeliveries, monthPayments, prevUnpaidBalance);

      const invoiceNum = `INV-${monthYear.replace('-', '')}-${customer.customer_code}`;
      const existingIdx = this.data.invoices.findIndex(
        (inv) => inv.customer_id === customer.id && inv.month_year === monthYear
      );

      const invoiceRecord: MonthlyInvoice = {
        id: existingIdx >= 0 ? this.data.invoices[existingIdx].id : 'inv-' + Math.random().toString(36).substr(2, 9),
        invoice_number: invoiceNum,
        customer_id: customer.id,
        month_year: monthYear,
        total_product_amount: summary.totalProductAmount,
        total_delivery_charges: summary.totalDeliveryCharges,
        grand_total: summary.grandTotal,
        previous_balance_credit: summary.previousBalanceCredit,
        advance_paid: summary.advancePaid,
        amount_payable: summary.amountPayable,
        status: summary.amountPayable <= 0 ? 'PAID' : 'GENERATED',
        generated_at: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        this.data.invoices[existingIdx] = invoiceRecord;
      } else {
        this.data.invoices.push(invoiceRecord);
      }

      generated.push(invoiceRecord);
    }

    this.logAudit('INVOICES_GENERATED', 'INVOICE', monthYear, { count: generated.length });
    this.notify();
    return generated;
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public logAudit(action: string, entity_type: string, entity_id?: string, details?: Record<string, any>) {
    const log: AuditLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      user_id: this.data.currentUser?.id,
      user_name: this.data.currentUser?.name || 'System',
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    };
    this.data.auditLogs.push(log);
  }
}

export const store = new Store();
