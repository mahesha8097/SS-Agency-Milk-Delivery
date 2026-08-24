// Excel Exporter for S.S Agency Milk Delivery System
import ExcelJS from 'exceljs';
import { Customer, DailyDelivery, DeliveryItem, Payment, Route, Product, AppUser } from './types';

export async function exportAllDataToExcel(
  customers: Customer[],
  deliveries: DailyDelivery[],
  deliveryItems: DeliveryItem[],
  payments: Payment[],
  routes: Route[],
  products: Product[],
  users: AppUser[],
  selectedMonthYear?: string
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'S.S Agency Nandini Milk Delivery System';
  workbook.created = new Date();

  const userMap = new Map(users.map((u) => [u.id, u.name]));
  const routeMap = new Map(routes.map((r) => [r.id, r.name]));
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  // --- SHEET 1: Customers ---
  const sheet1 = workbook.addWorksheet('Customers');
  sheet1.columns = [
    { header: 'Customer ID', key: 'customer_code', width: 14 },
    { header: 'Name', key: 'name', width: 22 },
    { header: 'Phone', key: 'phone', width: 16 },
    { header: 'House/Flat', key: 'house_number', width: 14 },
    { header: 'Location', key: 'location', width: 22 },
    { header: 'Route', key: 'route', width: 25 },
    { header: 'Delivery Boy', key: 'delivery_boy', width: 22 },
    { header: 'Payment Type', key: 'payment_type', width: 18 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  customers.forEach((c) => {
    sheet1.addRow({
      customer_code: c.customer_code,
      name: c.name,
      phone: c.phone,
      house_number: c.house_number,
      location: c.location,
      route: routeMap.get(c.route_id) || 'Unassigned',
      delivery_boy: userMap.get(c.delivery_boy_id) || 'Unassigned',
      payment_type: c.payment_type,
      status: c.status,
    });
  });

  // Style header row
  sheet1.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  sheet1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0D47A1' } };

  // --- SHEET 2: Daily Deliveries ---
  const sheet2 = workbook.addWorksheet('Daily Deliveries');
  sheet2.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Customer ID', key: 'customer_code', width: 14 },
    { header: 'Customer Name', key: 'customer_name', width: 22 },
    { header: 'Delivery Boy', key: 'delivery_boy', width: 20 },
    { header: 'Product', key: 'product', width: 20 },
    { header: 'Packet Size', key: 'packet_size', width: 14 },
    { header: 'Packets', key: 'packets', width: 10 },
    { header: 'Qty (Litres)', key: 'quantity', width: 14 },
    { header: 'Product Rate', key: 'rate', width: 14 },
    { header: 'Product Amount', key: 'amount', width: 16 },
    { header: 'Milk Litres (Total)', key: 'milk_litres', width: 18 },
    { header: 'Delivery Charge', key: 'delivery_charge', width: 16 },
    { header: 'Daily Total', key: 'daily_total', width: 16 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Remarks', key: 'remarks', width: 24 },
  ];

  const deliveryMap = new Map(deliveries.map((d) => [d.id, d]));

  deliveryItems.forEach((item) => {
    const del = deliveryMap.get(item.delivery_id);
    if (!del) return;
    const cust = customerMap.get(del.customer_id);

    sheet2.addRow({
      date: del.delivery_date,
      customer_code: cust?.customer_code || '',
      customer_name: cust?.name || '',
      delivery_boy: userMap.get(del.delivery_boy_id) || '',
      product: item.product_name,
      packet_size: item.packet_size_ml === 1000 ? '1L' : '500ml',
      packets: item.packets_count,
      quantity: item.actual_quantity_litres,
      rate: `₹${item.price_per_unit}`,
      amount: `₹${item.total_amount}`,
      milk_litres: del.total_milk_litres,
      delivery_charge: `₹${del.delivery_charge}`,
      daily_total: `₹${del.grand_total}`,
      status: del.status,
      remarks: del.remarks || '',
    });
  });

  sheet2.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  sheet2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0D47A1' } };

  // --- SHEET 3: Monthly Summary ---
  const sheet3 = workbook.addWorksheet('Monthly Summary');
  sheet3.columns = [
    { header: 'Customer', key: 'customer', width: 22 },
    { header: 'Blue 1L', key: 'b1l', width: 10 },
    { header: 'Blue 500ml', key: 'b500', width: 12 },
    { header: 'Orange 1L', key: 'o1l', width: 12 },
    { header: 'Orange 500ml', key: 'o500', width: 14 },
    { header: 'Special 1L', key: 's1l', width: 12 },
    { header: 'Special 500ml', key: 's500', width: 14 },
    { header: 'Curd 1L', key: 'c1l', width: 10 },
    { header: 'Total Milk Litres', key: 'total_milk', width: 18 },
    { header: 'Total Curd', key: 'total_curd', width: 12 },
    { header: 'Product Amount', key: 'product_amount', width: 16 },
    { header: 'Delivery Charges', key: 'delivery_charges', width: 16 },
    { header: 'Grand Total', key: 'grand_total', width: 16 },
    { header: 'Advance Paid', key: 'advance_paid', width: 14 },
    { header: 'Balance', key: 'balance', width: 14 },
  ];

  customers.forEach((cust) => {
    const custDeliveries = deliveries.filter((d) => d.customer_id === cust.id);
    const custItems = deliveryItems.filter((di) =>
      custDeliveries.some((d) => d.id === di.delivery_id)
    );

    let b1l = 0,
      b500 = 0,
      o1l = 0,
      o500 = 0,
      s1l = 0,
      s500 = 0,
      c1l = 0;

    custItems.forEach((item) => {
      if (item.product_name.includes('Blue Milk 1L')) b1l += item.packets_count;
      else if (item.product_name.includes('Blue Milk 500ml')) b500 += item.packets_count;
      else if (item.product_name.includes('Orange Milk 1L')) o1l += item.packets_count;
      else if (item.product_name.includes('Orange Milk 500ml')) o500 += item.packets_count;
      else if (item.product_name.includes('Special Milk 1L')) s1l += item.packets_count;
      else if (item.product_name.includes('Special Milk 500ml')) s500 += item.packets_count;
      else if (item.product_name.includes('Curd')) c1l += item.packets_count;
    });

    const totalMilk = custDeliveries.reduce((sum, d) => sum + d.total_milk_litres, 0);
    const totalCurd = custDeliveries.reduce((sum, d) => sum + d.total_curd_packets, 0);
    const prodAmt = custDeliveries.reduce((sum, d) => sum + d.product_total, 0);
    const delCharge = custDeliveries.reduce((sum, d) => sum + d.delivery_charge, 0);
    const grand = prodAmt + delCharge;
    const paid = payments
      .filter((p) => p.customer_id === cust.id)
      .reduce((sum, p) => sum + p.amount, 0);
    const balance = grand - paid;

    sheet3.addRow({
      customer: `${cust.name} (${cust.customer_code})`,
      b1l,
      b500,
      o1l,
      o500,
      s1l,
      s500,
      c1l,
      total_milk: `${totalMilk} L`,
      total_curd: `${totalCurd} pkts`,
      product_amount: `₹${prodAmt}`,
      delivery_charges: `₹${delCharge}`,
      grand_total: `₹${grand}`,
      advance_paid: `₹${paid}`,
      balance: `₹${balance}`,
    });
  });

  sheet3.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  sheet3.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0D47A1' } };

  // --- SHEET 4: Payments ---
  const sheet4 = workbook.addWorksheet('Payments');
  sheet4.columns = [
    { header: 'Customer', key: 'customer', width: 22 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Amount', key: 'amount', width: 14 },
    { header: 'Payment Method', key: 'method', width: 16 },
    { header: 'Reference ID', key: 'reference', width: 20 },
    { header: 'Notes', key: 'notes', width: 24 },
  ];

  payments.forEach((p) => {
    const cust = customerMap.get(p.customer_id);
    sheet4.addRow({
      customer: cust ? `${cust.name} (${cust.customer_code})` : '',
      date: p.payment_date,
      amount: `₹${p.amount}`,
      method: p.payment_method,
      reference: p.reference_number || '',
      notes: p.notes || '',
    });
  });

  sheet4.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  sheet4.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0D47A1' } };

  // --- SHEET 5: Routes ---
  const sheet5 = workbook.addWorksheet('Routes');
  sheet5.columns = [
    { header: 'Route', key: 'route', width: 25 },
    { header: 'Delivery Boy', key: 'delivery_boy', width: 22 },
    { header: 'Customer', key: 'customer', width: 22 },
    { header: 'House/Flat', key: 'house', width: 14 },
    { header: 'Location', key: 'location', width: 22 },
  ];

  customers.forEach((cust) => {
    const route = routes.find((r) => r.id === cust.route_id);
    sheet5.addRow({
      route: route?.name || '',
      delivery_boy: userMap.get(cust.delivery_boy_id) || '',
      customer: `${cust.name} (${cust.customer_code})`,
      house: cust.house_number,
      location: cust.location,
    });
  });

  sheet5.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  sheet5.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0D47A1' } };

  // Download buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `SS_Agency_Delivery_Report_${selectedMonthYear || new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
