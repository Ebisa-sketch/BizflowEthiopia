import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../models/category.dart';

class CategoriesProvider with ChangeNotifier {
  final ApiClient _api = ApiClient();
  List<Category> _categories = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Category> get categories => _categories;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  int get totalCategories => _categories.length;
  int get totalProducts => _categories.fold(0, (sum, c) => sum + c.productCount);
  int get totalStock => _categories.fold(0, (sum, c) => sum + c.totalStock);
  double get totalCatalogValue => _categories.fold(0.0, (sum, c) => sum + c.totalValue);

  Future<void> fetchCategories() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.get('/api/categories');
      if (res is List) {
        _categories = res.map((j) => Category.fromJson(j)).toList();
      } else if (res is Map && res['categories'] is List) {
        _categories = (res['categories'] as List).map((j) => Category.fromJson(j)).toList();
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addCategory(String name, {String? description}) async {
    try {
      await _api.post('/api/categories', body: {
        'name': name.trim(),
        if (description != null && description.isNotEmpty) 'description': description.trim(),
      });
      await fetchCategories();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateCategory(String id, String name, {String? description}) async {
    try {
      await _api.patch('/api/categories/$id', body: {
        'name': name.trim(),
        if (description != null) 'description': description.trim(),
      });
      await fetchCategories();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteCategory(String id) async {
    try {
      await _api.delete('/api/categories/$id');
      await fetchCategories();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }
}
