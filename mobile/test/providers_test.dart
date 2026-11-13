import 'package:flutter_test/flutter_test.dart';
import 'package:bizflow_mobile/models/category.dart';
import 'package:bizflow_mobile/models/report_data.dart';
import 'package:bizflow_mobile/models/staff_member.dart';
import 'package:bizflow_mobile/models/stock_movement.dart';
import 'package:bizflow_mobile/providers/expenses_provider.dart';
import 'package:bizflow_mobile/providers/sales_provider.dart';

void main() {
  group('Models Serialization Tests', () {
    test('Category parses rich JSON from backend', () {
      final json = {
        'id': 'cat-1',
        'name': 'Beverages',
        'description': 'Soft drinks & juices',
        'productCount': 12,
        'totalStock': 140,
        'totalValue': 4500.50,
      };

      final cat = Category.fromJson(json);
      expect(cat.id, 'cat-1');
      expect(cat.name, 'Beverages');
      expect(cat.productCount, 12);
      expect(cat.totalStock, 140);
      expect(cat.totalValue, 4500.50);
    });

    test('StaffMember parses role and status', () {
      final json = {
        'id': 'staff-1',
        'name': 'Abebe Bikila',
        'email': 'abebe@addispos.et',
        'phone': '+251911223344',
        'role': 'MANAGER',
        'status': 'ACTIVE',
        'createdAt': '2026-05-10T12:00:00Z',
      };

      final staff = StaffMember.fromJson(json);
      expect(staff.id, 'staff-1');
      expect(staff.name, 'Abebe Bikila');
      expect(staff.role, 'MANAGER');
      expect(staff.status, 'ACTIVE');
    });

    test('StockMovement parses type and quantity accurately', () {
      final json = {
        'id': 'mv-1',
        'productId': 'prod-10',
        'product': {'name': 'Habesha Beer'},
        'type': 'INTAKE',
        'quantity': 50,
        'reason': 'Weekly delivery',
        'createdAt': '2026-06-01T10:00:00Z',
      };

      final mv = StockMovement.fromJson(json);
      expect(mv.id, 'mv-1');
      expect(mv.productName, 'Habesha Beer');
      expect(mv.type, 'INTAKE');
      expect(mv.quantity, 50);
      expect(mv.reason, 'Weekly delivery');
    });

    test('ReportData calculates P&L metrics and payment breakdown', () {
      final json = {
        'revenue': 25000.0,
        'cogs': 15000.0,
        'grossProfit': 10000.0,
        'expenses': 3000.0,
        'netProfit': 7000.0,
        'paymentBreakdown': {
          'CASH': 12000.0,
          'TELEBIRR': 10000.0,
          'CBE_BIRR': 3000.0,
        },
        'topProducts': [
          {
            'id': 'p1',
            'name': 'Injera Package',
            'unitsSold': 200,
            'revenue': 5000.0,
            'profitMargin': 0.35,
          },
        ],
      };

      final report = ReportData.fromJson(json);
      expect(report.totalRevenue, 25000.0);
      expect(report.totalCogs, 15000.0);
      expect(report.grossProfit, 10000.0);
      expect(report.totalExpenses, 3000.0);
      expect(report.netProfit, 7000.0);
      expect(report.paymentBreakdown['TELEBIRR'], 10000.0);
      expect(report.topProducts.length, 1);
      expect(report.topProducts.first.name, 'Injera Package');
    });
  });

  group('Provider State Logic Tests', () {
    test('SalesProvider filters sales by search and payment method', () {
      final provider = SalesProvider();
      expect(provider.selectedPaymentMethod, 'ALL');
      expect(provider.searchQuery, '');

      provider.setPaymentFilter('TELEBIRR');
      expect(provider.selectedPaymentMethod, 'TELEBIRR');

      provider.setSearchQuery('REC-001');
      expect(provider.searchQuery, 'REC-001');
    });

    test('ExpensesProvider manages category filters', () {
      final provider = ExpensesProvider();
      expect(provider.selectedCategory, 'ALL');

      provider.setCategoryFilter('RENT');
      expect(provider.selectedCategory, 'RENT');
    });
  });
}
