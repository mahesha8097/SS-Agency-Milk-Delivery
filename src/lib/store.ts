// Central Multi-Tenant Data Store & Service Layer for Nandini Milk Delivery
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
  BillItem,
  Expense,
  ExpenseCategory,
  ShopSettings,
  AgencyProfile,
  AuditLog,
  DeliveryStatus,
  BillingType,
  CustomerLedgerEntry,
} from './types';
import {
  calculateDeliveryTotals,
  calculateMonthlyInvoiceSummary,
  calculateHouseMonthlyBilling,
  calculateCustomerLedger,
  calculateExpectedSubscriptionBill,
  calculateTotalDeliveryCharge,
} from './calculations';
import { hashPassword, verifyPassword } from './authService';
import { queueOfflineDelivery, getPendingOfflineDeliveries, markDeliverySynced } from './offlineSync';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'ss_agency_store_v6_multitenant_production';

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

const DEFAULT_ADMIN_ID = '30000000-0000-0000-0000-000000000001';

export const INITIAL_USERS: AppUser[] = [
  {
    id: DEFAULT_ADMIN_ID,
    admin_id: DEFAULT_ADMIN_ID,
    name: 'S.S Agency Admin',
    phone: '7022754524',
    role: 'ADMIN',
    status: 'ACTIVE',
    username: 'admin',
    password: 'admin123', // Will be hashed during migration/init
    mobile_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    admin_id: DEFAULT_ADMIN_ID,
    name: 'Delivery Boy 1 (Ramesh)',
    phone: '9876543211',
    role: 'DELIVERY_BOY',
    status: 'ACTIVE',
    username: 'boy1',
    password: 'boy123',
    mobile_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    admin_id: DEFAULT_ADMIN_ID,
    name: 'Delivery Boy 2 (Suresh)',
    phone: '9876543212',
    role: 'DELIVERY_BOY',
    status: 'ACTIVE',
    username: 'boy2',
    password: 'boy223',
    mobile_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: '20000000-0000-0000-0000-000000000001', admin_id: DEFAULT_ADMIN_ID, product_code: 'BM1', name: 'Blue Milk 1L', category: 'MILK', packet_size_ml: 1000, unit: '1L', price: 44, delivery_charge_applicable: true, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '20000000-0000-0000-0000-000000000002', admin_id: DEFAULT_ADMIN_ID, product_code: 'BM5', name: 'Blue Milk 500ml', category: 'MILK', packet_size_ml: 500, unit: '500ml', price: 23, delivery_charge_applicable: true, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '20000000-0000-0000-0000-000000000003', admin_id: DEFAULT_ADMIN_ID, product_code: 'OM1', name: 'Orange Milk 1L', category: 'MILK', packet_size_ml: 1000, unit: '1L', price: 52, delivery_charge_applicable: true, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '20000000-0000-0000-0000-000000000004', admin_id: DEFAULT_ADMIN_ID, product_code: 'OM5', name: 'Orange Milk 500ml', category: 'MILK', packet_size_ml: 500, unit: '500ml', price: 27, delivery_charge_applicable: true, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '20000000-0000-0000-0000-000000000005', admin_id: DEFAULT_ADMIN_ID, product_code: 'SM1', name: 'Special Milk 1L', category: 'MILK', packet_size_ml: 1000, unit: '1L', price: 48, delivery_charge_applicable: true, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '20000000-0000-0000-0000-000000000006', admin_id: DEFAULT_ADMIN_ID, product_code: 'SM5', name: 'Special Milk 500ml', category: 'MILK', packet_size_ml: 500, unit: '500ml', price: 25, delivery_charge_applicable: true, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '20000000-0000-0000-0000-000000000007', admin_id: DEFAULT_ADMIN_ID, product_code: 'CD1', name: 'Curd 1L', category: 'CURD', packet_size_ml: 1000, unit: '1L', price: 55, delivery_charge_applicable: true, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '20000000-0000-0000-0000-000000000008', admin_id: DEFAULT_ADMIN_ID, product_code: 'CD5', name: 'Curd 500ml', category: 'CURD', packet_size_ml: 500, unit: '500ml', price: 28, delivery_charge_applicable: true, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '20000000-0000-0000-0000-000000000009', admin_id: DEFAULT_ADMIN_ID, product_code: 'PN2', name: 'Nandini Paneer 200g', category: 'PANEER', packet_size_ml: 200, unit: '200g', price: 95, delivery_charge_applicable: false, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '20000000-0000-0000-0000-000000000010', admin_id: DEFAULT_ADMIN_ID, product_code: 'GH5', name: 'Nandini Ghee 500ml', category: 'GHEE', packet_size_ml: 500, unit: '500ml', price: 320, delivery_charge_applicable: false, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Delivery Boy Payment',
  'Petrol / Fuel',
  'Rent',
  'Electricity',
  'Maintenance',
  'Shop Supplies',
  'Other',
];

export const INITIAL_AGENCY_PROFILE: AgencyProfile = {
  admin_id: DEFAULT_ADMIN_ID,
  business_name: 'Nandini Milk Parlour',
  shop_name: 'Nandini Milk Parlour',
  name: 'S.S Agency Admin',
  phone: '7022754524',
  alternate_phone: '',
  email: 'maheshgultedar545@gmail.com',
  account_beginning_date: '2026-07-27',
  business_type: 'Distributor',
  business_category: 'Dairy Farm Products',
  state: 'Karnataka',
  pincode: '560067',
  address: 'Nandini Milk Parlour, Opp. Nitesh Flushing Meadows, Towards Panchayat Road, Seegehalli, Bangalore',
  logo_url: '',
  signature_url: '',
  payment_qr_url: '',
  invoice_prefix: 'SS',
  terms_conditions: 'Goods once delivered in good condition are not returnable.\nThank you for choosing Nandini Milk Delivery!',
  footer_message: 'Thank you for choosing Nandini Milk Delivery!',
  milk_500ml_charge: 2,
  milk_1L_charge: 3,
  curd_first_packet_charge: 2,
  curd_additional_packet_charge: 1,
};

export interface StoreData {
  users: AppUser[];
  customers: Customer[];
  products: Product[];
  customerProducts: CustomerProductRequirement[];
  deliveries: DailyDelivery[];
  deliveryItems: DeliveryItem[];
  payments: Payment[];
  invoices: MonthlyInvoice[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  routes: Route[];
  shopSettings: Record<string, ShopSettings>;
  agencyProfile?: AgencyProfile;
  auditLogs: AuditLog[];
  currentUser: AppUser | null;
}

class Store {
  private data: StoreData = {
    users: INITIAL_USERS,
    customers: [],
    products: INITIAL_PRODUCTS,
    customerProducts: [],
    deliveries: [],
    deliveryItems: [],
    payments: [],
    invoices: [],
    expenses: [],
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES.map((cat, idx) => ({
      id: `cat-${idx + 1}`,
      admin_id: DEFAULT_ADMIN_ID,
      name: cat,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    })),
    routes: [],
    shopSettings: {
      [DEFAULT_ADMIN_ID]: {
        id: 'settings-1',
        admin_id: DEFAULT_ADMIN_ID,
        shop_name: 'Nandini Milk Parlour',
        admin_name: 'S.S Agency Admin',
        phone: '7022754524',
        alternate_phone: '',
        address: 'Nandini Milk Parlour, Opp. Nitesh Flushing Meadows, Towards Panchayat Road, Seegehalli, Bangalore',
        invoice_prefix: 'SS',
        footer_message: 'Thank you for choosing Nandini Milk Delivery!',
        milk_500ml_charge: 2,
        milk_1L_charge: 3,
        curd_first_packet_charge: 2,
        curd_additional_packet_charge: 1,
        allow_auto_recalculation: true,
        updated_at: new Date().toISOString(),
      },
    },
    agencyProfile: INITIAL_AGENCY_PROFILE,
    auditLogs: [],
    currentUser: INITIAL_USERS[0],
  };

  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
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
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
      } else {
        // Migration from older v5 store if exists
        const legacyRaw = localStorage.getItem('ss_agency_store_v5_clean_customers');
        if (legacyRaw) {
          try {
            const legacyData = JSON.parse(legacyRaw);
            if (legacyData.customers && Array.isArray(legacyData.customers)) {
              this.data.customers = legacyData.customers.map((c: any) => ({
                ...c,
                admin_id: c.admin_id || DEFAULT_ADMIN_ID,
                customer_type: c.is_bulk_order || c.customer_category === 'BULK_ORDER' ? 'BULK' : 'HOUSE',
                opening_credit: c.opening_credit || 0,
                opening_pending: c.opening_pending || 0,
              }));
            }
            if (legacyData.deliveries) {
              this.data.deliveries = legacyData.deliveries.map((d: any) => ({
                ...d,
                admin_id: d.admin_id || DEFAULT_ADMIN_ID,
              }));
            }
            if (legacyData.payments) {
              this.data.payments = legacyData.payments.map((p: any) => ({
                ...p,
                admin_id: p.admin_id || DEFAULT_ADMIN_ID,
                status: p.status || 'ACTIVE',
              }));
            }
            if (legacyData.invoices) {
              this.data.invoices = legacyData.invoices.map((inv: any) => ({
                ...inv,
                admin_id: inv.admin_id || DEFAULT_ADMIN_ID,
              }));
            }
          } catch (e) {
            console.error('Legacy migration parse error', e);
          }
        }
        this.saveToStorage();
      }
      this.syncUsersToCloud();
    } catch (e) {
      console.error('Failed to load local store', e);
    }
  }

  public async syncUsersToCloud() {
    if (!isSupabaseConfigured() || typeof window === 'undefined') return;
    try {
      for (const u of this.data.users) {
        await supabase.from('users').upsert(
          {
            id: u.id,
            admin_id: u.role === 'ADMIN' ? null : (u.admin_id || null),
            name: u.name,
            phone: u.phone,
            role: u.role,
            status: u.status || 'ACTIVE',
            username: u.username,
            password_hash: u.password,
            mobile_verified: u.mobile_verified ?? true,
            created_at: u.created_at || new Date().toISOString(),
            updated_at: u.updated_at || new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      }
    } catch (e) {
      console.warn('Background user cloud sync error:', e);
    }
  }

  private saveToStorage() {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save local store', e);
    }
  }

  // --- Multi-Tenant Context Helper ---
  public getActiveAdminId(): string {
    const user = this.data.currentUser;
    if (!user) return DEFAULT_ADMIN_ID;
    if (user.role === 'ADMIN') return user.id;
    return user.admin_id || DEFAULT_ADMIN_ID;
  }

  // --- Current User Management ---
  public getCurrentUser(): AppUser | null {
    return this.data.currentUser;
  }

  public setCurrentUser(user: AppUser | null) {
    this.data.currentUser = user;
    this.notify();
  }

  // --- Authentication ---
  public async authenticate(usernameOrMobile: string, passwordInput: string): Promise<{ success: boolean; user?: AppUser; message?: string }> {
    if (!usernameOrMobile || !passwordInput) {
      return { success: false, message: 'Please enter both username/mobile and password.' };
    }

    const cleanInput = usernameOrMobile.trim().toLowerCase();
    const cleanPhone = usernameOrMobile.replace(/\D/g, '');

    let user = this.data.users.find(
      (u) =>
        u.username?.trim().toLowerCase() === cleanInput ||
        (cleanPhone.length >= 10 && u.phone?.replace(/\D/g, '') === cleanPhone)
    );

    // If not found in local cache and Supabase is configured, check Supabase cloud database
    if (!user && isSupabaseConfigured()) {
      try {
        const { data: cloudUsers, error } = await supabase
          .from('users')
          .select('*')
          .or(`username.ilike.${cleanInput},phone.eq.${cleanPhone.length >= 10 ? cleanPhone : 'NONE'}`)
          .limit(1);

        if (!error && cloudUsers && cloudUsers.length > 0) {
          const cloudUser = cloudUsers[0];
          user = {
            id: cloudUser.id,
            admin_id: cloudUser.admin_id || cloudUser.id,
            name: cloudUser.name,
            phone: cloudUser.phone,
            role: cloudUser.role,
            status: cloudUser.status || 'ACTIVE',
            username: cloudUser.username,
            password: cloudUser.password_hash || cloudUser.password,
            mobile_verified: cloudUser.mobile_verified ?? true,
            created_at: cloudUser.created_at || new Date().toISOString(),
            updated_at: cloudUser.updated_at || new Date().toISOString(),
          };
          // Cache locally
          const existingIdx = this.data.users.findIndex((u) => u.id === user!.id);
          if (existingIdx >= 0) {
            this.data.users[existingIdx] = user;
          } else {
            this.data.users.push(user);
          }
          this.saveToStorage();
        }
      } catch (e) {
        console.warn('Could not query Supabase cloud for user:', e);
      }
    }

    if (!user || user.status === 'INACTIVE') {
      return { success: false, message: 'Invalid username/mobile or password. If you registered on another device, please ensure database sync is complete or use the Admin credentials.' };
    }

    const isMatch = await verifyPassword(passwordInput, user.password);
    if (!isMatch) {
      return { success: false, message: 'Invalid username/mobile or password.' };
    }

    // Set session user
    this.data.currentUser = user;
    this.notify();
    return { success: true, user };
  }

  // Backward compatibility synchronous login
  public login(usernameOrPhone: string, role?: string, password?: string): AppUser | null {
    if (!usernameOrPhone) return null;
    const cleanInput = usernameOrPhone.trim().toLowerCase();
    const cleanPhone = cleanInput.replace(/\D/g, '');

    const user = this.data.users.find((u) => {
      const nameMatch =
        u.username?.trim().toLowerCase() === cleanInput ||
        (cleanPhone.length >= 10 && u.phone?.replace(/\D/g, '') === cleanPhone);
      const roleMatch = role ? u.role === role : true;
      return nameMatch && roleMatch && u.status === 'ACTIVE';
    });

    if (user) {
      this.data.currentUser = user;
      this.notify();
      return user;
    }
    return null;
  }

  // Admin Registration
  public async registerAdmin(params: {
    fullName: string;
    mobile: string;
    username: string;
    passwordInput: string;
    shopName?: string;
    address?: string;
  }): Promise<{ success: boolean; user?: AppUser; message?: string }> {
    const { fullName, mobile, username, passwordInput, shopName, address } = params;
    const cleanPhone = mobile.replace(/\D/g, '');
    const cleanUsername = username.trim().toLowerCase();

    if (cleanPhone.length < 10) {
      return { success: false, message: 'Mobile number must be at least 10 digits.' };
    }
    if (cleanUsername.length < 3) {
      return { success: false, message: 'Username must be at least 3 characters long.' };
    }
    if (!passwordInput || passwordInput.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    const existing = this.data.users.find(
      (u) => u.username.toLowerCase() === cleanUsername || u.phone.replace(/\D/g, '') === cleanPhone
    );
    if (existing) {
      return { success: false, message: 'An account with this username or mobile number already exists.' };
    }

    const newAdminId = generateUUID();
    const passwordHash = await hashPassword(passwordInput);

    const newAdmin: AppUser = {
      id: newAdminId,
      admin_id: newAdminId,
      name: fullName.trim(),
      phone: cleanPhone,
      role: 'ADMIN',
      status: 'ACTIVE',
      username: cleanUsername,
      password: passwordHash,
      mobile_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.users.push(newAdmin);

    // Sync to Supabase cloud users table if configured
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('users').insert({
          id: newAdminId,
          admin_id: null,
          name: fullName.trim(),
          phone: cleanPhone,
          role: 'ADMIN',
          status: 'ACTIVE',
          username: cleanUsername,
          password_hash: passwordHash,
          mobile_verified: true,
          created_at: newAdmin.created_at,
          updated_at: newAdmin.updated_at,
        });
      } catch (e) {
        console.warn('Could not sync newly registered user to Supabase:', e);
      }
    }

    // Initialize Default Shop Settings for new Admin
    const adminShopName = shopName?.trim() || `${fullName}'s Nandini Milk Parlour`;
    const adminAddress = address?.trim() || 'Bangalore, Karnataka';

    this.data.shopSettings[newAdminId] = {
      id: generateUUID(),
      admin_id: newAdminId,
      shop_name: adminShopName,
      admin_name: fullName.trim(),
      phone: cleanPhone,
      address: adminAddress,
      invoice_prefix: 'SS',
      footer_message: 'Thank you for choosing Nandini Milk Delivery!',
      milk_500ml_charge: 2,
      milk_1L_charge: 3,
      curd_first_packet_charge: 2,
      curd_additional_packet_charge: 1,
      allow_auto_recalculation: true,
      updated_at: new Date().toISOString(),
    };

    // Seed default Nandini products for this Admin
    const adminProducts: Product[] = [
      { id: generateUUID(), admin_id: newAdminId, product_code: 'BM1', name: 'Blue Milk 1L', category: 'MILK', packet_size_ml: 1000, unit: '1L', price: 44, delivery_charge_applicable: true, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateUUID(), admin_id: newAdminId, product_code: 'BM5', name: 'Blue Milk 500ml', category: 'MILK', packet_size_ml: 500, unit: '500ml', price: 23, delivery_charge_applicable: true, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateUUID(), admin_id: newAdminId, product_code: 'OM1', name: 'Orange Milk 1L', category: 'MILK', packet_size_ml: 1000, unit: '1L', price: 52, delivery_charge_applicable: true, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateUUID(), admin_id: newAdminId, product_code: 'OM5', name: 'Orange Milk 500ml', category: 'MILK', packet_size_ml: 500, unit: '500ml', price: 27, delivery_charge_applicable: true, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateUUID(), admin_id: newAdminId, product_code: 'SM1', name: 'Special Milk 1L', category: 'MILK', packet_size_ml: 1000, unit: '1L', price: 48, delivery_charge_applicable: true, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateUUID(), admin_id: newAdminId, product_code: 'SM5', name: 'Special Milk 500ml', category: 'MILK', packet_size_ml: 500, unit: '500ml', price: 25, delivery_charge_applicable: true, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateUUID(), admin_id: newAdminId, product_code: 'CD1', name: 'Curd 1L', category: 'CURD', packet_size_ml: 1000, unit: '1L', price: 55, delivery_charge_applicable: true, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateUUID(), admin_id: newAdminId, product_code: 'CD5', name: 'Curd 500ml', category: 'CURD', packet_size_ml: 500, unit: '500ml', price: 28, delivery_charge_applicable: true, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
    this.data.products.push(...adminProducts);

    // Seed default expense categories for this Admin
    const adminExpCats: ExpenseCategory[] = DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
      id: generateUUID(),
      admin_id: newAdminId,
      name: cat,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    }));
    this.data.expenseCategories.push(...adminExpCats);

    this.data.currentUser = newAdmin;
    this.notify();
    return { success: true, user: newAdmin };
  }

  // Password Reset & Change
  public async resetPassword(usernameOrMobile: string, newPasswordInput: string): Promise<boolean> {
    const cleanInput = usernameOrMobile.trim().toLowerCase();
    const cleanPhone = usernameOrMobile.replace(/\D/g, '');
    const user = this.data.users.find(
      (u) =>
        u.username?.trim().toLowerCase() === cleanInput ||
        (cleanPhone.length >= 10 && u.phone?.replace(/\D/g, '') === cleanPhone)
    );
    if (!user) return false;
    user.password = await hashPassword(newPasswordInput);
    user.updated_at = new Date().toISOString();
    this.notify();
    return true;
  }

  public async changePassword(userId: string, currentPass: string, newPass: string): Promise<{ success: boolean; message: string }> {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return { success: false, message: 'User not found.' };
    const isValid = await verifyPassword(currentPass, user.password);
    if (!isValid) return { success: false, message: 'Current password is incorrect.' };
    user.password = await hashPassword(newPass);
    user.updated_at = new Date().toISOString();
    this.notify();
    return { success: true, message: 'Password changed successfully.' };
  }

  // --- Delivery Boys Management (Admin Only) ---
  public getDeliveryBoys(adminId?: string): AppUser[] {
    const aid = adminId || this.getActiveAdminId();
    return this.data.users.filter((u) => u.role === 'DELIVERY_BOY' && u.admin_id === aid);
  }

  public async addDeliveryBoy(data: { name: string; phone: string; username: string; passwordInput: string }): Promise<AppUser> {
    const aid = this.getActiveAdminId();
    const cleanPhone = data.phone.replace(/\D/g, '');
    const cleanUsername = data.username.trim().toLowerCase();

    const passwordHash = await hashPassword(data.passwordInput);
    const newBoy: AppUser = {
      id: generateUUID(),
      admin_id: aid,
      name: data.name.trim(),
      phone: cleanPhone,
      role: 'DELIVERY_BOY',
      status: 'ACTIVE',
      username: cleanUsername,
      password: passwordHash,
      mobile_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.users.push(newBoy);
    this.notify();
    return newBoy;
  }

  public updateDeliveryBoy(id: string, updates: Partial<AppUser>): AppUser | null {
    const boy = this.data.users.find((u) => u.id === id && u.role === 'DELIVERY_BOY');
    if (!boy) return null;
    Object.assign(boy, updates, { updated_at: new Date().toISOString() });
    this.notify();
    return boy;
  }

  public async resetDeliveryBoyPassword(id: string, newPasswordInput: string): Promise<boolean> {
    const boy = this.data.users.find((u) => u.id === id && u.role === 'DELIVERY_BOY');
    if (!boy) return false;
    boy.password = await hashPassword(newPasswordInput);
    boy.updated_at = new Date().toISOString();
    this.notify();
    return true;
  }

  public deactivateDeliveryBoy(id: string): { success: boolean; assignedCount: number } {
    const aid = this.getActiveAdminId();
    const boy = this.data.users.find((u) => u.id === id && u.admin_id === aid);
    if (!boy) return { success: false, assignedCount: 0 };

    const assignedCusts = this.data.customers.filter(
      (c) => (c.assigned_delivery_boy_id === id || c.delivery_boy_id === id) && c.status === 'ACTIVE'
    );

    boy.status = 'INACTIVE';
    boy.updated_at = new Date().toISOString();
    this.notify();
    return { success: true, assignedCount: assignedCusts.length };
  }

  // --- Customers Management ---
  public getCustomers(adminId?: string): Customer[] {
    const aid = adminId || this.getActiveAdminId();
    const currentUser = this.data.currentUser;

    let custs = this.data.customers.filter((c) => c.admin_id === aid);

    // If active user is Delivery Boy, only return their assigned customers
    if (currentUser && currentUser.role === 'DELIVERY_BOY') {
      custs = custs.filter(
        (c) =>
          (c.assigned_delivery_boy_id === currentUser.id || c.delivery_boy_id === currentUser.id) &&
          c.status === 'ACTIVE'
      );
    }

    return custs;
  }

  public getCustomerById(id: string): Customer | null {
    const aid = this.getActiveAdminId();
    return this.data.customers.find((c) => c.id === id && c.admin_id === aid) || null;
  }

  public getCustomersByDeliveryBoy(deliveryBoyId: string): Customer[] {
    const aid = this.getActiveAdminId();
    return this.data.customers.filter(
      (c) =>
        c.admin_id === aid &&
        (c.assigned_delivery_boy_id === deliveryBoyId || c.delivery_boy_id === deliveryBoyId) &&
        c.status === 'ACTIVE'
    );
  }

  public addCustomer(data: Omit<Customer, 'id' | 'admin_id' | 'created_at' | 'updated_at'>): Customer {
    const aid = this.getActiveAdminId();
    const newCustomer: Customer = {
      ...data,
      id: generateUUID(),
      admin_id: aid,
      delivery_boy_id: data.assigned_delivery_boy_id || data.delivery_boy_id || '',
      assigned_delivery_boy_id: data.assigned_delivery_boy_id || data.delivery_boy_id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.customers.push(newCustomer);
    this.notify();
    return newCustomer;
  }

  public updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const aid = this.getActiveAdminId();
    const customer = this.data.customers.find((c) => c.id === id && c.admin_id === aid);
    if (!customer) return null;

    if (updates.assigned_delivery_boy_id) {
      updates.delivery_boy_id = updates.assigned_delivery_boy_id;
    }

    Object.assign(customer, updates, { updated_at: new Date().toISOString() });
    this.notify();
    return customer;
  }

  public deactivateCustomer(id: string): boolean {
    const aid = this.getActiveAdminId();
    const customer = this.data.customers.find((c) => c.id === id && c.admin_id === aid);
    if (!customer) return false;
    customer.status = 'INACTIVE';
    customer.updated_at = new Date().toISOString();
    this.notify();
    return true;
  }

  public assignDeliveryBoyToCustomers(customerIds: string[], deliveryBoyId: string): void {
    const aid = this.getActiveAdminId();
    this.data.customers.forEach((c) => {
      if (c.admin_id === aid && customerIds.includes(c.id)) {
        c.assigned_delivery_boy_id = deliveryBoyId;
        c.delivery_boy_id = deliveryBoyId;
        c.updated_at = new Date().toISOString();
      }
    });
    this.notify();
  }

  // --- Customer Products Requirements ---
  public getCustomerProducts(customerId: string): CustomerProductRequirement[] {
    const aid = this.getActiveAdminId();
    return this.data.customerProducts.filter((cp) => cp.customer_id === customerId && cp.admin_id === aid);
  }

  public setCustomerProducts(
    customerId: string,
    requirements: { product_id: string; quantity: number; unit?: string; effective_from?: string }[]
  ): void {
    const aid = this.getActiveAdminId();
    // Remove existing for this customer
    this.data.customerProducts = this.data.customerProducts.filter(
      (cp) => !(cp.customer_id === customerId && cp.admin_id === aid)
    );

    const today = new Date().toISOString().split('T')[0];

    requirements.forEach((req) => {
      if (req.quantity > 0) {
        this.data.customerProducts.push({
          id: generateUUID(),
          admin_id: aid,
          customer_id: customerId,
          product_id: req.product_id,
          quantity: req.quantity,
          default_packets: req.quantity,
          unit: req.unit || 'Packet',
          effective_from: req.effective_from || today,
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
        });
      }
    });
    this.notify();
  }

  public setCustomerProductRequirement(customerId: string, productId: string, qty: number): void {
    const aid = this.getActiveAdminId();
    const existing = this.data.customerProducts.find(
      (cp) => cp.customer_id === customerId && cp.product_id === productId && cp.admin_id === aid
    );
    if (existing) {
      existing.quantity = qty;
      existing.default_packets = qty;
      existing.status = qty > 0 ? 'ACTIVE' : 'INACTIVE';
    } else if (qty > 0) {
      this.data.customerProducts.push({
        id: generateUUID(),
        admin_id: aid,
        customer_id: customerId,
        product_id: productId,
        quantity: qty,
        default_packets: qty,
        effective_from: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      });
    }
    this.notify();
  }

  // --- Products Management ---
  public getProducts(adminId?: string): Product[] {
    const aid = adminId || this.getActiveAdminId();
    return this.data.products.filter((p) => p.admin_id === aid);
  }

  public addProduct(data: Omit<Product, 'id' | 'admin_id' | 'created_at' | 'updated_at'>): Product {
    const aid = this.getActiveAdminId();
    const newProduct: Product = {
      ...data,
      id: generateUUID(),
      admin_id: aid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.products.push(newProduct);
    this.notify();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const aid = this.getActiveAdminId();
    const prod = this.data.products.find((p) => p.id === id && p.admin_id === aid);
    if (!prod) return null;
    Object.assign(prod, updates, { updated_at: new Date().toISOString() });
    this.notify();
    return prod;
  }

  public toggleProductStatus(id: string): boolean {
    const aid = this.getActiveAdminId();
    const prod = this.data.products.find((p) => p.id === id && p.admin_id === aid);
    if (!prod) return false;
    prod.active = !prod.active;
    prod.updated_at = new Date().toISOString();
    this.notify();
    return true;
  }

  public deactivateProduct(id: string): boolean {
    const aid = this.getActiveAdminId();
    const prod = this.data.products.find((p) => p.id === id && p.admin_id === aid);
    if (!prod) return false;
    prod.active = false;
    prod.updated_at = new Date().toISOString();
    this.notify();
    return true;
  }

  public deleteProduct(id: string): { success: boolean; deactivated?: boolean; message: string } {
    const aid = this.getActiveAdminId();
    const prod = this.data.products.find((p) => p.id === id && p.admin_id === aid);
    if (!prod) return { success: false, message: 'Product not found.' };

    // Check if product is in customer requirements or delivery items
    const hasCustomerReqs = this.data.customerProducts.some(
      (cp) => (cp.product_id === id || (cp as any).productId === id) && cp.admin_id === aid
    );
    const hasDeliveries = this.data.deliveries.some(
      (d) => d.admin_id === aid && (d.items || []).some((item: any) => item.product_id === id || item.productId === id)
    );

    if (hasCustomerReqs || hasDeliveries) {
      prod.active = false;
      prod.updated_at = new Date().toISOString();
      this.notify();
      return {
        success: true,
        deactivated: true,
        message: `Product "${prod.name}" has historical delivery/subscription records and was safely deactivated instead of deleted.`,
      };
    }

    this.data.products = this.data.products.filter((p) => p.id !== id);
    this.notify();
    return {
      success: true,
      deactivated: false,
      message: `Product "${prod.name}" deleted successfully.`,
    };
  }

  // --- Deliveries Management ---
  public getDeliveries(dateStr?: string, adminId?: string): DailyDelivery[] {
    const aid = adminId || this.getActiveAdminId();
    const currentUser = this.data.currentUser;

    let dels = this.data.deliveries.filter((d) => d.admin_id === aid);
    if (dateStr) {
      dels = dels.filter((d) => d.delivery_date === dateStr);
    }

    if (currentUser && currentUser.role === 'DELIVERY_BOY') {
      dels = dels.filter((d) => d.delivery_boy_id === currentUser.id);
    }

    return dels;
  }

  public getExistingDelivery(customerId: string, dateStr: string): DailyDelivery | undefined {
    const aid = this.getActiveAdminId();
    return this.data.deliveries.find(
      (d) => d.admin_id === aid && d.customer_id === customerId && d.delivery_date === dateStr
    );
  }

  public getDeliveryItems(deliveryId: string): DeliveryItem[] {
    return this.data.deliveryItems.filter((di) => di.delivery_id === deliveryId);
  }

  public saveDelivery(
    deliveryData: Omit<DailyDelivery, 'id' | 'admin_id' | 'created_at' | 'updated_at'>,
    items: Omit<DeliveryItem, 'id' | 'delivery_id' | 'created_at'>[] = []
  ): DailyDelivery {
    const aid = this.getActiveAdminId();
    const existingIndex = this.data.deliveries.findIndex(
      (d) =>
        d.admin_id === aid &&
        d.customer_id === deliveryData.customer_id &&
        d.delivery_date === deliveryData.delivery_date
    );

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    let deliveryId = generateUUID();
    if (existingIndex >= 0) {
      deliveryId = this.data.deliveries[existingIndex].id;
      // Check if affected bill exists and flag for recalculation
      this.flagAffectedInvoiceForRecalculation(aid, deliveryData.customer_id, deliveryData.delivery_date);

      this.data.deliveries[existingIndex] = {
        ...this.data.deliveries[existingIndex],
        ...deliveryData,
        delivered_at: deliveryData.delivered_at || formattedTime,
        updated_at: now.toISOString(),
      };
      // Replace items
      this.data.deliveryItems = this.data.deliveryItems.filter((di) => di.delivery_id !== deliveryId);
    } else {
      const newDel: DailyDelivery = {
        ...deliveryData,
        id: deliveryId,
        admin_id: aid,
        delivered_at: deliveryData.delivered_at || formattedTime,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      this.data.deliveries.push(newDel);
    }

    // Save items with unit price snapshot
    items.forEach((item) => {
      this.data.deliveryItems.push({
        ...item,
        id: generateUUID(),
        delivery_id: deliveryId,
        created_at: now.toISOString(),
      });
    });

    this.notify();
    return this.data.deliveries.find((d) => d.id === deliveryId)!;
  }

  public correctDelivery(deliveryId: string, updates: Partial<DailyDelivery>): DailyDelivery | null {
    const aid = this.getActiveAdminId();
    const del = this.data.deliveries.find((d) => d.id === deliveryId && d.admin_id === aid);
    if (!del) return null;

    this.flagAffectedInvoiceForRecalculation(aid, del.customer_id, del.delivery_date);

    Object.assign(del, updates, { updated_at: new Date().toISOString() });
    this.notify();
    return del;
  }

  private flagAffectedInvoiceForRecalculation(adminId: string, customerId: string, deliveryDate: string) {
    const monthYear = deliveryDate.slice(0, 7);
    const invoice = this.data.invoices.find(
      (inv) => inv.admin_id === adminId && inv.customer_id === customerId && inv.month_year === monthYear
    );
    if (invoice) {
      invoice.recalculation_required = true;
    }
  }

  // --- Payments Management ---
  public getPayments(adminId?: string, customerId?: string): Payment[] {
    const aid = adminId || this.getActiveAdminId();
    let pays = this.data.payments.filter((p) => p.admin_id === aid);
    if (customerId) {
      pays = pays.filter((p) => p.customer_id === customerId);
    }
    return pays;
  }

  public recordPayment(data: Omit<Payment, 'id' | 'admin_id' | 'created_at' | 'status'>): Payment {
    const aid = this.getActiveAdminId();
    const newPayment: Payment = {
      ...data,
      id: generateUUID(),
      admin_id: aid,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.payments.push(newPayment);
    this.notify();
    return newPayment;
  }

  public updatePayment(id: string, updates: Partial<Payment>): Payment | null {
    const aid = this.getActiveAdminId();
    const payment = this.data.payments.find((p) => p.id === id && p.admin_id === aid);
    if (!payment) return null;
    Object.assign(payment, updates, { updated_at: new Date().toISOString() });
    this.notify();
    return payment;
  }

  public voidPayment(id: string, reason: string): boolean {
    const aid = this.getActiveAdminId();
    const payment = this.data.payments.find((p) => p.id === id && p.admin_id === aid);
    if (!payment) return false;
    payment.status = 'VOIDED';
    payment.void_reason = reason;
    payment.updated_at = new Date().toISOString();
    this.notify();
    return true;
  }

  // --- Expenses Management (Admin Only) ---
  public getExpenses(adminId?: string): Expense[] {
    const aid = adminId || this.getActiveAdminId();
    return this.data.expenses.filter((e) => e.admin_id === aid);
  }

  public getExpenseCategories(adminId?: string): ExpenseCategory[] {
    const aid = adminId || this.getActiveAdminId();
    return this.data.expenseCategories.filter((c) => c.admin_id === aid && c.status === 'ACTIVE');
  }

  public addExpenseCategory(name: string): ExpenseCategory {
    const aid = this.getActiveAdminId();
    const newCat: ExpenseCategory = {
      id: generateUUID(),
      admin_id: aid,
      name: name.trim(),
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };
    this.data.expenseCategories.push(newCat);
    this.notify();
    return newCat;
  }

  public addExpense(data: Omit<Expense, 'id' | 'admin_id' | 'created_at' | 'updated_at' | 'status'>): Expense {
    const aid = this.getActiveAdminId();
    const cat = this.data.expenseCategories.find((c) => c.id === data.category_id);
    const newExp: Expense = {
      ...data,
      id: generateUUID(),
      admin_id: aid,
      category_name: cat?.name || 'Other',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.expenses.push(newExp);
    this.notify();
    return newExp;
  }

  public updateExpense(id: string, updates: Partial<Expense>): Expense | null {
    const aid = this.getActiveAdminId();
    const exp = this.data.expenses.find((e) => e.id === id && e.admin_id === aid);
    if (!exp) return null;
    Object.assign(exp, updates, { updated_at: new Date().toISOString() });
    this.notify();
    return exp;
  }

  public voidExpense(id: string, reason: string): boolean {
    const aid = this.getActiveAdminId();
    const exp = this.data.expenses.find((e) => e.id === id && e.admin_id === aid);
    if (!exp) return false;
    exp.status = 'VOIDED';
    exp.void_reason = reason;
    exp.updated_at = new Date().toISOString();
    this.notify();
    return true;
  }

  // --- Monthly Bills & Invoices Engine ---
  public getInvoices(adminId?: string): MonthlyInvoice[] {
    const aid = adminId || this.getActiveAdminId();
    return this.data.invoices.filter((inv) => inv.admin_id === aid);
  }

  public getInvoiceById(id: string): MonthlyInvoice | null {
    const aid = this.getActiveAdminId();
    return this.data.invoices.find((inv) => inv.id === id && inv.admin_id === aid) || null;
  }

  /**
   * Generates or updates monthly bills based strictly on ACTUAL daily delivery records.
   * Calculates credit and pending carry forward transparently.
   */
  public generateMonthlyBills(monthYear: string, targetCustomerIds?: string[]): { created: number; updated: number } {
    const aid = this.getActiveAdminId();
    const customers = this.getCustomers(aid).filter((c) => c.status === 'ACTIVE');
    const settings = this.getShopSettings(aid);
    const prefix = settings?.invoice_prefix || 'SS';

    const selectedCusts = targetCustomerIds
      ? customers.filter((c) => targetCustomerIds.includes(c.id))
      : customers;

    let created = 0;
    let updated = 0;

    selectedCusts.forEach((c) => {
      // 1. Load actual delivery records for this month
      const custDeliveries = this.data.deliveries.filter(
        (d) => d.admin_id === aid && d.customer_id === c.id && d.delivery_date.startsWith(monthYear)
      );

      // 2. Load active payments for this month
      const custPayments = this.data.payments.filter(
        (p) => p.admin_id === aid && p.customer_id === c.id && p.status === 'ACTIVE' && p.payment_date.startsWith(monthYear)
      );

      // 3. Load previous month balance (credit or pending carry forward)
      const prevCredit = c.opening_credit || 0;
      const prevPending = c.opening_pending || 0;

      const isBulk = c.customer_type === 'BULK' || c.is_bulk_order || c.customer_category === 'BULK_ORDER';
      const bType: BillingType = c.payment_type === 'PREPAID' ? 'PREPAID' : 'POSTPAID';

      const reqs = this.getCustomerProducts(c.id);
      const prods = this.getProducts(aid);

      // 4. Run billing engine calculations
      const billing = calculateHouseMonthlyBilling(
        bType,
        custDeliveries,
        custPayments,
        prevCredit,
        prevPending,
        reqs,
        prods,
        monthYear
      );

      const existingIndex = this.data.invoices.findIndex(
        (inv) => inv.admin_id === aid && inv.customer_id === c.id && inv.month_year === monthYear
      );

      const invoiceNumber = `${prefix}-${monthYear.replace('-', '')}-${c.customer_code || c.id.slice(0, 4).toUpperCase()}`;

      const billData: MonthlyInvoice = {
        id: existingIndex >= 0 ? this.data.invoices[existingIndex].id : generateUUID(),
        admin_id: aid,
        invoice_number: invoiceNumber,
        customer_id: c.id,
        month_year: monthYear,
        billing_period: `${new Date(monthYear + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`,
        billing_type: bType,
        date_start: `${monthYear}-01`,
        date_end: `${monthYear}-28`,
        total_product_amount: billing.totalProductAmount,
        total_delivery_charges: isBulk ? 0 : billing.totalDeliveryCharges,
        grand_total: billing.actualMonthlyBill,
        previous_pending: billing.previousPending,
        previous_balance_credit: billing.previousBalanceCredit,
        previous_credit: billing.previousBalanceCredit,
        advance_paid: billing.advancePaid,
        payment_received: billing.advancePaid,
        total_payable: billing.amountPayable,
        amount_payable: billing.amountPayable,
        remaining_pending: billing.extraAmountToPay,
        remaining_credit: billing.remainingCredit,
        next_month_estimate: billing.nextMonthEstimate,
        next_month_amount_to_pay: billing.nextMonthAmountToPay,
        status: billing.status,
        balance_status: billing.remainingCredit > 0 ? 'CREDIT' : billing.extraAmountToPay > 0 ? 'PENDING' : 'NONE',
        recalculation_required: false,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        this.data.invoices[existingIndex] = billData;
        updated++;
      } else {
        this.data.invoices.push(billData);
        created++;
      }
    });

    this.notify();
    return { created, updated };
  }

  public recalculateInvoice(invoiceId: string): boolean {
    const aid = this.getActiveAdminId();
    const invoice = this.data.invoices.find((inv) => inv.id === invoiceId && inv.admin_id === aid);
    if (!invoice) return false;

    this.generateMonthlyBills(invoice.month_year, [invoice.customer_id]);
    return true;
  }

  // --- Shop Settings & Profile ---
  public getShopSettings(adminId?: string): ShopSettings {
    const aid = adminId || this.getActiveAdminId();
    if (this.data.shopSettings[aid]) {
      return this.data.shopSettings[aid];
    }
    const defaultSettings: ShopSettings = {
      id: generateUUID(),
      admin_id: aid,
      shop_name: 'Nandini Milk Parlour',
      admin_name: 'S.S Agency Admin',
      phone: '7022754524',
      alternate_phone: '',
      address: 'Bangalore, Karnataka',
      invoice_prefix: 'SS',
      footer_message: 'Thank you for choosing Nandini Milk Delivery!',
      milk_500ml_charge: 2,
      milk_1L_charge: 3,
      curd_first_packet_charge: 2,
      curd_additional_packet_charge: 1,
      allow_auto_recalculation: true,
      updated_at: new Date().toISOString(),
    };
    this.data.shopSettings[aid] = defaultSettings;
    return defaultSettings;
  }

  public updateShopSettings(updates: Partial<ShopSettings>): ShopSettings {
    const aid = this.getActiveAdminId();
    const current = this.getShopSettings(aid);
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
    this.data.shopSettings[aid] = updated;

    // Sync to legacy agency profile for compatibility
    this.data.agencyProfile = {
      ...this.data.agencyProfile,
      ...updated,
      business_name: updated.shop_name,
      email: this.data.agencyProfile?.email || 'admin@nandinimilk.com',
    };

    this.notify();
    return updated;
  }

  public getAgencyProfile(adminId?: string): AgencyProfile {
    const settings = this.getShopSettings(adminId);
    return {
      ...this.data.agencyProfile,
      ...settings,
      business_name: settings.shop_name,
      email: this.data.agencyProfile?.email || 'admin@nandinimilk.com',
    };
  }

  public updateAgencyProfile(data: Partial<AgencyProfile>): AgencyProfile {
    return {
      ...this.data.agencyProfile,
      ...this.updateShopSettings(data),
      business_name: data.shop_name || data.business_name || 'Nandini Milk Parlour',
      email: data.email || 'admin@nandinimilk.com',
    };
  }

  // --- Routes Management ---
  public getRoutes(adminId?: string): Route[] {
    const aid = adminId || this.getActiveAdminId();
    return this.data.routes.filter((r) => !r.admin_id || r.admin_id === aid);
  }

  public addRoute(data: Omit<Route, 'id' | 'created_at' | 'updated_at'>): Route {
    const aid = this.getActiveAdminId();
    const newRoute: Route = {
      ...data,
      id: generateUUID(),
      admin_id: aid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.routes.push(newRoute);
    this.notify();
    return newRoute;
  }

  public updateRoute(id: string, updates: Partial<Route>): Route | null {
    const aid = this.getActiveAdminId();
    const route = this.data.routes.find((r) => r.id === id && (!r.admin_id || r.admin_id === aid));
    if (!route) return null;
    Object.assign(route, updates, { updated_at: new Date().toISOString() });
    this.notify();
    return route;
  }

  public deleteRoute(id: string): boolean {
    const aid = this.getActiveAdminId();
    const idx = this.data.routes.findIndex((r) => r.id === id && (!r.admin_id || r.admin_id === aid));
    if (idx < 0) return false;
    this.data.routes.splice(idx, 1);
    this.notify();
    return true;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs || [];
  }

  public getUsers(): AppUser[] {
    const aid = this.getActiveAdminId();
    return this.data.users.filter((u) => u.admin_id === aid || u.id === aid);
  }

  public getRealtimeStatus() {
    return { connected: true, lastEvent: null };
  }

  public async syncPendingOfflineQueue(): Promise<{ synced: number }> {
    return { synced: 0 };
  }

  public saveDailyDelivery(
    customerIdOrData: any,
    deliveryBoyId?: string,
    routeId?: string,
    dateStr?: string,
    status?: any,
    itemsOrEntries?: any[],
    notesOrRemarks?: string,
    existingId?: string
  ) {
    if (typeof customerIdOrData === 'object' && customerIdOrData !== null) {
      return this.saveDelivery(customerIdOrData, deliveryBoyId as any);
    }
    const items = (itemsOrEntries || []).map((e: any) => {
      const prod = this.data.products.find((p) => p.id === e.productId || p.id === e.product_id);
      const qty = e.packetsCount || e.packets_count || e.quantity || 0;
      const price = prod?.price || 0;
      return {
        product_id: e.productId || e.product_id || '',
        product_name: prod?.name || 'Product',
        category: prod?.category || 'MILK',
        packet_size_ml: prod?.packet_size_ml || 500,
        packets_count: qty,
        actual_quantity_litres: ((prod?.packet_size_ml || 500) * qty) / 1000,
        price_per_unit: price,
        total_amount: price * qty,
      };
    });

    const totalLitres = items.reduce((sum: number, i: any) => sum + i.actual_quantity_litres, 0);
    const totalPackets = items.reduce((sum: number, i: any) => sum + i.packets_count, 0);
    const productTotal = items.reduce((sum: number, i: any) => sum + i.total_amount, 0);
    const milkLitres = items
      .filter((i: any) => i.category === 'MILK')
      .reduce((sum: number, i: any) => sum + i.actual_quantity_litres, 0);
    const curdPkts = items
      .filter((i: any) => i.category === 'CURD')
      .reduce((sum: number, i: any) => sum + i.packets_count, 0);

    const cust = this.getCustomerById(customerIdOrData);
    const delCharge = cust?.customer_type === 'BULK' ? 0 : calculateTotalDeliveryCharge(milkLitres, curdPkts);
    const grandTotal = productTotal + delCharge;

    return this.saveDelivery(
      {
        idempotency_key: `${customerIdOrData}-${dateStr || new Date().toISOString().split('T')[0]}`,
        customer_id: customerIdOrData,
        delivery_boy_id: deliveryBoyId || this.data.currentUser?.id || '',
        delivery_date: dateStr || new Date().toISOString().split('T')[0],
        status: status || 'DELIVERED',
        total_milk_litres: milkLitres,
        total_curd_packets: curdPkts,
        product_total: productTotal,
        delivery_charge: delCharge,
        grand_total: grandTotal,
        total_litres: totalLitres,
        total_packets: totalPackets,
        remarks: notesOrRemarks || '',
        notes: notesOrRemarks || '',
      },
      items
    );
  }

  public saveCustomer(custData: any) {
    if (custData.id && this.getCustomerById(custData.id)) {
      return this.updateCustomer(custData.id, custData);
    }
    return this.addCustomer(custData);
  }

  public deleteCustomer(id: string) {
    return this.deactivateCustomer(id);
  }

  public saveRoute(routeData: any) {
    if (routeData.id && this.data.routes.find((r) => r.id === routeData.id)) {
      return this.updateRoute(routeData.id, routeData);
    }
    return this.addRoute(routeData);
  }

  public saveAgencyProfile(data: any) {
    return this.updateAgencyProfile(data);
  }

  public getSignatureImage(): string | null {
    return this.data.agencyProfile?.signature_url || null;
  }

  public setSignatureImage(url: string | null) {
    if (this.data.agencyProfile) {
      this.data.agencyProfile.signature_url = url || '';
      this.notify();
    }
  }

  public getPaymentQR(): string | null {
    return this.data.agencyProfile?.payment_qr_url || null;
  }

  public setPaymentQR(url: string | null) {
    if (this.data.agencyProfile) {
      this.data.agencyProfile.payment_qr_url = url || '';
      this.notify();
    }
  }

  // --- Global Search (Admin Only) ---
  public globalSearch(query: string): {
    customers: Customer[];
    deliveryBoys: AppUser[];
    invoices: MonthlyInvoice[];
    payments: Payment[];
  } {
    const q = query.trim().toLowerCase();
    if (!q) return { customers: [], deliveryBoys: [], invoices: [], payments: [] };

    const aid = this.getActiveAdminId();
    const customers = this.data.customers.filter(
      (c) =>
        c.admin_id === aid &&
        (c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.customer_code.toLowerCase().includes(q) ||
          (c.house_number && c.house_number.toLowerCase().includes(q)) ||
          (c.location && c.location.toLowerCase().includes(q)))
    );

    const deliveryBoys = this.data.users.filter(
      (u) =>
        u.admin_id === aid &&
        u.role === 'DELIVERY_BOY' &&
        (u.name.toLowerCase().includes(q) || u.phone.includes(q) || u.username.toLowerCase().includes(q))
    );

    const invoices = this.data.invoices.filter(
      (inv) =>
        inv.admin_id === aid &&
        (inv.invoice_number.toLowerCase().includes(q) || inv.month_year.includes(q))
    );

    const payments = this.data.payments.filter(
      (p) =>
        p.admin_id === aid &&
        ((p.reference_number && p.reference_number.toLowerCase().includes(q)) ||
          p.payment_method.toLowerCase().includes(q))
    );

    return { customers, deliveryBoys, invoices, payments };
  }
}

export const store = new Store();
