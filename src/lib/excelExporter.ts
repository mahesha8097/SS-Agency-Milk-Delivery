// Excel Exporter for Multi-Admin Nandini Milk Management System
import ExcelJS from 'exceljs';
import { Customer, DailyDelivery, DeliveryItem, Payment, Expense, MonthlyInvoice, Product, AppUser, ShopSettings } from './types';

export async function exportReportToExcel(params: {
  reportType: 'OVERVIEW' | 'SALES' | 'PRODUCTS' | 'DELIVERIES' | 'CUSTOMERS' | 'PAYMENTS' | 'PENDING' | 'CREDIT' | 'EXPENSES' | 'DELIVERY_BOYS';
  startDate?: string;
  endDate?: string;
  customers: Customer[];
  deliveries: DailyDelivery[];
  deliveryItems: DeliveryItem[];
  payments: Payment[];
  expenses: Expense[];
  invoices: MonthlyInvoice[];
  products: Product[];
  deliveryBoys: AppUser[];
  shopSettings?: ShopSettings | null;
}) {
  const { reportType, startDate, endDate, customers, deliveries, payments, expenses, invoices, products, deliveryBoys, shopSettings } = params;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = shopSettings?.shop_name || 'Nandini Milk Management System';
  workbook.created = new Date();

  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const boyMap = new Map(deliveryBoys.map((u) => [u.id, u.name]));
  const prodMap = new Map(products.map((p) => [p.id, p]));

  const sheetName = `${reportType} Report`.slice(0, 31);
  const worksheet = workbook.addWorksheet(sheetName);

  // Title Header Block
  worksheet.addRow([shopSettings?.shop_name || 'NANDINI MILK PARLOUR']);
  worksheet.addRow([`Report: ${reportType} Report`, `Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`]);
  worksheet.addRow([`Generated on: ${new Date().toLocaleString('en-IN')}`]);
  worksheet.addRow([]); // Blank line

  worksheet.getRow(1).font = { bold: true, size: 14, color: { argb: '002060' } };
  worksheet.getRow(2).font = { bold: true, size: 10, color: { argb: '404040' } };

  if (reportType === 'SALES' || reportType === 'OVERVIEW') {
    worksheet.columns = [
      { header: 'Bill No', key: 'invoice_number', width: 16 },
      { header: 'Billing Period', key: 'month_year', width: 15 },
      { header: 'Customer Name', key: 'customer_name', width: 22 },
      { header: 'Customer Type', key: 'type', width: 14 },
      { header: 'Product Total (₹)', key: 'product_total', width: 18 },
      { header: 'Delivery Charge (₹)', key: 'delivery_charge', width: 18 },
      { header: 'Grand Total (₹)', key: 'grand_total', width: 16 },
      { header: 'Payments Received (₹)', key: 'paid', width: 20 },
      { header: 'Net Payable (₹)', key: 'payable', width: 16 },
      { header: 'Remaining Credit (₹)', key: 'credit', width: 20 },
      { header: 'Status', key: 'status', width: 14 },
    ];

    invoices.forEach((inv) => {
      const cust = customerMap.get(inv.customer_id);
      worksheet.addRow({
        invoice_number: inv.invoice_number,
        month_year: inv.month_year,
        customer_name: cust?.name || 'Customer',
        type: `${cust?.customer_type || 'HOUSE'} (${inv.billing_type})`,
        product_total: inv.total_product_amount.toFixed(2),
        delivery_charge: inv.total_delivery_charges.toFixed(2),
        grand_total: inv.grand_total.toFixed(2),
        paid: (inv.advance_paid || 0).toFixed(2),
        payable: (inv.total_payable || inv.amount_payable || 0).toFixed(2),
        credit: (inv.remaining_credit || 0).toFixed(2),
        status: inv.status,
      });
    });
  } else if (reportType === 'PAYMENTS') {
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Customer Code', key: 'code', width: 14 },
      { header: 'Customer Name', key: 'name', width: 22 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Amount (₹)', key: 'amount', width: 16 },
      { header: 'Payment Method', key: 'method', width: 16 },
      { header: 'Reference / UPI ID', key: 'ref', width: 22 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    payments.forEach((p) => {
      const cust = customerMap.get(p.customer_id);
      worksheet.addRow({
        date: p.payment_date,
        code: cust?.customer_code || '',
        name: cust?.name || 'Customer',
        phone: cust?.phone || '',
        amount: p.amount.toFixed(2),
        method: p.payment_method,
        ref: p.reference_number || '-',
        status: p.status,
      });
    });
  } else if (reportType === 'EXPENSES') {
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Category', key: 'category', width: 22 },
      { header: 'Paid To', key: 'paid_to', width: 22 },
      { header: 'Amount (₹)', key: 'amount', width: 16 },
      { header: 'Payment Method', key: 'method', width: 16 },
      { header: 'Description', key: 'desc', width: 25 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    expenses.forEach((e) => {
      worksheet.addRow({
        date: e.date,
        category: e.category_name || 'Expense',
        paid_to: e.paid_to,
        amount: e.amount.toFixed(2),
        method: e.payment_method,
        desc: e.description || '-',
        status: e.status,
      });
    });
  } else if (reportType === 'DELIVERIES') {
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Customer Name', key: 'customer', width: 22 },
      { header: 'Delivery Boy', key: 'dboy', width: 20 },
      { header: 'Milk Litres', key: 'milk', width: 14 },
      { header: 'Curd Packets', key: 'curd', width: 14 },
      { header: 'Product Total (₹)', key: 'prod_total', width: 16 },
      { header: 'Delivery Charge (₹)', key: 'del_charge', width: 18 },
      { header: 'Grand Total (₹)', key: 'grand_total', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Delivered Time', key: 'time', width: 16 },
    ];

    deliveries.forEach((d) => {
      const cust = customerMap.get(d.customer_id);
      worksheet.addRow({
        date: d.delivery_date,
        customer: cust?.name || 'Customer',
        dboy: boyMap.get(d.delivery_boy_id) || 'Unassigned',
        milk: `${d.total_milk_litres} L`,
        curd: `${d.total_curd_packets} Pkts`,
        prod_total: d.product_total.toFixed(2),
        del_charge: d.delivery_charge.toFixed(2),
        grand_total: d.grand_total.toFixed(2),
        status: d.status,
        time: d.delivered_at || '-',
      });
    });
  } else {
    // Customers / Pending / Credit Report
    worksheet.columns = [
      { header: 'Customer Code', key: 'code', width: 14 },
      { header: 'Customer Name', key: 'name', width: 22 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Payment Mode', key: 'pay_type', width: 14 },
      { header: 'Assigned Delivery Boy', key: 'dboy', width: 22 },
      { header: 'Credit Available (₹)', key: 'credit', width: 20 },
      { header: 'Pending Amount (₹)', key: 'pending', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    customers.forEach((c) => {
      worksheet.addRow({
        code: c.customer_code,
        name: c.name,
        phone: c.phone,
        type: c.customer_type,
        pay_type: c.payment_type,
        dboy: boyMap.get(c.assigned_delivery_boy_id || c.delivery_boy_id || '') || 'Unassigned',
        credit: c.opening_credit.toFixed(2),
        pending: c.opening_pending.toFixed(2),
        status: c.status,
      });
    });
  }

  // Header row styling
  const headerRow = worksheet.getRow(5);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '002060' }, // Nandini deep blue
  };

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Nandini_${reportType}_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
