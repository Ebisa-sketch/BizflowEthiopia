import 'package:flutter/material.dart';

import '../core/api_client.dart';

double _number(dynamic value) {
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? 0;
}

int _integer(dynamic value) {
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? 0;
}

Map<String, dynamic> _map(dynamic value) {
  return value is Map ? Map<String, dynamic>.from(value) : {};
}

class DashboardChartPoint {
  final String day;
  final double amount;
  final double profit;
  final int sales;

  const DashboardChartPoint({
    required this.day,
    required this.amount,
    required this.profit,
    required this.sales,
  });

  factory DashboardChartPoint.fromJson(Map<String, dynamic> json) {
    return DashboardChartPoint(
      day: json['day']?.toString() ?? '',
      amount: _number(json['amount']),
      profit: _number(json['profit']),
      sales: _integer(json['sales']),
    );
  }
}

class DashboardComparison {
  final int changePercent;
  final String text;
  final String direction;

  const DashboardComparison({
    required this.changePercent,
    required this.text,
    required this.direction,
  });

  factory DashboardComparison.fromJson(Map<String, dynamic> json) {
    return DashboardComparison(
      changePercent: _integer(json['changePercent']),
      text: json['text']?.toString() ?? '0%',
      direction: json['direction']?.toString() ?? 'neutral',
    );
  }
}

class DashboardLowStockItem {
  final String id;
  final String name;
  final String sku;
  final int stock;
  final int reorderLevel;
  final bool isOut;

  const DashboardLowStockItem({
    required this.id,
    required this.name,
    required this.sku,
    required this.stock,
    required this.reorderLevel,
    required this.isOut,
  });

  factory DashboardLowStockItem.fromJson(Map<String, dynamic> json) {
    final stock = _integer(json['stock']);
    return DashboardLowStockItem(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Product',
      sku: json['sku']?.toString() ?? 'N/A',
      stock: stock,
      reorderLevel: _integer(json['reorderLevel']),
      isOut: json['isOut'] == true || stock <= 0,
    );
  }
}

class DashboardRecentTransaction {
  final String saleNumber;
  final DateTime? createdAt;
  final String customerName;
  final String cashierName;
  final double grandTotal;
  final int itemCount;
  final String productsSummary;
  final String paymentMethod;
  final String status;

  const DashboardRecentTransaction({
    required this.saleNumber,
    required this.createdAt,
    required this.customerName,
    required this.cashierName,
    required this.grandTotal,
    required this.itemCount,
    required this.productsSummary,
    required this.paymentMethod,
    required this.status,
  });

  factory DashboardRecentTransaction.fromJson(Map<String, dynamic> json) {
    return DashboardRecentTransaction(
      saleNumber: json['saleNumber']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
      customerName: json['customerName']?.toString() ?? 'Walk-in Customer',
      cashierName: json['cashierName']?.toString() ?? 'Cashier',
      grandTotal: _number(json['grandTotal']),
      itemCount: _integer(json['itemCount']),
      productsSummary: json['productsSummary']?.toString() ?? 'General Items',
      paymentMethod: json['paymentMethod']?.toString() ?? 'CASH',
      status: json['status']?.toString() ?? 'COMPLETED',
    );
  }
}

class DashboardProductInsight {
  final String name;
  final int units;
  final double revenue;

  const DashboardProductInsight({
    required this.name,
    required this.units,
    required this.revenue,
  });

  factory DashboardProductInsight.fromJson(Map<String, dynamic> json) {
    return DashboardProductInsight(
      name: json['name']?.toString() ?? 'Product',
      units: _integer(json['units']),
      revenue: _number(json['revenue']),
    );
  }
}

class DashboardPaymentMethod {
  final String method;
  final double amount;
  final int percentage;
  final int? count;

  const DashboardPaymentMethod({
    required this.method,
    required this.amount,
    required this.percentage,
    this.count,
  });

