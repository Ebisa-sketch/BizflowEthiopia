import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../models/expense.dart';

class ExpensesProvider with ChangeNotifier {
  final ApiClient _api = ApiClient();
  List<Expense> _expenses = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _selectedCategory = 'ALL';

  List<Expense> get expenses => _expenses;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get selectedCategory => _selectedCategory;

  double get totalExpenses => _expenses.fold(0.0, (sum, e) => sum + e.amount);

  List<Expense> get filteredExpenses {
    if (_selectedCategory == 'ALL') return _expenses;
    return _expenses.where((e) => e.category == _selectedCategory).toList();
  }

  Future<void> fetchExpenses() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.get('/api/expenses');
      if (res is List) {
        _expenses = res.map((j) => Expense.fromJson(j)).toList();
      } else if (res is Map && res['expenses'] is List) {
        _expenses = (res['expenses'] as List).map((j) => Expense.fromJson(j)).toList();
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setCategoryFilter(String cat) {
    _selectedCategory = cat;
    notifyListeners();
  }

  Future<bool> recordExpense({
    required String category,
    required double amount,
    required String paymentMethod,
    String? note,
  }) async {
    try {
      await _api.post('/api/expenses', body: {
        'category': category,
        'amount': amount,
        'paymentMethod': paymentMethod,
        'note': note,
      });
      await fetchExpenses();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteExpense(String id) async {
    try {
      await _api.delete('/api/expenses/$id');
      await fetchExpenses();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }
}

