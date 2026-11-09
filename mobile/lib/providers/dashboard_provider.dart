import 'package:flutter/material.dart';
import '../core/api_client.dart';

class DashboardMetrics {
  final double todayRevenue;
  final int todayTransactions;
  final double grossProfit;
  final int lowStockCount;

  DashboardMetrics({
    this.todayRevenue = 0.0,
    this.todayTransactions = 0,
    this.grossProfit = 0.0,
    this.lowStockCount = 0,
  });

  factory DashboardMetrics.fromJson(Map<String, dynamic> json) {
    return DashboardMetrics(
      todayRevenue: (json['todayRevenue'] is num)
          ? (json['todayRevenue'] as num).toDouble()
          : double.tryParse(json['todayRevenue']?.toString() ?? '0') ?? 0.0,
      todayTransactions: (json['todayTransactions'] is num)
          ? (json['todayTransactions'] as num).toInt()
          : int.tryParse(json['todayTransactions']?.toString() ?? '0') ?? 0,
      grossProfit: (json['grossProfit'] is num)
          ? (json['grossProfit'] as num).toDouble()
          : double.tryParse(json['grossProfit']?.toString() ?? '0') ?? 0.0,
      lowStockCount: (json['lowStockCount'] is num)
          ? (json['lowStockCount'] as num).toInt()
          : int.tryParse(json['lowStockCount']?.toString() ?? '0') ?? 0,
    );
  }
}

class DashboardProvider with ChangeNotifier {
  final ApiClient _api = ApiClient();
  DashboardMetrics _metrics = DashboardMetrics();
  bool _isLoading = false;
  String? _errorMessage;

  DashboardMetrics get metrics => _metrics;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchMetrics() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.get('/api/dashboard/metrics');
      if (res is Map<String, dynamic>) {
        _metrics = DashboardMetrics.fromJson(res);
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

