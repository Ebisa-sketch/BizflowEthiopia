import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../models/stock_movement.dart';

class InventoryProvider with ChangeNotifier {
  final ApiClient _api = ApiClient();
  List<StockMovement> _movements = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<StockMovement> get movements => _movements;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchMovements() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.get('/api/inventory');
      if (res is List) {
        _movements = res.map((j) => StockMovement.fromJson(j)).toList();
      } else if (res is Map && res['movements'] is List) {
        _movements = (res['movements'] as List).map((j) => StockMovement.fromJson(j)).toList();
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> recordMovement({
    required String productId,
    required String type,
    required int quantity,
    String? note,
  }) async {
    try {
      await _api.post('/api/inventory', body: {
        'productId': productId,
        'type': type,
        'quantity': quantity,
        'note': note,
      });
      await fetchMovements();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }
}