  factory DashboardPaymentMethod.fromJson(Map<String, dynamic> json) {
    return DashboardPaymentMethod(
      method: json['method']?.toString() ?? 'OTHER',
      amount: _number(json['amount']),
      percentage: _integer(json['percentage']),
      count: json['count'] == null ? null : _integer(json['count']),
    );
  }
}

class DashboardMetrics {
  final double todayRevenue;
  final int todayTransactions;
  final double grossProfit;
  final int lowStockCount;
  final double collected;
  final double cogs;
  final double expenses;
  final double grossMarginPercentage;
  final double netOperatingProfit;
  final double netMarginPercentage;
  final double averageOrderValue;
  final double outstandingCredit;
  final double cashCollected;
  final double digitalCollected;
  final double subtotal;
  final double discountTotal;
  final double taxTotal;
  final double expectedCashInTill;
  final double creditDebtInRange;
  final int creditSalesCount;
  final int cashSalesCount;
  final int totalCreditCustomers;
  final String comparisonLabel;
  final Map<String, DashboardComparison> comparisons;
  final List<DashboardChartPoint> chartData;
  final List<DashboardLowStockItem> lowStockItems;
  final List<DashboardRecentTransaction> recentTransactions;
  final List<DashboardProductInsight> topProducts;
  final DashboardProductInsight? topProduct;
  final String? noSalesProduct;
  final String expenseTrendText;
  final int totalProducts;
  final int customersWithSales;
  final double totalStockValue;
  final List<DashboardPaymentMethod> paymentMethods;

  DashboardMetrics({
    this.todayRevenue = 0.0,
    this.todayTransactions = 0,
    this.grossProfit = 0.0,
    this.lowStockCount = 0,
    this.collected = 0,
    this.cogs = 0,
    this.expenses = 0,
    this.grossMarginPercentage = 0,
    this.netOperatingProfit = 0,
    this.netMarginPercentage = 0,
    this.averageOrderValue = 0,
    this.outstandingCredit = 0,
    this.cashCollected = 0,
    this.digitalCollected = 0,
    this.subtotal = 0,
    this.discountTotal = 0,
    this.taxTotal = 0,
    this.expectedCashInTill = 0,
    this.creditDebtInRange = 0,
    this.creditSalesCount = 0,
    this.cashSalesCount = 0,
    this.totalCreditCustomers = 0,
    this.comparisonLabel = '',
    this.comparisons = const {},
    this.chartData = const [],
    this.lowStockItems = const [],
    this.recentTransactions = const [],
    this.topProducts = const [],
    this.topProduct,
    this.noSalesProduct,
    this.expenseTrendText = 'No operating expenses recorded',
    this.totalProducts = 0,
    this.customersWithSales = 0,
    this.totalStockValue = 0,
    this.paymentMethods = const [],
  });

