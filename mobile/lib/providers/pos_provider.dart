import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/constants.dart';
import '../models/cart_item.dart';
import '../models/customer.dart';
import '../models/product.dart';

class PosProvider with ChangeNotifier {
  final ApiClient _api = ApiClient();
  final List<CartItem> _cart = [];

  String _paymentMethod = AppConstants.paymentCash;
  String _cashTenderedStr = '';
  Customer? _selectedCustomer;
  String? _paymentReference;
  bool _isSubmitting = false;
  String? _errorMessage;
  bool _showKeypad = true;

  List<CartItem> get cart => _cart;
  String get paymentMethod => _paymentMethod;
  String get cashTenderedStr => _cashTenderedStr;
  Customer? get selectedCustomer => _selectedCustomer;
  String? get paymentReference => _paymentReference;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;
  bool get showKeypad => _showKeypad;

  int get totalItemCount => _cart.fold(0, (sum, item) => sum + item.quantity);
  double get subtotal => _cart.fold(0.0, (sum, item) => sum + item.total);

  double get cashTendered => double.tryParse(_cashTenderedStr) ?? 0.0;
  double get cashChange => (cashTendered - subtotal) > 0 ? (cashTendered - subtotal) : 0.0;

  void toggleKeypad() {
    _showKeypad = !_showKeypad;
    notifyListeners();
  }

  void addToCart(Product product) {
    final existingIndex = _cart.indexWhere((item) => item.product.id == product.id);
    if (existingIndex >= 0) {
      if (_cart[existingIndex].quantity < product.stock) {
        _cart[existingIndex].quantity++;
      }
    } else {
      if (product.stock > 0) {
        _cart.add(CartItem(product: product, quantity: 1));
      }
    }
    notifyListeners();
  }

  void updateQuantity(String productId, int delta) {
    final index = _cart.indexWhere((item) => item.product.id == productId);
    if (index >= 0) {
      final newQty = _cart[index].quantity + delta;
      if (newQty <= 0) {
        _cart.removeAt(index);
      } else if (newQty <= _cart[index].product.stock) {
        _cart[index].quantity = newQty;
      }
      notifyListeners();
    }
  }

  void removeFromCart(String productId) {
    _cart.removeWhere((item) => item.product.id == productId);
    notifyListeners();
  }

  void clearCart() {
    _cart.clear();
    _cashTenderedStr = '';
    _selectedCustomer = null;
    _paymentReference = null;
    _errorMessage = null;
    notifyListeners();
  }

  void setPaymentMethod(String method) {
    _paymentMethod = method;
    if (method == AppConstants.paymentCash && _cashTenderedStr.isEmpty) {
      _cashTenderedStr = subtotal.toStringAsFixed(2);
    }
    notifyListeners();
  }

  void setSelectedCustomer(Customer? customer) {
    _selectedCustomer = customer;
    notifyListeners();
  }

  void setPaymentReference(String? ref) {
    _paymentReference = ref;
    notifyListeners();
  }

  // Keypad Handlers
  void handleKeypadDigit(String digit) {
    if (digit == '.') {
      if (!_cashTenderedStr.contains('.')) {
        _cashTenderedStr = _cashTenderedStr.isEmpty ? '0.' : '$_cashTenderedStr.';
      }
    } else {
      if (_cashTenderedStr == '0') {
        _cashTenderedStr = digit;
      } else {
        _cashTenderedStr += digit;
      }
    }
    notifyListeners();
  }

  void handleKeypadBackspace() {
    if (_cashTenderedStr.isNotEmpty) {
      _cashTenderedStr = _cashTenderedStr.substring(0, _cashTenderedStr.length - 1);
      notifyListeners();
    }
  }

  void handleKeypadClear() {
    _cashTenderedStr = '';
    notifyListeners();
  }

  void handleKeypadExact() {
    _cashTenderedStr = subtotal.toStringAsFixed(2);
    notifyListeners();
  }

  void handleKeypadAdd(int amount) {
    final current = double.tryParse(_cashTenderedStr) ?? 0.0;
    _cashTenderedStr = (current + amount).toStringAsFixed(2);
    notifyListeners();
  }

  // Checkout API Submission
  Future<bool> checkout() async {
    if (_cart.isEmpty) {
      _errorMessage = 'Cart is empty';
      notifyListeners();
      return false;
    }

    if (_paymentMethod == AppConstants.paymentCash && cashTendered < subtotal) {
      _errorMessage = 'Tendered cash is less than the sale total';
      notifyListeners();
      return false;
    }

    if (_paymentMethod == AppConstants.paymentCredit && _selectedCustomer == null) {
      _errorMessage = 'Please select a customer for credit sales';
      notifyListeners();
      return false;
    }

    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final idempotencyKey = 'mobile_pos_${DateTime.now().millisecondsSinceEpoch}';
      final payload = {
        'items': _cart.map((item) => {
          'productId': item.product.id,
          'quantity': item.quantity,
          'unitPrice': item.customPrice,
          'discount': item.discount,
        }).toList(),
        'paymentMethod': _paymentMethod,
        'amountPaid': _paymentMethod == AppConstants.paymentCash ? cashTendered : subtotal,
        'change': _paymentMethod == AppConstants.paymentCash ? cashChange : 0.0,
        'customerId': _selectedCustomer?.id,
        'paymentReference': _paymentReference,
        'idempotencyKey': idempotencyKey,
      };

      await _api.post('/api/sales', body: payload);
      clearCart();
      _isSubmitting = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isSubmitting = false;
      notifyListeners();
      return false;
    }
  }
}

