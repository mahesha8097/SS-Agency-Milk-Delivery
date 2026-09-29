// Core Business Logic & Calculations for S.S Agency Milk Delivery Management

import {
  Product,
  CustomerProductRequirement,
  DailyDelivery,
  Payment,
  BillingType,
  CustomerLedgerEntry,
} from './types';

export interface PacketEntry {
  productId: string;
  packetsCount: number;
}

export interface CalculatedDeliveryItem {
  productId: string;
  productName: string;
  category: 'MILK' | 'CURD';
  packetSizeMl: number;
  packetsCount: number;
  actualQuantityLitres: number; // Litres for milk, 0 for curd
  pricePerUnit: number; // Price at delivery time
  totalAmount: number;
}

export interface CalculatedDeliverySummary {
  items: CalculatedDeliveryItem[];
  totalMilkLitres: number;
  totalCurdPackets: number;
  productTotal: number;
  deliveryCharge: number;
  grandTotal: number;
}

/**
 * Calculates delivery charge for MILK (House Customer).
 * Rules:
 * - 0L = ₹0.00
 * - <= 500ml (0.5L) = ₹2.00
 * - 1.0L = ₹3.00
 * - Combined milk quantity: e.g. 500ml + 500ml = 1.0L => ₹3.00 (not ₹4.00)
 * - For milk > 0.5L, standard rate ₹3.00/L (e.g. 1.5L = ₹4.50, 2L = ₹6.00)
 */
export function calculateMilkDeliveryCharge(milkLitres: number, rate500ml: number = 2.0, rate1L: number = 3.0): number {
  if (milkLitres <= 0) return 0;
  if (milkLitres <= 0.5 || Math.abs(milkLitres - 0.5) < 0.001) {
    return rate500ml;
  }
  // Standard rate ₹3/L based on 1L rule
  return Math.round(milkLitres * rate1L * 100) / 100;
}

/**
 * Calculates delivery charge for CURD packets (House Customer).
 * Rules:
 * - 0 packets = ₹0.00
 * - 1 packet = ₹2.00 (First packet = ₹2)
 * - 2 packets = ₹3.00 (Each additional packet = +₹1)
 * - 3 packets = ₹4.00
 * - 4 packets = ₹5.00
 */
export function calculateCurdDeliveryCharge(
  curdPackets: number,
  firstPacketRate: number = 2.0,
  additionalPacketRate: number = 1.0
): number {
  if (curdPackets <= 0) return 0;
  return firstPacketRate + (curdPackets - 1) * additionalPacketRate;
}

/**
 * Calculates total delivery charge combining Milk and Curd separately.
 * Bulk Customer delivery charge is always ₹0.00.
 */
export function calculateTotalDeliveryCharge(
  milkLitres: number,
  curdPackets: number,
  isBulkOrder: boolean = false,
  settings?: {
    milk_500ml_charge?: number;
    milk_1L_charge?: number;
    curd_first_packet_charge?: number;
    curd_additional_packet_charge?: number;
  }
): number {
  if (isBulkOrder) return 0;

  const milkCharge = calculateMilkDeliveryCharge(
    milkLitres,
    settings?.milk_500ml_charge ?? 2.0,
    settings?.milk_1L_charge ?? 3.0
  );
  const curdCharge = calculateCurdDeliveryCharge(
    curdPackets,
    settings?.curd_first_packet_charge ?? 2.0,
    settings?.curd_additional_packet_charge ?? 1.0
  );

  return Math.round((milkCharge + curdCharge) * 100) / 100;
}

// Backward compatibility alias
export function calculateDeliveryCharge(milkLitres: number): number {
  return calculateMilkDeliveryCharge(milkLitres);
}

/**
 * Calculates daily itemized breakdown, total milk litres, curd packets, delivery charge, and grand total.
 */