  factory DashboardMetrics.fromJson(Map<String, dynamic> json) {
    final metrics = _map(json['metrics']);
    final comparisonsJson = _map(metrics['comparisons']);
    final insights = _map(json['businessInsights']);
    final quickStats = _map(json['quickStats']);
    final topProductJson = _map(insights['topProduct']);
    final topProduct = topProductJson.isEmpty
        ? null
        : DashboardProductInsight.fromJson(topProductJson);
    final noSalesProductJson = _map(insights['noSalesProduct']);
    final rawChartData = metrics['chartData'];
    final rawLowStockItems = json['lowStockItems'];
    final rawTransactions = json['recentTransactions'];
    final rawTopProducts = json['topProducts'];
    final rawPaymentMethods = json['paymentMethods'];
    final parsedLowStock = rawLowStockItems is List
        ? rawLowStockItems
              .whereType<Map>()
              .map(
                (item) => DashboardLowStockItem.fromJson(
                  Map<String, dynamic>.from(item),
                ),
              )
              .toList()
        : <DashboardLowStockItem>[];

    return DashboardMetrics(
      todayRevenue: _number(metrics['invoiced'] ?? json['todayRevenue']),
      todayTransactions: _integer(
        metrics['salesCount'] ?? json['todayTransactions'],
      ),
      grossProfit: _number(metrics['grossProfit'] ?? json['grossProfit']),
      lowStockCount: parsedLowStock.isNotEmpty
          ? parsedLowStock.length
          : _integer(json['lowStockCount']),
      collected: _number(metrics['collected']),
      cogs: _number(metrics['cogs']),
      expenses: _number(metrics['expenses']),
      grossMarginPercentage: _number(metrics['grossMarginPercentage']),
      netOperatingProfit: _number(metrics['netOperatingProfit']),
      netMarginPercentage: _number(metrics['netMarginPercentage']),
      averageOrderValue: _number(metrics['avgOrderValue']),
      outstandingCredit: _number(metrics['totalOutstandingCredit']),
      cashCollected: _number(metrics['cashCollected']),
      digitalCollected: _number(metrics['digitalCollected']),
      subtotal: _number(metrics['subtotal']),
      discountTotal: _number(metrics['discountTotal']),
      taxTotal: _number(metrics['taxTotal']),
      expectedCashInTill: _number(metrics['expectedCashInTill']),
      creditDebtInRange: _number(metrics['creditDebtInRange']),
      creditSalesCount: _integer(metrics['creditSalesCount']),
      cashSalesCount: _integer(metrics['cashSalesCount']),
      totalCreditCustomers: _integer(metrics['totalCreditCustomers']),
      comparisonLabel: comparisonsJson['label']?.toString() ?? '',
      comparisons: Map.fromEntries(
        ['sales', 'grossProfit', 'transactions']
            .where(comparisonsJson.containsKey)
            .map(
              (key) => MapEntry(
                key,
                DashboardComparison.fromJson(_map(comparisonsJson[key])),
              ),
            ),
      ),
      chartData: rawChartData is List
          ? rawChartData
                .whereType<Map>()
                .map(
                  (item) => DashboardChartPoint.fromJson(
                    Map<String, dynamic>.from(item),
                  ),
                )
                .toList()
          : const [],
      lowStockItems: parsedLowStock,
      recentTransactions: rawTransactions is List
          ? rawTransactions
                .whereType<Map>()
                .map(
                  (item) => DashboardRecentTransaction.fromJson(
                    Map<String, dynamic>.from(item),
                  ),
                )
                .toList()
          : const [],
      topProducts: rawTopProducts is List
          ? rawTopProducts
                .whereType<Map>()
                .map(
                  (item) => DashboardProductInsight.fromJson(
                    Map<String, dynamic>.from(item),
                  ),
                )
                .toList()
          : const [],
      topProduct: topProduct,
      noSalesProduct: noSalesProductJson.isEmpty
          ? null
          : noSalesProductJson['name']?.toString(),
      expenseTrendText:
          insights['expenseTrendText']?.toString() ??
          'No operating expenses recorded',
      totalProducts: _integer(quickStats['totalProducts']),
      customersWithSales: _integer(quickStats['customersWithSales']),
      totalStockValue: _number(quickStats['totalStockValue']),
      paymentMethods: rawPaymentMethods is List
          ? rawPaymentMethods
                .whereType<Map>()
                .map(
                  (item) => DashboardPaymentMethod.fromJson(
                    Map<String, dynamic>.from(item),
                  ),
                )
                .toList()
          : const [],
    );
  }
}

class DashboardProvider with ChangeNotifier {
  final ApiClient _api = ApiClient();
  DashboardMetrics _metrics = DashboardMetrics();
  bool _isLoading = false;
  bool _hasLoaded = false;
  String? _errorMessage;

  DashboardMetrics get metrics => _metrics;
  bool get isLoading => _isLoading;
  bool get hasLoaded => _hasLoaded;
  String? get errorMessage => _errorMessage;

  Future<void> fetchMetrics([String range = 'today']) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.get(
        '/api/dashboard/metrics',
        queryParams: {'range': range},
      );
      if (res is Map) {
        _metrics = DashboardMetrics.fromJson(Map<String, dynamic>.from(res));
      } else {
        throw const FormatException('Invalid dashboard response from server');
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _hasLoaded = true;
      _isLoading = false;
      notifyListeners();
    }
  }
}
