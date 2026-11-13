import 'package:bizflow_mobile/providers/dashboard_provider.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('parses the complete dashboard metrics API response', () {
    final metrics = DashboardMetrics.fromJson({
      'metrics': {
        'invoiced': 1500,
        'collected': 1200,
        'cogs': 800,
        'expenses': 100,
        'grossProfit': 700,
        'grossMarginPercentage': 46.7,
        'netOperatingProfit': 600,
        'netMarginPercentage': 40,
        'salesCount': 3,
        'avgOrderValue': 500,
        'totalOutstandingCredit': 300,
        'cashCollected': 900,
        'digitalCollected': 300,
        'comparisons': {
          'sales': {'changePercent': 25, 'text': '+25%', 'direction': 'up'},
          'grossProfit': {
            'changePercent': -10,
            'text': '-10%',
            'direction': 'down',
          },
          'transactions': {
            'changePercent': 0,
            'text': '0%',
            'direction': 'neutral',
          },
          'label': 'vs. yesterday',
        },
        'chartData': [
          {'day': '08:00', 'amount': 1500, 'profit': 700, 'sales': 3},
        ],
      },
      'lowStockItems': [
        {
          'id': 'product-1',
          'name': 'Coffee',
          'sku': 'COF-1',
          'stock': 0,
          'reorderLevel': 5,
          'isOut': true,
        },
      ],
      'recentTransactions': [
        {
          'saleNumber': 'REC-001',
          'createdAt': '2026-11-11T08:30:00.000Z',
          'customerName': 'Aster',
          'cashierName': 'Mimi',
          'grandTotal': 500,
          'itemCount': 2,
          'productsSummary': 'Coffee, Tea',
          'paymentMethod': 'CASH',
          'status': 'COMPLETED',
        },
      ],
      'topProducts': [
        {'name': 'Coffee', 'units': 2, 'revenue': 500, 'margin': '40.0%'},
      ],
      'quickStats': {
        'totalProducts': 20,
        'customersWithSales': 8,
        'totalStockValue': 4500,
        'totalExpensesInRange': 100,
      },
      'businessInsights': {
        'topProduct': {'name': 'Coffee', 'units': 2, 'revenue': 500},
        'noSalesProduct': {'name': 'Tea', 'units': 0},
        'expenseTrendText': 'Expenses are 10% lower vs. yesterday',
      },
      'paymentMethods': [
        {'method': 'CASH', 'amount': 900, 'percentage': 75, 'count': 2},
      ],
    });

    expect(metrics.todayRevenue, 1500);
    expect(metrics.collected, 1200);
    expect(metrics.grossProfit, 700);
    expect(metrics.netOperatingProfit, 600);
    expect(metrics.lowStockCount, 1);
    expect(metrics.comparisons['sales']?.text, '+25%');
    expect(metrics.comparisonLabel, 'vs. yesterday');
    expect(metrics.chartData.single.day, '08:00');
    expect(metrics.lowStockItems.single.isOut, isTrue);
    expect(metrics.recentTransactions.single.cashierName, 'Mimi');
    expect(metrics.topProduct?.name, 'Coffee');
    expect(metrics.noSalesProduct, 'Tea');
    expect(metrics.expenseTrendText, 'Expenses are 10% lower vs. yesterday');
    expect(metrics.totalProducts, 20);
    expect(metrics.customersWithSales, 8);
    expect(metrics.totalStockValue, 4500);
    expect(metrics.paymentMethods.single.percentage, 75);
  });

  test('uses safe defaults when the dashboard has no activity', () {
    final metrics = DashboardMetrics.fromJson({
      'metrics': {'invoiced': 0, 'salesCount': 0, 'chartData': []},
      'lowStockItems': [],
      'recentTransactions': [],
    });

    expect(metrics.todayRevenue, 0);
    expect(metrics.todayTransactions, 0);
    expect(metrics.lowStockItems, isEmpty);
    expect(metrics.recentTransactions, isEmpty);
    expect(metrics.chartData, isEmpty);
  });
}