export function calculateDeliveryTotals(
  entries: PacketEntry[],
  products: Product[],
  isBulkOrder: boolean = false,
  chargeSettings?: {
    milk_500ml_charge?: number;
    milk_1L_charge?: number;
    curd_first_packet_charge?: number;
    curd_additional_packet_charge?: number;
  }
): CalculatedDeliverySummary {
  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalMilkLitres = 0;
  let totalCurdPackets = 0;
  let productTotal = 0;
  const items: CalculatedDeliveryItem[] = [];

  for (const entry of entries) {
    if (entry.packetsCount <= 0) continue;
    const product = productMap.get(entry.productId);
    if (!product) continue;

    const catUpper = (product.category || '').toUpperCase();
    const isMilk = catUpper === 'MILK';
    const isCurd = catUpper === 'CURD';
    const itemLitres = isMilk ? ((product.packet_size_ml || 1000) / 1000) * entry.packetsCount : 0;

    if (isMilk && (product.delivery_charge_applicable !== false)) {
      totalMilkLitres += itemLitres;
    } else if (isCurd && (product.delivery_charge_applicable !== false)) {
      totalCurdPackets += entry.packetsCount;
    }

    const itemTotal = Math.round(entry.packetsCount * product.price * 100) / 100;
    productTotal += itemTotal;

    items.push({
      productId: product.id,
      productName: product.name,
      category: isMilk ? 'MILK' : isCurd ? 'CURD' : (product.category as any),
      packetSizeMl: product.packet_size_ml || 1000,
      packetsCount: entry.packetsCount,
      actualQuantityLitres: itemLitres,
      pricePerUnit: product.price,
      totalAmount: itemTotal,
    });
  }

  totalMilkLitres = Math.round(totalMilkLitres * 100) / 100;
  productTotal = Math.round(productTotal * 100) / 100;

  // Calculate separate milk & curd delivery charges (always ₹0 for bulk)
  const deliveryCharge = calculateTotalDeliveryCharge(
    totalMilkLitres,
    totalCurdPackets,
    isBulkOrder,
    chargeSettings
  );
  const grandTotal = Math.round((productTotal + deliveryCharge) * 100) / 100;

  return {
    items,
    totalMilkLitres,
    totalCurdPackets,
    productTotal,
    deliveryCharge,
    grandTotal,
  };
}

/**
 * Returns number of days in a given month (e.g. 2026-08 -> 31)
 */
export function getDaysInMonth(monthYear: string): number {
  const [yearStr, monthStr] = monthYear.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  return new Date(year, month, 0).getDate();
}

/**
 * Returns the next month string in YYYY-MM format
 */
