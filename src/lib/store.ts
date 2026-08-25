// Central Data Store & Service Layer for S.S Agency Milk Delivery
import {
  AppUser,
  Route,
  Customer,
  Product,
  ProductCategory,
  CustomerProductRequirement,
  DailyDelivery,
  DeliveryItem,
  Payment,
  MonthlyInvoice,
  AuditLog,
  DeliveryStatus,
  AgencyProfile,
} from './types';
import { calculateDeliveryTotals, calculateMonthlyInvoiceSummary } from './calculations';
import { queueOfflineDelivery, getPendingOfflineDeliveries, markDeliverySynced } from './offlineSync';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'ss_agency_store_v5_clean_customers';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function pushToCloud(operation: PromiseLike<any>, errorMessage: string = 'Cloud sync error') {
  try {
    const res: any = await operation;
    if (res && res.error) {
      console.error(errorMessage, res.error);
    }
  } catch (err) {
    console.error(errorMessage, err);
  }
}

export const INITIAL_AGENCY_PROFILE: AgencyProfile = {
  business_name: 'Nandini Milk Parlour',
  phone: '7022754524',
  gstin: '29FBWPD7245C1ZA',
  email: 'maheshgultedar545@gmail.com',
  account_beginning_date: '2026-07-27',
  business_type: 'Distributor',
  business_category: 'Dairy Farm Products/ Poultry',
  state: 'Karnataka',
  pincode: '560067',
  address: 'Nandini Milk Parlour, Opp. Nitesh Flushing Meadows, Towards Panchayat Road, Seegehalli, Bangalore',
  logo_url: '',
  signature_url: '',
  payment_qr_url: '',
  terms_conditions: 'GOODS ONCE SOLD CANNOT BE RETURNED BACK\n- MONDAY TO SATURDAY - 9:30 AM - 5:30 PM & SUNDAY - HOLIDAY - THANKS FOR DOING BUSINESS WITH US!',
};

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
  agencyProfile?: AgencyProfile;
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
  { id: '30000000-0000-0000-0000-000000000001', name: 'S.S Agency Admin', phone: '9876543210', role: 'ADMIN', status: 'ACTIVE', username: 'admin', password: 'admin123', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '30000000-0000-0000-0000-000000000002', name: 'Delivery Boy 1 (Ramesh)', phone: '9876543211', role: 'DELIVERY_BOY', status: 'ACTIVE', username: 'boy1', password: 'boy123', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '30000000-0000-0000-0000-000000000003', name: 'Delivery Boy 2 (Suresh)', phone: '9876543212', role: 'DELIVERY_BOY', status: 'ACTIVE', username: 'boy2', password: 'boy223', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const INITIAL_ROUTES: Route[] = [];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_CUSTOMER_PRODUCTS: CustomerProductRequirement[] = [];

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
    currentUser: INITIAL_USERS[0],
  };

  private listeners: Set<() => void> = new Set();

  private realtimeChannel: any = null;
  private realtimeConnected: boolean = false;
  private lastRealtimeEvent: { table: string; eventType: string; timestamp: string } | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
      this.initAutoSync();
      this.fetchLiveCloudData();
      this.setupRealtimeSubscription();
    }
  }

  public getRealtimeStatus() {
    return {
      connected: this.realtimeConnected,
      lastEvent: this.lastRealtimeEvent,
    };
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ss_agency_store_v1');
        localStorage.removeItem('ss_agency_store_v2_clean_uuid');
        localStorage.removeItem('ss_agency_store_v4_auth_fix');
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.users && Array.isArray(parsed.users)) {
          parsed.users = parsed.users.map((u: AppUser) => {
            if (!u.password) {
              if (u.username === 'admin') u.password = 'admin123';
              else if (u.username === 'boy1') u.password = 'boy123';
              else if (u.username === 'boy2') u.password = 'boy223';
            }
            return u;
          });
        }
        this.data = { ...this.data, ...parsed };
      } else {
        this.seedDemoData();
      }
    } catch (e) {
      console.error('Failed to load local store', e);
      this.seedDemoData();
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
    this.data.routes = [];
    this.data.customers = [];
    this.data.products = INITIAL_PRODUCTS;
    this.data.customerProducts = [];
    this.data.deliveries = [];
    this.data.deliveryItems = [];
    this.data.payments = [];
    this.data.invoices = [];
    this.data.auditLogs = [
      {
        id: generateUUID(),
        user_id: INITIAL_USERS[0].id,
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
  public login(usernameOrPhone: string, role: 'ADMIN' | 'DELIVERY_BOY', password?: string): AppUser | null {
    if (!usernameOrPhone) return null;
    const cleanInput = usernameOrPhone.trim().toLowerCase();
    const cleanPhone = cleanInput.replace(/\D/g, '');

    if (!this.data.users || this.data.users.length === 0) {
      this.data.users = INITIAL_USERS;
    }

    let user = this.data.users.find(
      (u) =>
        (u.username?.trim().toLowerCase() === cleanInput ||
          (cleanPhone.length >= 8 && u.phone?.replace(/\D/g, '') === cleanPhone)) &&
        u.role === role
    );

    if (!user) {
      const initMatch = INITIAL_USERS.find(
        (u) =>
          (u.username?.trim().toLowerCase() === cleanInput ||
            (cleanPhone.length >= 8 && u.phone?.replace(/\D/g, '') === cleanPhone)) &&
          u.role === role
      );
      if (initMatch) {
        user = { ...initMatch };
        this.data.users.push(user);
      }
    }

    if (!user) return null;

    user.status = 'ACTIVE';

    const expectedPassword =
      user.password ||
      (user.username === 'admin' ? 'admin123' : user.username === 'boy1' ? 'boy123' : 'boy223');

    if (password && password.trim() !== expectedPassword) {
      return null;
    }

    this.data.currentUser = user;
    this.saveToStorage();
    this.notify();
    return user;
  }

  public resetPassword(usernameOrPhone: string, newPassword: string): boolean {
    const cleanInput = usernameOrPhone.trim().toLowerCase();
    const user = this.data.users.find(
      (u) =>
        (u.username?.toLowerCase() === cleanInput || u.phone?.replace(/\D/g, '') === cleanInput.replace(/\D/g, '')) &&
        u.status === 'ACTIVE'
    );
    if (!user) return false;

    user.password = newPassword;
    user.updated_at = new Date().toISOString();
    this.data.users = this.data.users.map((u) => (u.id === user.id ? { ...u, password: newPassword } : u));
    this.saveToStorage();
    this.notify();

    if (isSupabaseConfigured()) {
      pushToCloud(
        supabase.from('users').upsert({ id: user.id, password: newPassword, updated_at: user.updated_at }),
        'Supabase reset password error'
      );
    }

    return true;
  }

  public loginByPhone(phone: string, role: 'ADMIN' | 'DELIVERY_BOY'): AppUser | null {
    const cleanPhone = phone.replace(/\D/g, '');
    const user = this.data.users.find(
      (u) => u.phone?.replace(/\D/g, '') === cleanPhone && u.role === role && u.status === 'ACTIVE'
    );
    if (!user) return null;

    this.data.currentUser = user;
    this.saveToStorage();
    this.notify();
    return user;
  }

  public loginWithGoogle(email: string, name: string, role: 'ADMIN' | 'DELIVERY_BOY'): AppUser {
    let user = this.data.users.find((u) => u.role === role && u.status === 'ACTIVE');
    if (!user) {
      user = {
        id: generateUUID(),
        name: name || 'Google User',
        phone: '9999999999',
        username: email.split('@')[0] || 'google_user',
        role: role,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.data.users.push(user);
    }
    this.data.currentUser = user;
    this.saveToStorage();
    this.notify();

    if (isSupabaseConfigured()) {
      pushToCloud(supabase.from('users').upsert(user), 'Supabase google login user error');
    }

    return user;
  }

  public setCurrentUser(user: AppUser | null) {
    this.data.currentUser = user;
    this.saveToStorage();
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

  public deleteUser(userId: string): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return false;

    this.data.users = this.data.users.filter((u) => u.id !== userId);

    this.data.routes = this.data.routes.map((r) =>
      r.assigned_delivery_boy_id === userId ? { ...r, assigned_delivery_boy_id: undefined } : r
    );

    this.data.customers = this.data.customers.map((c) =>
      c.delivery_boy_id === userId ? { ...c, delivery_boy_id: '' } : c
    );

    this.logAudit('USER_DELETE', 'USER', userId, { name: user.name, role: user.role });
    this.saveToStorage();
    this.notify();

    if (isSupabaseConfigured()) {
      pushToCloud(supabase.from('users').delete().eq('id', userId), 'Supabase user delete error');
    }

    return true;
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
        id: generateUUID(),
        created_at: now,
        updated_at: now,
        ...user,
      };
      this.data.users.push(updated);
    }
    this.logAudit('USER_SAVE', 'USER', updated.id, { name: updated.name, role: updated.role });
    this.saveToStorage();
    this.notify();

    if (isSupabaseConfigured()) {
      pushToCloud(supabase.from('users').upsert(updated), 'Supabase user save error');
    }

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
        id: generateUUID(),
        created_at: now,
        updated_at: now,
        ...route,
      };
      this.data.routes.push(updated);
    }
    this.logAudit('ROUTE_SAVE', 'ROUTE', updated.id, { name: updated.name });
    this.saveToStorage();
    this.notify();

    if (isSupabaseConfigured()) {
      pushToCloud(supabase.from('routes').upsert(updated), 'Supabase route save error');
    }

    return updated;
  }

  // --- Products ---
  public getProducts(): Product[] {
    return this.data.products;
  }

  public saveProduct(productData: {
    id?: string;
    product_code?: string;
    name: string;
    category: ProductCategory;
    packet_size_ml: number;
    price: number;
    icon?: string;
    image_url?: string;
    active?: boolean;
  }): Product {
    const now = new Date().toISOString();
    let updated: Product;

    if (productData.id) {
      const idx = this.data.products.findIndex((p) => p.id === productData.id);
      if (idx >= 0) {
        updated = {
          ...this.data.products[idx],
          ...productData,
          updated_at: now,
        };
        this.data.products[idx] = updated;
      } else {
        updated = {
          id: productData.id,
          product_code: productData.product_code || `P${this.data.products.length + 1}`,
          name: productData.name,
          category: productData.category,
          packet_size_ml: productData.packet_size_ml,
          price: productData.price,
          active: productData.active !== undefined ? productData.active : true,
          icon: productData.icon || (productData.category === 'MILK' ? 'Milk' : 'Package'),
          image_url: productData.image_url,
          created_at: now,
          updated_at: now,
        };
        this.data.products.push(updated);
      }
    } else {
      const newSeq = this.data.products.length + 1;
      updated = {
        id: generateUUID(),
        product_code: productData.product_code || `P00${newSeq}`,
        name: productData.name,
        category: productData.category,
        packet_size_ml: productData.packet_size_ml,
        price: productData.price,
        active: true,
        icon: productData.icon || (productData.category === 'MILK' ? 'Milk' : 'Package'),
        image_url: productData.image_url,
        created_at: now,
        updated_at: now,
      };
      this.data.products.push(updated);
    }

    this.logAudit('PRODUCT_SAVE', 'PRODUCT', updated.id, {
      product_name: updated.name,
      price: updated.price,
      icon: updated.icon,
      image_url: updated.image_url ? 'set' : 'none',
    });
    this.saveToStorage();
    this.notify();

    if (isSupabaseConfigured()) {
      pushToCloud(supabase.from('products').upsert(updated), 'Supabase product save error');
    }

    return updated;
  }

  public deleteProduct(productId: string): boolean {
    const product = this.data.products.find((p) => p.id === productId);
    if (!product) return false;

    this.data.products = this.data.products.filter((p) => p.id !== productId);
    this.data.customerProducts = this.data.customerProducts.filter((cp) => cp.product_id !== productId);

    this.logAudit('PRODUCT_DELETE', 'PRODUCT', productId, {
      product_name: product.name,
    });
    this.saveToStorage();
    this.notify();

    if (isSupabaseConfigured()) {
      pushToCloud(supabase.from('customer_products').delete().eq('product_id', productId), 'Delete product requirements error');
      pushToCloud(supabase.from('products').delete().eq('id', productId), 'Delete product error');
    }

    return true;
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
    this.saveToStorage();
    this.notify();

    if (isSupabaseConfigured()) {
      pushToCloud(supabase.from('products').upsert(product), 'Update product price error');
    }

    return product;
  }

  // --- Customers ---
  public getCustomers(): Customer[] {
    return this.data.customers;
  }

  public deleteCustomer(customerId: string): boolean {
    const cust = this.data.customers.find((c) => c.id === customerId);
    if (!cust) return false;

    this.data.customers = this.data.customers.filter((c) => c.id !== customerId);
    this.data.customerProducts = this.data.customerProducts.filter((cp) => cp.customer_id !== customerId);

    this.logAudit('CUSTOMER_DELETE', 'CUSTOMER', customerId, {
      customer_name: cust.name,
      customer_code: cust.customer_code,
    });
    this.saveToStorage();
    this.notify();

    if (isSupabaseConfigured()) {
      pushToCloud(supabase.from('customer_products').delete().eq('customer_id', customerId), 'Delete customer products error');
      pushToCloud(supabase.from('customers').delete().eq('id', customerId), 'Delete customer error');
    }

    return true;
  }

  public getCustomersByDeliveryBoy(deliveryBoyId: string): Customer[] {
    return this.data.customers.filter((c) => c.delivery_boy_id === deliveryBoyId && c.status === 'ACTIVE');
  }

  public saveCustomer(
    customer: Omit<Customer, 'id' | 'customer_code' | 'created_at' | 'updated_at'> & { id?: string },
    productRequirements: { productId: string; defaultPackets: number }[] = []
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
        id: generateUUID(),
        customer_code: code,
        created_at: now,
        updated_at: now,
        ...customer,
      };
      this.data.customers.push(updated);
    }

    this.data.customerProducts = this.data.customerProducts.filter((cp) => cp.customer_id !== updated.id);
    const newReqs: CustomerProductRequirement[] = [];
    for (const req of productRequirements) {
      if (req.defaultPackets > 0) {
        const cpItem: CustomerProductRequirement = {
          id: generateUUID(),
          customer_id: updated.id,
          product_id: req.productId,
          default_packets: req.defaultPackets,
          created_at: now,
        };
        this.data.customerProducts.push(cpItem);
        newReqs.push(cpItem);
      }
    }

    this.logAudit('CUSTOMER_SAVE', 'CUSTOMER', updated.id, { name: updated.name, code: updated.customer_code });
    this.saveToStorage();
    this.notify();

    if (isSupabaseConfigured()) {
      pushToCloud(supabase.from('customers').upsert(updated), 'Save customer error');
      pushToCloud(supabase.from('customer_products').delete().eq('customer_id', updated.id), 'Clear customer products error').then(() => {
        if (newReqs.length > 0) {
          pushToCloud(supabase.from('customer_products').upsert(newReqs), 'Save customer products error');
        }
      });
    }

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

    const existing = this.getExistingDelivery(customerId, deliveryDate);
    if (existing && existing.id !== existingDeliveryId) {
      return { delivery: existing, items: this.getDeliveryItems(existing.id), isDuplicate: true };
    }

    const isBulk = customer?.customer_category === 'BULK_ORDER' || customer?.is_bulk_order;
    const totals = calculateDeliveryTotals(packetEntries, this.data.products, !!isBulk);
    const now = new Date().toISOString();

    const deliveryId = existingDeliveryId || generateUUID();

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
      id: generateUUID(),
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

    this.data.deliveries = this.data.deliveries.filter((d) => d.id !== deliveryId);
    this.data.deliveries.push(deliveryRecord);

    this.data.deliveryItems = this.data.deliveryItems.filter((di) => di.delivery_id !== deliveryId);
    this.data.deliveryItems.push(...newItems);

    this.saveToStorage();
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

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('daily_deliveries').upsert(
          {
            id: deliveryRecord.id,
            idempotency_key: deliveryRecord.idempotency_key,
            delivery_date: deliveryRecord.delivery_date,
            customer_id: deliveryRecord.customer_id,
            delivery_boy_id: deliveryRecord.delivery_boy_id,
            route_id: deliveryRecord.route_id,
            total_milk_litres: deliveryRecord.total_milk_litres,
            total_curd_packets: deliveryRecord.total_curd_packets,
            product_total: deliveryRecord.product_total,
            delivery_charge: deliveryRecord.delivery_charge,
            grand_total: deliveryRecord.grand_total,
            status: deliveryRecord.status,
            remarks: deliveryRecord.remarks,
            created_by: deliveryRecord.created_by,
            updated_at: deliveryRecord.updated_at,
          },
          { onConflict: 'idempotency_key' }
        );

        if (newItems.length > 0) {
          await supabase.from('delivery_items').upsert(
            newItems.map((di) => ({
              id: di.id,
              delivery_id: deliveryRecord.id,
              product_id: di.product_id,
              product_name: di.product_name,
              category: di.category,
              packet_size_ml: di.packet_size_ml,
              packets_count: di.packets_count,
              actual_quantity_litres: di.actual_quantity_litres,
              price_per_unit: di.price_per_unit,
              total_amount: di.total_amount,
            }))
          );
        }

        await markDeliverySynced(deliveryRecord.idempotency_key);
      } catch (err) {
        console.error('Error during direct cloud push to Supabase', err);
      }
    }

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.syncPendingOfflineQueue();
    }

    return { delivery: deliveryRecord, items: newItems, isDuplicate: false };
  }

  // --- Cloud Sync & Realtime Handlers ---
  public async fetchLiveCloudData() {
    if (!isSupabaseConfigured()) return;
    try {
      await this.ensureCloudBaseData();

      const [
        { data: cloudUsers },
        { data: cloudRoutes },
        { data: cloudCustomers },
        { data: cloudProducts },
        { data: cloudCustProds },
        { data: cloudDeliveries },
        { data: cloudItems },
        { data: cloudPayments },
        { data: cloudInvoices },
        { data: cloudAuditLogs },
        { data: cloudProfile },
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('routes').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('products').select('*'),
        supabase.from('customer_products').select('*'),
        supabase.from('daily_deliveries').select('*'),
        supabase.from('delivery_items').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('monthly_invoices').select('*'),
        supabase.from('audit_logs').select('*'),
        supabase.from('agency_profile').select('*').single(),
      ]);

      if (cloudUsers && cloudUsers.length > 0) {
        this.data.users = cloudUsers;
      } else if (this.data.users.length > 0) {
        pushToCloud(supabase.from('users').upsert(this.data.users), 'Auto-migrate users error');
      }

      if (cloudRoutes && cloudRoutes.length > 0) {
        this.data.routes = cloudRoutes;
      } else if (this.data.routes.length > 0) {
        pushToCloud(supabase.from('routes').upsert(this.data.routes), 'Auto-migrate routes error');
      }

      if (cloudCustomers && cloudCustomers.length > 0) {
        this.data.customers = cloudCustomers;
      } else if (this.data.customers.length > 0) {
        pushToCloud(supabase.from('customers').upsert(this.data.customers), 'Auto-migrate customers error');
      }

      if (cloudProducts && cloudProducts.length > 0) {
        this.data.products = cloudProducts;
      } else if (this.data.products.length > 0) {
        pushToCloud(supabase.from('products').upsert(this.data.products), 'Auto-migrate products error');
      }

      if (cloudCustProds && cloudCustProds.length > 0) {
        this.data.customerProducts = cloudCustProds;
      } else if (this.data.customerProducts.length > 0) {
        pushToCloud(supabase.from('customer_products').upsert(this.data.customerProducts), 'Auto-migrate customer_products error');
      }

      if (cloudDeliveries) this.data.deliveries = cloudDeliveries;
      if (cloudItems) this.data.deliveryItems = cloudItems;
      if (cloudPayments) this.data.payments = cloudPayments;
      if (cloudInvoices) this.data.invoices = cloudInvoices;
      if (cloudAuditLogs) this.data.auditLogs = cloudAuditLogs;
      if (cloudProfile) this.data.agencyProfile = cloudProfile;

      this.saveToStorage();
      this.notify();
    } catch (e) {
      console.error('Error fetching live cloud data from Supabase', e);
    }
  }

  private setupRealtimeSubscription() {
    if (!isSupabaseConfigured() || typeof window === 'undefined') return;
    if (this.realtimeChannel) return;

    try {
      this.realtimeChannel = supabase
        .channel('ss-agency-realtime-all')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            console.log('⚡ Realtime Supabase event received:', payload.table, payload.eventType);
            this.lastRealtimeEvent = {
              table: payload.table,
              eventType: payload.eventType,
              timestamp: new Date().toLocaleTimeString(),
            };
            this.handleRealtimePayload(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Connected to Supabase Realtime Channel');
            this.realtimeConnected = true;
            this.notify();
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            this.realtimeConnected = false;
            this.notify();
          }
        });
    } catch (err) {
      console.error('Failed to initialize Supabase Realtime channel', err);
    }
  }

  private handleRealtimePayload(payload: any) {
    const { table, eventType, new: newRow, old: oldRow } = payload;
    if (!table) return;

    switch (table) {
      case 'users':
        if (eventType === 'DELETE' && oldRow?.id) {
          this.data.users = this.data.users.filter((u) => u.id !== oldRow.id);
        } else if (newRow?.id) {
          const idx = this.data.users.findIndex((u) => u.id === newRow.id);
          if (idx >= 0) this.data.users[idx] = { ...this.data.users[idx], ...newRow };
          else this.data.users.push(newRow);
        }
        break;

      case 'routes':
        if (eventType === 'DELETE' && oldRow?.id) {
          this.data.routes = this.data.routes.filter((r) => r.id !== oldRow.id);
        } else if (newRow?.id) {
          const idx = this.data.routes.findIndex((r) => r.id === newRow.id);
          if (idx >= 0) this.data.routes[idx] = { ...this.data.routes[idx], ...newRow };
          else this.data.routes.push(newRow);
        }
        break;

      case 'customers':
        if (eventType === 'DELETE' && oldRow?.id) {
          this.data.customers = this.data.customers.filter((c) => c.id !== oldRow.id);
        } else if (newRow?.id) {
          const idx = this.data.customers.findIndex((c) => c.id === newRow.id);
          if (idx >= 0) this.data.customers[idx] = { ...this.data.customers[idx], ...newRow };
          else this.data.customers.push(newRow);
        }
        break;

      case 'products':
        if (eventType === 'DELETE' && oldRow?.id) {
          this.data.products = this.data.products.filter((p) => p.id !== oldRow.id);
        } else if (newRow?.id) {
          const idx = this.data.products.findIndex((p) => p.id === newRow.id);
          if (idx >= 0) this.data.products[idx] = { ...this.data.products[idx], ...newRow };
          else this.data.products.push(newRow);
        }
        break;

      case 'customer_products':
        if (eventType === 'DELETE' && oldRow?.id) {
          this.data.customerProducts = this.data.customerProducts.filter((cp) => cp.id !== oldRow.id);
        } else if (newRow?.id) {
          const idx = this.data.customerProducts.findIndex((cp) => cp.id === newRow.id);
          if (idx >= 0) this.data.customerProducts[idx] = { ...this.data.customerProducts[idx], ...newRow };
          else this.data.customerProducts.push(newRow);
        }
        break;

      case 'daily_deliveries':
        if (eventType === 'DELETE' && oldRow?.id) {
          this.data.deliveries = this.data.deliveries.filter((d) => d.id !== oldRow.id);
        } else if (newRow?.id) {
          const idx = this.data.deliveries.findIndex((d) => d.id === newRow.id || d.idempotency_key === newRow.idempotency_key);
          if (idx >= 0) this.data.deliveries[idx] = { ...this.data.deliveries[idx], ...newRow };
          else this.data.deliveries.push(newRow);
        }
        break;

      case 'delivery_items':
        if (eventType === 'DELETE' && oldRow?.id) {
          this.data.deliveryItems = this.data.deliveryItems.filter((di) => di.id !== oldRow.id);
        } else if (newRow?.id) {
          const idx = this.data.deliveryItems.findIndex((di) => di.id === newRow.id);
          if (idx >= 0) this.data.deliveryItems[idx] = { ...this.data.deliveryItems[idx], ...newRow };
          else this.data.deliveryItems.push(newRow);
        }
        break;

      case 'payments':
        if (eventType === 'DELETE' && oldRow?.id) {
          this.data.payments = this.data.payments.filter((p) => p.id !== oldRow.id);
        } else if (newRow?.id) {
          const idx = this.data.payments.findIndex((p) => p.id === newRow.id);
          if (idx >= 0) this.data.payments[idx] = { ...this.data.payments[idx], ...newRow };
          else this.data.payments.push(newRow);
        }
        break;

      case 'monthly_invoices':
        if (eventType === 'DELETE' && oldRow?.id) {
          this.data.invoices = this.data.invoices.filter((inv) => inv.id !== oldRow.id);
        } else if (newRow?.id) {
          const idx = this.data.invoices.findIndex((inv) => inv.id === newRow.id);
          if (idx >= 0) this.data.invoices[idx] = { ...this.data.invoices[idx], ...newRow };
          else this.data.invoices.push(newRow);
        }
        break;

      case 'agency_profile':
        if (newRow) {
          this.data.agencyProfile = { ...this.data.agencyProfile, ...newRow };
        }
        break;
    }

    this.saveToStorage();
    this.notify();
  }

  private async ensureCloudBaseData() {
    try {
      const { data: existingUsers } = await supabase.from('users').select('id').limit(1);
      if (!existingUsers || existingUsers.length === 0) {
        await supabase.from('users').upsert(INITIAL_USERS);
        await supabase.from('products').upsert(INITIAL_PRODUCTS);
        await supabase.from('agency_profile').upsert({ id: 1, ...INITIAL_AGENCY_PROFILE });
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
      this.fetchLiveCloudData();
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
      id: generateUUID(),
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

    this.saveToStorage();
    this.notify();

    if (isSupabaseConfigured()) {
      pushToCloud(supabase.from('payments').upsert(newPayment), 'Record payment error');
    }

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
      const monthDeliveries = this.data.deliveries.filter(
        (d) => d.customer_id === customer.id && d.delivery_date.startsWith(monthYear)
      );

      const monthPayments = this.data.payments.filter(
        (p) => p.customer_id === customer.id && p.payment_date.startsWith(monthYear)
      );

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
        id: existingIdx >= 0 ? this.data.invoices[existingIdx].id : generateUUID(),
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
    this.saveToStorage();
    this.notify();

    if (isSupabaseConfigured() && generated.length > 0) {
      pushToCloud(supabase.from('monthly_invoices').upsert(generated), 'Monthly invoices error');
    }

    return generated;
  }

  public generateBulkBills(
    billingPeriod: 'MONTHLY' | 'WEEKLY',
    monthYear: string,
    weekNumber: number = 1
  ): MonthlyInvoice[] {
    const bulkCustomers = this.data.customers.filter(
      (c) =>
        (c.customer_category === 'BULK_ORDER' || c.is_bulk_order) &&
        c.status === 'ACTIVE' &&
        (c.bulk_billing_cycle === billingPeriod ||
          (!c.bulk_billing_cycle &&
            (billingPeriod === 'WEEKLY' ? c.payment_type === 'WEEKLY' : c.payment_type !== 'WEEKLY')))
    );

    const generated: MonthlyInvoice[] = [];

    const year = parseInt(monthYear.slice(0, 4));
    const month = parseInt(monthYear.slice(5, 7));
    const daysInMonth = new Date(year, month, 0).getDate();

    let dateStartStr = `${monthYear}-01`;
    let dateEndStr = `${monthYear}-${daysInMonth.toString().padStart(2, '0')}`;
    let periodLabel = `${new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
    let keySuffix = monthYear;

    if (billingPeriod === 'WEEKLY') {
      if (weekNumber === 1) {
        dateStartStr = `${monthYear}-01`;
        dateEndStr = `${monthYear}-07`;
        periodLabel = `Week 1 (1-7 ${new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' })} ${year})`;
        keySuffix = `${monthYear}-W1`;
      } else if (weekNumber === 2) {
        dateStartStr = `${monthYear}-08`;
        dateEndStr = `${monthYear}-14`;
        periodLabel = `Week 2 (8-14 ${new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' })} ${year})`;
        keySuffix = `${monthYear}-W2`;
      } else if (weekNumber === 3) {
        dateStartStr = `${monthYear}-15`;
        dateEndStr = `${monthYear}-21`;
        periodLabel = `Week 3 (15-21 ${new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' })} ${year})`;
        keySuffix = `${monthYear}-W3`;
      } else {
        dateStartStr = `${monthYear}-22`;
        dateEndStr = `${monthYear}-${daysInMonth.toString().padStart(2, '0')}`;
        periodLabel = `Week 4 (22-${daysInMonth} ${new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' })} ${year})`;
        keySuffix = `${monthYear}-W4`;
      }
    }

    for (const customer of bulkCustomers) {
      const periodDeliveries = this.data.deliveries.filter(
        (d) =>
          d.customer_id === customer.id &&
          d.delivery_date >= dateStartStr &&
          d.delivery_date <= dateEndStr
      );

      const periodPayments = this.data.payments.filter(
        (p) =>
          p.customer_id === customer.id &&
          p.payment_date >= dateStartStr &&
          p.payment_date <= dateEndStr
      );

      const totalProductAmount = periodDeliveries.reduce((sum, d) => sum + d.product_total, 0);
      const totalDeliveryCharges = 0;
      const grandTotal = totalProductAmount;
      const advancePaid = periodPayments.reduce((sum, p) => sum + p.amount, 0);
      const amountPayable = Math.max(0, grandTotal - advancePaid);

      const invoiceNum = `BLK-${billingPeriod === 'WEEKLY' ? `W${weekNumber}` : 'M'}-${customer.customer_code}-${monthYear.replace('-', '')}`;

      const existingIdx = this.data.invoices.findIndex(
        (inv) => inv.customer_id === customer.id && inv.month_year === keySuffix
      );

      const invoiceRecord: MonthlyInvoice = {
        id: existingIdx >= 0 ? this.data.invoices[existingIdx].id : generateUUID(),
        invoice_number: invoiceNum,
        customer_id: customer.id,
        month_year: keySuffix,
        billing_period: billingPeriod,
        period_label: periodLabel,
        date_start: dateStartStr,
        date_end: dateEndStr,
        total_product_amount: totalProductAmount,
        total_delivery_charges: 0,
        grand_total: grandTotal,
        previous_balance_credit: 0,
        advance_paid: advancePaid,
        amount_payable: amountPayable,
        status: amountPayable <= 0 ? 'PAID' : 'GENERATED',
        generated_at: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        this.data.invoices[existingIdx] = invoiceRecord;
      } else {
        this.data.invoices.push(invoiceRecord);
      }

      generated.push(invoiceRecord);
    }

    this.logAudit('BULK_INVOICES_GENERATED', 'INVOICE', keySuffix, { count: generated.length, period: billingPeriod });
    this.saveToStorage();
    this.notify();

    if (isSupabaseConfigured() && generated.length > 0) {
      pushToCloud(supabase.from('monthly_invoices').upsert(generated), 'Bulk invoices error');
    }

    return generated;
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public logAudit(action: string, entity_type: string, entity_id?: string, details?: Record<string, any>) {
    const log: AuditLog = {
      id: generateUUID(),
      user_id: this.data.currentUser?.id,
      user_name: this.data.currentUser?.name || 'System',
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    };
    this.data.auditLogs.push(log);

    if (isSupabaseConfigured()) {
      pushToCloud(supabase.from('audit_logs').upsert(log), 'Audit log error');
    }
  }

  // --- Agency Profile & Signature ---
  public getAgencyProfile(): AgencyProfile {
    if (!this.data.agencyProfile) {
      this.data.agencyProfile = { ...INITIAL_AGENCY_PROFILE };
    }
    return this.data.agencyProfile;
  }

  public saveAgencyProfile(profile: Partial<AgencyProfile>): AgencyProfile {
    const current = this.getAgencyProfile();
    this.data.agencyProfile = { ...current, ...profile };
    this.saveToStorage();
    this.notify();

    if (isSupabaseConfigured()) {
      pushToCloud(supabase.from('agency_profile').upsert({ id: 1, ...this.data.agencyProfile }), 'Agency profile error');
    }

    return this.data.agencyProfile;
  }

  public getSignatureImage(): string | null {
    const profile = this.getAgencyProfile();
    return profile.signature_url || (this.data as any).signatureImage || null;
  }

  public setSignatureImage(imageUrl: string | null) {
    const profile = this.getAgencyProfile();
    profile.signature_url = imageUrl || undefined;
    (this.data as any).signatureImage = imageUrl;
    this.saveToStorage();
    this.notify();

    if (isSupabaseConfigured()) {
      pushToCloud(supabase.from('agency_profile').upsert({ id: 1, ...profile, signature_url: imageUrl || undefined }), 'Signature update error');
    }
  }

  public getPaymentQR(): string | null {
    const profile = this.getAgencyProfile();
    return profile.payment_qr_url || null;
  }

  public setPaymentQR(qrUrl: string | null) {
    const profile = this.getAgencyProfile();
    profile.payment_qr_url = qrUrl || undefined;
    this.saveToStorage();
    this.notify();

    if (isSupabaseConfigured()) {
      pushToCloud(supabase.from('agency_profile').upsert({ id: 1, ...profile, payment_qr_url: qrUrl || undefined }), 'QR update error');
    }
  }
}

export const store = new Store();
