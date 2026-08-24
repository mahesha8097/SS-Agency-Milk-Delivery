# S.S Agency – Nandini Milk & Dairy Products Delivery Management System

A production-ready, full-stack morning milk and curd door-to-door delivery management system built for **S.S Agency**. 

This system supports scalable real-world business operations for 500+ customers, 20+ delivery boys, offline delivery recording, automatic tiered delivery charge calculations, advance payment credits, monthly invoice generation, multi-sheet Excel exports, PWA mobile installation, and Capacitor Android APK packaging.

---

## 1. Local Setup

```bash
# Clone or open project folder
cd "c:\Projects\SS AGENCY DELIVERY"

# Install dependencies
npm install
```

---

## 2. Supabase Setup

1. Log into your [Supabase Dashboard](https://supabase.com).
2. Create a new PostgreSQL project named `SS Agency Milk`.
3. Obtain your project API credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## 3. Database Migration

1. Open the SQL Editor in your Supabase project dashboard.
2. Copy the full contents of [`schema.sql`](file:///c:/Projects/SS%20AGENCY%20DELIVERY/schema.sql).
3. Execute the SQL script. This creates:
   - 10 Relational PostgreSQL Tables (`users`, `routes`, `customers`, `products`, `customer_products`, `daily_deliveries`, `delivery_items`, `payments`, `monthly_invoices`, `audit_logs`).
   - Foreign key constraints, indexes, triggers, and Row Level Security (RLS) policies.

---

## 4. Environment Variables

Create a file named `.env.local` in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_NAME="S.S Agency - Nandini Milk Delivery Management"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 5. Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Login Credentials & Demo Access

The system comes pre-configured with quick demo accounts and seed data:

### Admin Login
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Full Admin Access (Dashboard, Customers, Deliveries, Products, Payments, Invoices, Excel Export, Audit Logs)

### Delivery Boy 1 (Route 1 - Ramesh)
- **Username**: `boy1`
- **Password**: `boy123`
- **Assigned Route**: Route 1 (Orchid Enclave & Janapriya)

### Delivery Boy 2 (Route 2 - Suresh)
- **Username**: `boy2`
- **Password**: `boy223`
- **Assigned Route**: Route 2 (Wasthoboomi Sunshine)

---

## 7. Business Logic & Calculations

### Delivery Charge Tier Rules (Based strictly on daily milk volume):
- `0.5L milk` = **₹2.00** (Special minimum charge)
- `1.0L milk` = **₹3.00**
- `1.5L milk` = **₹4.50**
- `2.0L milk` = **₹6.00**
- `x Litres milk` (for x >= 1.0) = **x × ₹3.00**

> [!IMPORTANT]
> **Curd is calculated separately** and does NOT add to total milk litres or increase delivery charges.
> Delivered line items store the rate at the time of delivery (`price_per_unit`), so changing a product price later never alters past historical deliveries or old monthly bills.

---

## 8. Offline Delivery Recording & PWA Installation

- **Offline Mode**: When internet connection is lost, delivery entries are saved locally to IndexedDB with unique idempotency keys.
- **PWA Installation**: Open the app on Android Chrome/iOS Safari and tap **Add to Home Screen** to install as a native standalone PWA app.
- **Auto Sync**: When network restores, pending offline records automatically synchronize to the database without duplicates.

---

## 9. Future Android APK Build Instructions (Capacitor)

To build a standalone Android `.apk` / `.aab` package:

```bash
# 1. Build Next.js production output
npm run build

# 2. Add Android platform via Capacitor
npx cap add android

# 3. Copy web assets to Android project
npx cap copy android

# 4. Open in Android Studio to build APK
npx cap open android
```

---

## 10. Verification Test Results

- [x] Admin & Delivery Boy Role Permissions
- [x] Customer CRUD & Route Assignment
- [x] Litres calculation & Tiered delivery charge logic (0.5L = ₹2, 1.0L = ₹3, 1.5L = ₹4.50, 2.0L = ₹6)
- [x] Rate preservation on price updates
- [x] Duplicate delivery prevention per customer/day
- [x] Offline IndexedDB recording & idempotent sync
- [x] Advance payment ledger & credit carry-forward on monthly bills
- [x] Printable monthly customer invoices
- [x] 5-Sheet Excel Workbook export (`.xlsx`)
