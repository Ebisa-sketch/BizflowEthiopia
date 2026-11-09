import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../models/customer.dart';

class CustomersProvider with ChangeNotifier {
  final ApiClient _api = ApiClient();
  List<Customer> _customers = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Customer> get customers => _customers;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  List<Customer> get debtors => _customers.where((c) => c.creditBalance > 0).toList();
  double get totalOutstandingCredit => _customers.fold(0.0, (sum, c) => sum + c.creditBalance);

  Future<void> fetchCustomers() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.get('/api/customers');
      if (res is List) {
        _customers = res.map((j) => Customer.fromJson(j)).toList();
      } else if (res is Map && res['customers'] is List) {
        _customers = (res['customers'] as List).map((j) => Customer.fromJson(j)).toList();
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> recordRepayment({
    required String customerId,
    required double amount,
    required String paymentMethod,
    String? note,
  }) async {
    try {
      await _api.post('/api/customers/repay', body: {
        'customerId': customerId,
        'amount': amount,
        'paymentMethod': paymentMethod,
        'note': note ?? 'Mobile credit repayment',
      });
      await fetchCustomers();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }
}
