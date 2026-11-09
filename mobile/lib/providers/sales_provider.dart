import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../models/sale_record.dart';

class SalesProvider with ChangeNotifier {
  final ApiClient _api = ApiClient();
  List<SaleRecord> _sales = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _searchQuery = '';
  String _selectedPaymentMethod = 'ALL';

  List<SaleRecord> get sales => _sales;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get searchQuery => _searchQuery;
  String get selectedPaymentMethod => _selectedPaymentMethod;

  List<SaleRecord> get filteredSales {
    return _sales.where((s) {
      if (_selectedPaymentMethod != 'ALL' && s.paymentMethod != _selectedPaymentMethod) {
        return false;
      }
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final matchReceipt = s.receiptNumber.toLowerCase().contains(q);
        final matchCustomer = s.customerName?.toLowerCase().contains(q) ?? false;
        return matchReceipt || matchCustomer;
      }
      return true;
    }).toList();
  }

  Future<void> fetchSales() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.get('/api/sales', queryParams: {'limit': 50});
      if (res is List) {
        _sales = res.map((j) => SaleRecord.fromJson(j)).toList();
      } else if (res is Map && res['sales'] is List) {
        _sales = (res['sales'] as List).map((j) => SaleRecord.fromJson(j)).toList();
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setSearchQuery(String q) {
    _searchQuery = q.trim();
    notifyListeners();
  }

  void setPaymentFilter(String method) {
    _selectedPaymentMethod = method;
    notifyListeners();
  }
}

