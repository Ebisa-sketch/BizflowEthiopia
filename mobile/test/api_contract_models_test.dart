import 'package:flutter_test/flutter_test.dart';
import 'package:bizflow_mobile/models/customer.dart' show Customer;
import 'package:bizflow_mobile/models/product.dart';
import 'package:bizflow_mobile/models/report_data.dart';
import 'package:bizflow_mobile/models/sale_record.dart';
import 'package:bizflow_mobile/models/shift.dart';
import 'package:bizflow_mobile/models/stock_movement.dart';
import 'package:bizflow_mobile/models/user.dart';

void main() {
  test('User maps active business fields returned by auth endpoints', () {
    final user = User.fromJson({
      'id': 'user-1',
      'name': 'Aster',
      'email': 'aster@example.com',
      'role': 'OWNER',
      'businessId': 'business-1',
      'businessName': 'Aster Shop',
      'currency': 'ETB',
      'availableBusinesses': [
        {'id': 'business-1', 'name': 'Aster Shop', 'role': 'OWNER'},
        {'id': 'business-2', 'name': 'Aster Cafe', 'role': 'MANAGER'},
      ],
    });

    expect(user.businessId, 'business-1');
    expect(user.business?.id, 'business-1');
    expect(user.business?.name, 'Aster Shop');
    expect(user.business?.currency, 'ETB');
    expect(user.availableBusinesses.last.name, 'Aster Cafe');
    expect(user.availableBusinesses.last.role, 'MANAGER');
  });

  test('Product parses the products API response fields', () {
    final product = Product.fromJson({
      'id': 'prod-1',
      'name': 'Coffee',
      'price': 120,
      'cost': 80,
      'stock': 12,
      'reorderLevel': 4,
      'category': 'Beverages',
    });

    expect(product.price, 120);
    expect(product.costPrice, 80);
    expect(product.stock, 12);
    expect(product.category, isNull);
  });

  test('Customer parses the detailed customer API response', () {
    final customer = Customer.fromJson({
      'id': 'customer-1',
      'name': 'Aster',
      'currentDebt': 250,
      'creditLimit': 1000,
    });

    expect(customer.creditBalance, 250);
  });

  test('Sale parses the sales API receipt and payment shape', () {
    final sale = SaleRecord.fromJson({
      'id': 'sale-1',
      'saleNumber': 'BF-2026-001',
      'grandTotal': 140,
      'customerName': 'Aster',
      'createdAt': '2026-11-11T08:00:00.000Z',
      'payments': [
        {
          'amount': 140,
          'method': 'OTHER',
          'reference': 'IDDA: Store Credit - Aster',
        },
      ],
      'items': [
        {
          'id': 'item-1',
          'name': 'Coffee',
          'quantity': 1,
          'unitPrice': 140,
          'lineTotal': 140,
        },
      ],
    });

    expect(sale.receiptNumber, 'BF-2026-001');
    expect(sale.total, 140);
    expect(sale.amountPaid, 140);
    expect(sale.paymentMethod, 'CREDIT');
    expect(sale.customerName, 'Aster');
    expect(sale.items.single.productName, 'Coffee');
    expect(sale.items.single.total, 140);
  });

  test('Report parses nested API fields and calculates profit totals', () {
    final report = ReportData.fromJson({
      'revenue': 500,
      'cogs': 300,
      'expenses': 25,
      'topProducts': [
        {'name': 'Coffee', 'units': 3, 'revenue': 500, 'margin': '40.0%'},
      ],
      'paymentSplit': [
        {'method': 'Cash', 'amount': 200},
        {'method': 'CBE Birr', 'amount': 300},
      ],
    });

    expect(report.grossProfit, 200);
    expect(report.netProfit, 175);
    expect(report.topProducts.single.unitsSold, 3);
    expect(report.topProducts.single.profitMargin, 40);
    expect(report.paymentBreakdown['CASH'], 200);
    expect(report.paymentBreakdown['CBE_BIRR'], 300);
  });

  test('Shift and stock movement parse operational API field names', () {
    final shift = Shift.fromJson({
      'id': 'shift-1',
      'status': 'OPEN',
      'openingFloat': 500,
      'openedAt': '2026-11-11T08:00:00.000Z',
      'expectedCashInTill': 620,
    });
    final movement = StockMovement.fromJson({
      'id': 'movement-1',
      'productId': 'prod-1',
      'product': 'Coffee',
      'type': 'RECEIPT',
      'quantity': 10,
      'reason': 'Supplier delivery',
      'date': '2026-11-11T08:00:00.000Z',
      'actor': 'Store Owner',
    });

    expect(shift.startTime, DateTime.parse('2026-11-11T08:00:00.000Z'));
    expect(shift.expectedCash, 620);
    expect(movement.productName, 'Coffee');
    expect(movement.type, 'INTAKE');
    expect(movement.quantity, 10);
    expect(movement.userName, 'Store Owner');
  });
}
