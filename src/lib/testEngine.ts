// Comprehensive Validation Test Suite for Nandini Milk Management System
import {
  calculateMilkDeliveryCharge,
  calculateCurdDeliveryCharge,
  calculateTotalDeliveryCharge,
  calculateHouseMonthlyBilling,
} from './calculations';

function runTests() {
  console.log('--- STARTING NANDINI BUSINESS LOGIC TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Delivery Charge Rules: House Milk
  assert(calculateMilkDeliveryCharge(0) === 0, 'Milk 0L => ₹0');
  assert(calculateMilkDeliveryCharge(0.5) === 2.0, 'Milk 500ml (0.5L) => ₹2.00');
  assert(calculateMilkDeliveryCharge(1.0) === 3.0, 'Milk 1.0L => ₹3.00');
  assert(calculateMilkDeliveryCharge(1.5) === 4.5, 'Milk 1.5L => ₹4.50');
  assert(calculateMilkDeliveryCharge(2.0) === 6.0, 'Milk 2.0L => ₹6.00');

  // Combined milk volume: 500ml + 500ml = 1.0L => ₹3.00 (NOT ₹4.00)
  const combinedMilkLitres = 0.5 + 0.5;
  assert(calculateMilkDeliveryCharge(combinedMilkLitres) === 3.0, 'Combined 500ml + 500ml Milk (1L) => ₹3.00, NOT ₹4.00');

  // 2. Delivery Charge Rules: House Curd
  assert(calculateCurdDeliveryCharge(0) === 0, 'Curd 0 packets => ₹0');
  assert(calculateCurdDeliveryCharge(1) === 2.0, 'Curd 1st packet => ₹2.00');
  assert(calculateCurdDeliveryCharge(2) === 3.0, 'Curd 2 packets => ₹3.00');
  assert(calculateCurdDeliveryCharge(3) === 4.0, 'Curd 3 packets => ₹4.00');
  assert(calculateCurdDeliveryCharge(4) === 5.0, 'Curd 4 packets => ₹5.00');

  // 3. Combined Milk + Curd Calculated Separately
  // Milk 1L (₹3) + Curd 2 packets (₹3) => Total Delivery Charge ₹6
  assert(
    calculateTotalDeliveryCharge(1.0, 2, false) === 6.0,
    'Milk 1L + Curd 2 pkts => ₹6.00 total delivery charge'
  );

  // 4. Bulk Customers Delivery Charge = ₹0 ALWAYS
  assert(
    calculateTotalDeliveryCharge(10.0, 5, true) === 0,
    'Bulk customer (10L Milk + 5 Curd) => ₹0.00 delivery charge'
  );

  // 5. Billing Engine: Credit Carry-Forward (Prepaid)
  // Previous Credit = ₹500, Current Bill = ₹300 => Remaining Credit = ₹200, Payable = ₹0
  const prepaidRes1 = calculateHouseMonthlyBilling(
    'PREPAID',
    [{ product_total: 290, delivery_charge: 10, grand_total: 300 }],
    [],
    500, // previous credit
    0
  );
  assert(prepaidRes1.amountPayable === 0, 'Prepaid ₹500 credit on ₹300 bill => Payable ₹0');
  assert(prepaidRes1.remainingCredit === 200, 'Prepaid ₹500 credit on ₹300 bill => ₹200 remaining credit');
  assert(prepaidRes1.status === 'PAID', 'Prepaid bill status is PAID');

  // Next Month: New Bill = ₹400, Credit Carried Forward = ₹200 => Extra Payable = ₹200
  const prepaidRes2 = calculateHouseMonthlyBilling(
    'PREPAID',
    [{ product_total: 380, delivery_charge: 20, grand_total: 400 }],
    [],
    200, // carried forward credit
    0
  );
  assert(prepaidRes2.extraAmountToPay === 200, 'Prepaid ₹200 carried credit on ₹400 bill => Extra Payable ₹200');
  assert(prepaidRes2.remainingCredit === 0, 'Prepaid remaining credit is 0');

  // 6. Billing Engine: Overpayment creates Customer Credit
  // Bill = ₹300, Advance Payment Received = ₹500 => Remaining Credit = ₹200, Payable = 0
  const prepaidOverpay = calculateHouseMonthlyBilling(
    'PREPAID',
    [{ product_total: 290, delivery_charge: 10, grand_total: 300 }],
    [{ amount: 500 }],
    0,
    0
  );
  assert(prepaidOverpay.remainingCredit === 200, 'Overpayment of ₹500 on ₹300 bill => ₹200 Credit created');

  // 7. Billing Engine: Postpaid Pending Logic
  // Previous Pending = ₹500, Current Bill = ₹300, Payment = ₹400 => Net Payable = ₹800 - ₹400 = ₹400 remaining pending
  const postpaidRes = calculateHouseMonthlyBilling(
    'POSTPAID',
    [{ product_total: 290, delivery_charge: 10, grand_total: 300 }],
    [{ amount: 400 }],
    0,
    500 // previous pending
  );
  assert(postpaidRes.amountPayable === 400, 'Postpaid Previous Pending ₹500 + Bill ₹300 - Paid ₹400 => Pending ₹400');
  assert(postpaidRes.status === 'PARTIALLY_PAID', 'Postpaid status is PARTIALLY_PAID');

  console.log(`\nTEST SUMMARY: ${passed} Passed, ${failed} Failed`);
}

runTests();