export function getNextMonthStr(monthYear: string): string {
  const [yearStr, monthStr] = monthYear.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${month.toString().padStart(2, '0')}`;
}

/**
 * Calculates EXPECTED monthly bill based on regular daily subscription.
 */
export function calculateExpectedSubscriptionBill(
  requirements: CustomerProductRequirement[],
  products: Product[],
  monthYear: string,
  isBulkOrder: boolean = false
): {
  expectedProductAmount: number;
  expectedDeliveryCharges: number;
  expectedGrandTotal: number;
  dailyMilkLitres: number;
  daysCount: number;
} {
  const daysCount = getDaysInMonth(monthYear);
  const productMap = new Map(products.map((p) => [p.id, p]));

  let dailyProductAmount = 0;
  let dailyMilkLitres = 0;

  for (const req of requirements) {
    if (req.default_packets <= 0) continue;
    const prod = productMap.get(req.product_id);
    if (!prod) continue;

    dailyProductAmount += req.default_packets * prod.price;
    if (prod.category === 'MILK') {
      dailyMilkLitres += (prod.packet_size_ml / 1000) * req.default_packets;
    }
  }

  const dailyDeliveryCharge = isBulkOrder ? 0 : calculateDeliveryCharge(dailyMilkLitres);

  const expectedProductAmount = Math.round(dailyProductAmount * daysCount * 100) / 100;
  const expectedDeliveryCharges = Math.round(dailyDeliveryCharge * daysCount * 100) / 100;
  const expectedGrandTotal = Math.round((expectedProductAmount + expectedDeliveryCharges) * 100) / 100;

  return {
    expectedProductAmount,
    expectedDeliveryCharges,
    expectedGrandTotal,
    dailyMilkLitres,
    daysCount,
  };
}

export interface HouseMonthlyInvoiceCalculation {
  totalProductAmount: number;
  totalDeliveryCharges: number;
  actualMonthlyBill: number;
  previousBalanceCredit: number; // Previous credit carried over (>0)
  previousPending: number; // Previous unpaid debt (>0)
  advancePaid: number; // Total payments received for this billing cycle
  // PREPAID fields:
  remainingCredit: number;
  extraAmountToPay: number;
  nextMonthEstimate: number;
  nextMonthAmountToPay: number;
  // Common / POSTPAID fields:
  amountPayable: number;
  status: 'DRAFT' | 'GENERATED' | 'PAID' | 'PARTIALLY_PAID';
}

/**
 * Comprehensive centralized House Monthly Invoice Calculation
 */
export function calculateHouseMonthlyBilling(
  billingType: BillingType,
  deliveries: { product_total: number; delivery_charge: number; grand_total: number }[] = [],
  payments: { amount: number }[] = [],
  previousCredit: number = 0,
  previousPending: number = 0,
  requirements: CustomerProductRequirement[] = [],
  products: Product[] = [],
  monthYear: string = new Date().toISOString().slice(0, 7)
): HouseMonthlyInvoiceCalculation {
  const safeDeliveries = Array.isArray(deliveries) ? deliveries : [];
  const safePayments = Array.isArray(payments) ? payments : [];

  const totalProductAmount = Math.round(safeDeliveries.reduce((sum, d) => sum + (d.product_total || 0), 0) * 100) / 100;
  const totalDeliveryCharges = Math.round(safeDeliveries.reduce((sum, d) => sum + (d.delivery_charge || 0), 0) * 100) / 100;
  const actualMonthlyBill = Math.round((totalProductAmount + totalDeliveryCharges) * 100) / 100;

  const advancePaid = Math.round(safePayments.reduce((sum, p) => sum + (p.amount || 0), 0) * 100) / 100;

  const nextMonth = getNextMonthStr(monthYear);
  const nextMonthExpected = calculateExpectedSubscriptionBill(requirements, products, nextMonth, false);
  const nextMonthEstimate = nextMonthExpected.expectedGrandTotal;

  if (billingType === 'PREPAID') {
    // Total available customer funds = previous credit + current month advance paid
    const totalAvailable = previousCredit + advancePaid;
    // Total obligations = actual delivery bill + any previous pending
    const totalOwed = actualMonthlyBill + previousPending;

    const remainingCredit = Math.max(0, Math.round((totalAvailable - totalOwed) * 100) / 100);
    const extraAmountToPay = Math.max(0, Math.round((totalOwed - totalAvailable) * 100) / 100);

    // Next Month Amount to Pay = Next Month Expected Bill + Pending - Remaining Credit
    const nextMonthAmountToPay = Math.max(
      0,
      Math.round((nextMonthEstimate + extraAmountToPay - remainingCredit) * 100) / 100
    );

    const amountPayable = extraAmountToPay;
    const status = extraAmountToPay <= 0 ? 'PAID' : advancePaid > 0 ? 'PARTIALLY_PAID' : 'GENERATED';

    return {
      totalProductAmount,
      totalDeliveryCharges,
      actualMonthlyBill,
      previousBalanceCredit: previousCredit,
      previousPending,
      advancePaid,
      remainingCredit,
      extraAmountToPay,
      nextMonthEstimate,
      nextMonthAmountToPay,
      amountPayable,
      status,
    };
  } else {
    // POSTPAID Customer Logic:
    // Net previous balance: positive if customer owed money, negative if they had credit
    const netPrevious = previousPending - previousCredit;
    const totalPayableBeforePayments = actualMonthlyBill + netPrevious;
    const pendingAmount = Math.max(0, Math.round((totalPayableBeforePayments - advancePaid) * 100) / 100);
    const creditAmount = Math.max(0, Math.round((advancePaid - totalPayableBeforePayments) * 100) / 100);

    const status =
      pendingAmount <= 0
        ? 'PAID'
        : advancePaid > 0
        ? 'PARTIALLY_PAID'
        : 'GENERATED';

    return {
      totalProductAmount,
      totalDeliveryCharges,
      actualMonthlyBill,
      previousBalanceCredit: creditAmount,
      previousPending: netPrevious > 0 ? netPrevious : 0,
      advancePaid,
      remainingCredit: creditAmount,
      extraAmountToPay: pendingAmount,
      nextMonthEstimate,
      nextMonthAmountToPay: pendingAmount + nextMonthEstimate,
      amountPayable: pendingAmount,
      status,
    };
  }
}

/**
 * Backward compatibility wrapper for generic monthly invoice summary
 */
export function calculateMonthlyInvoiceSummary(
  customerDeliveries: { product_total: number; delivery_charge: number; grand_total: number }[],
  customerPayments: { amount: number }[],
  previousBalanceCredit: number = 0
) {
  const totalProductAmount = Math.round(customerDeliveries.reduce((sum, d) => sum + (d.product_total || 0), 0) * 100) / 100;
  const totalDeliveryCharges = Math.round(customerDeliveries.reduce((sum, d) => sum + (d.delivery_charge || 0), 0) * 100) / 100;
  const grandTotal = Math.round((totalProductAmount + totalDeliveryCharges) * 100) / 100;
  const advancePaid = Math.round(customerPayments.reduce((sum, p) => sum + (p.amount || 0), 0) * 100) / 100;
  const netPayable = Math.max(0, Math.round((grandTotal - advancePaid - previousBalanceCredit) * 100) / 100);

  return {
    totalProductAmount,
    totalDeliveryCharges,
    grandTotal,
    previousBalanceCredit: Math.round(previousBalanceCredit * 100) / 100,
    advancePaid,
    amountPayable: netPayable,
  };
}

/**
 * Builds chronological Customer Account Ledger
 */
export function calculateCustomerLedger(
  deliveries: DailyDelivery[],
  payments: Payment[]
): CustomerLedgerEntry[] {
  interface RawEntry {
    date: string;
    description: string;
    debit: number;
    credit: number;
    timestamp: number;
  }

  const raw: RawEntry[] = [];

  for (const del of deliveries) {
    if (del.grand_total > 0 && del.status === 'DELIVERED') {
      raw.push({
        date: del.delivery_date,
        description: `Daily Milk Delivery (${del.total_milk_litres}L)`,
        debit: del.grand_total,
        credit: 0,
        timestamp: new Date(del.delivery_date).getTime(),
      });
    }
  }

  for (const pay of payments) {
    raw.push({
      date: pay.payment_date,
      description: `Payment Received (${pay.payment_method}${pay.reference_number ? ` - Ref: ${pay.reference_number}` : ''})`,
      debit: 0,
      credit: pay.amount,
      timestamp: new Date(pay.payment_date).getTime() + 1, // Order payments slightly after deliveries of same day
    });
  }

  raw.sort((a, b) => a.timestamp - b.timestamp);

  let runningBalance = 0;
  const ledger: CustomerLedgerEntry[] = [];

  for (const item of raw) {
    runningBalance += item.debit - item.credit;
    ledger.push({
      date: item.date,
      description: item.description,
      debit: item.debit,
      credit: item.credit,
      balance: Math.round(runningBalance * 100) / 100,
    });
  }

  return ledger;
}

