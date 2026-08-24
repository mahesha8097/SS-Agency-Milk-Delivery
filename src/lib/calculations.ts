// Core Business Logic & Calculations for S.S Agency

import { Product } from './types';

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
 * Calculates delivery charge based strictly on total milk litres delivered in a single day.
 * 
 * Rules:
 * - 0.5L milk = ₹2.00 (special minimum charge)
 * - 1.0L milk = ₹3.00
 * - 1.5L milk = ₹4.50
 * - 2.0L milk = ₹6.00
 * - 2.5L milk = ₹7.50
 * - 3.0L milk = ₹9.00
 * - Continues at ₹3.00 per litre for total_milk >= 1.0L
 * - 0L milk = ₹0.00
 * - Curd DOES NOT contribute to milk litres or delivery charge.
 */
export function calculateDeliveryCharge(totalMilkLitres: number): number {
  if (totalMilkLitres <= 0) return 0;
  
  // Special minimum charge for exactly 0.5L (500ml single packet)
  if (Math.abs(totalMilkLitres - 0.5) < 0.001) {
    return 2.00;
  }

  // Standard rate ₹3 per litre for 1.0L and above (and any fractional litres >= 1.0L)
  return Math.round(totalMilkLitres * 3.00 * 100) / 100;
}

/**
 * Calculates itemized breakdown, total milk litres, delivery charge, and grand total.
 */
export function calculateDeliveryTotals(
  entries: PacketEntry[],
  products: Product[]
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

    let itemLitres = 0;
    if (product.category === 'MILK') {
      itemLitres = (product.packet_size_ml / 1000) * entry.packetsCount;
      totalMilkLitres += itemLitres;
    } else if (product.category === 'CURD') {
      totalCurdPackets += entry.packetsCount;
    }

    const itemTotal = Math.round(entry.packetsCount * product.price * 100) / 100;
    productTotal += itemTotal;

    items.push({
      productId: product.id,
      productName: product.name,
      category: product.category,
      packetSizeMl: product.packet_size_ml,
      packetsCount: entry.packetsCount,
      actualQuantityLitres: itemLitres,
      pricePerUnit: product.price,
      totalAmount: itemTotal,
    });
  }

  // Round milk litres to 2 decimal places
  totalMilkLitres = Math.round(totalMilkLitres * 100) / 100;
  productTotal = Math.round(productTotal * 100) / 100;

  const deliveryCharge = calculateDeliveryCharge(totalMilkLitres);
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
 * Generates customer invoice summary for a given month
 */
export function calculateMonthlyInvoiceSummary(
  customerDeliveries: {
    product_total: number;
    delivery_charge: number;
    grand_total: number;
  }[],
  customerPayments: { amount: number }[],
  previousBalanceCredit: number = 0
) {
  const totalProductAmount = customerDeliveries.reduce((sum, d) => sum + d.product_total, 0);
  const totalDeliveryCharges = customerDeliveries.reduce((sum, d) => sum + d.delivery_charge, 0);
  const grandTotal = Math.round((totalProductAmount + totalDeliveryCharges) * 100) / 100;

  
  const advancePaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);

  // Amount Payable = Grand Total - Advance Paid - Previous Credit (if positive credit)
  // If previous balance is positive credit, it reduces payable amount.
  // If previous balance is outstanding debt, it increases payable amount.
  const netPayable = grandTotal - advancePaid - previousBalanceCredit;

  return {
    totalProductAmount: Math.round(totalProductAmount * 100) / 100,
    totalDeliveryCharges: Math.round(totalDeliveryCharges * 100) / 100,
    grandTotal,
    previousBalanceCredit: Math.round(previousBalanceCredit * 100) / 100,
    advancePaid: Math.round(advancePaid * 100) / 100,
    amountPayable: Math.round(netPayable * 100) / 100,
  };
}
