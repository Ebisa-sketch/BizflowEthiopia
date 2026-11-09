import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../models/report_data.dart';

class ReportsProvider with ChangeNotifier {
  final ApiClient _api = ApiClient();
  ReportData _report = ReportData();
  bool _isLoading = false;
  String? _errorMessage;
  String _period = 'month'; // today, week, month, year

  ReportData get report => _report;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get period => _period;

  Future<void> fetchReport([String? newPeriod]) async {
    if (newPeriod != null) _period = newPeriod;
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.get('/api/reports', queryParams: {'period': _period});
      if (res is Map<String, dynamic>) {
        _report = ReportData.fromJson(res);
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setPeriod(String p) {
    fetchReport(p);
  }
}

