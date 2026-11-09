import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../models/category.dart';
import '../models/product.dart';

class ProductsProvider with ChangeNotifier {
  final ApiClient _api = ApiClient();
  List<Product> _products = [];
  List<Category> _categories = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _searchQuery = '';
  String? _selectedCategoryId;
  String _stockFilter = 'ALL'; // ALL, LOW, OUT

  List<Product> get products => _products;
  List<Category> get categories => _categories;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get searchQuery => _searchQuery;
  String? get selectedCategoryId => _selectedCategoryId;
  String get stockFilter => _stockFilter;

  List<Product> get filteredProducts {
    return _products.where((p) {
      // Category filter
      if (_selectedCategoryId != null && p.categoryId != _selectedCategoryId) {
        return false;
      }
      // Stock filter
      if (_stockFilter == 'LOW' && !p.isLowStock) return false;
      if (_stockFilter == 'OUT' && !p.isOutOfStock) return false;

      // Search query
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final nameMatch = p.name.toLowerCase().contains(q);
        final skuMatch = p.sku?.toLowerCase().contains(q) ?? false;
        final barcodeMatch = p.barcode?.toLowerCase().contains(q) ?? false;
        return nameMatch || skuMatch || barcodeMatch;
      }

      return true;
    }).toList();
  }

  Future<void> fetchProducts() => fetchProductsAndCategories();

  Future<void> fetchProductsAndCategories() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _api.get('/api/products'),
        _api.get('/api/categories'),
      ]);

      final productData = results[0];
      final categoryData = results[1];

      if (productData is List) {
        _products = productData.map((j) => Product.fromJson(j)).toList();
      } else if (productData is Map && productData['products'] is List) {
        _products = (productData['products'] as List).map((j) => Product.fromJson(j)).toList();
      }

      if (categoryData is List) {
        _categories = categoryData.map((j) => Category.fromJson(j)).toList();
      } else if (categoryData is Map && categoryData['categories'] is List) {
        _categories = (categoryData['categories'] as List).map((j) => Category.fromJson(j)).toList();
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setSearchQuery(String q) {
    _searchQuery = q;
    notifyListeners();
  }

  void setSelectedCategory(String? catId) {
    _selectedCategoryId = catId;
    notifyListeners();
  }

  void setStockFilter(String filter) {
    _stockFilter = filter;
    notifyListeners();
  }

  Future<bool> quickRestock(String productId, int quantity) async {
    try {
      await _api.post('/api/inventory', body: {
        'productId': productId,
        'quantity': quantity,
        'type': 'PURCHASE',
        'note': 'Quick restocked from mobile POS',
      });
      await fetchProductsAndCategories();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }
}

