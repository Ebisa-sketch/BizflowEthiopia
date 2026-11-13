import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/constants.dart';
import '../models/cart_item.dart';
import '../models/customer.dart';
import '../models/product.dart';

class HeldDraft {
  final String id;
  final String note;
  final DateTime savedAt;
  final List<CartItem> items;
  final Customer? customer;
  final double discount;
  final bool applyVat;

  HeldDraft({
    required this.id,
    required this.note,
    required this.savedAt,
    required this.items,
    this.customer,
    this.discount = 0.0,
    this.applyVat = false,
  });

  double get total => items.fold(0.0, (sum, i) => sum + i.total);
}

class PosProvider with ChangeNotifier {
  PosProvider({ApiClient? apiClient}) : _api = apiClient ?? ApiClient();

  final ApiClient _api;
  final List<CartItem> _cart = [];
  final List<HeldDraft> _heldDrafts = [];

  String _paymentMethod = AppConstants.paymentCash;
  String _cashTenderedStr = '';
  Customer? _selectedCustomer;
  String? _paymentReference;
  bool _isSubmitting = false;
  String? _errorMessage;
  bool _showKeypad = true;
  bool _applyVat = false;
  double _discount = 0.0;
  double _discountPercent = 0.0;
  bool _discountIsPercent = false;
  String? _managerApprovalToken;
  Map<String, dynamic>? _lastReceipt;
  String? _checkoutAttemptFingerprint;
  String? _checkoutAttemptKey;

  List<CartItem> get cart => _cart;
  List<HeldDraft> get heldDrafts => _heldDrafts;
  String get paymentMethod => _paymentMethod;
  String get cashTenderedStr => _cashTenderedStr;
  Customer? get selectedCustomer => _selectedCustomer;
  String? get paymentReference => _paymentReference;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;
  bool get showKeypad => _showKeypad;
  bool get applyVat => _applyVat;
  double get discount => _discount;
  double get discountPercent => _discountPercent;
  bool get discountIsPercent => _discountIsPercent;
  String? get managerApprovalToken => _managerApprovalToken;
  Map<String, dynamic>? get lastReceipt => _lastReceipt;

  int get totalItemCount => _cart.fold(0, (sum, item) => sum + item.quantity);
  double get subtotal => _cart.fold(0.0, (sum, item) => sum + item.total);
  double get vatAmount => _applyVat ? (subtotal - _discount) * 0.15 : 0.0;
  double get grandTotal {
    final t = subtotal - _discount + vatAmount;
    return t > 0 ? t : 0.0;
  }

  double get cashTendered => double.tryParse(_cashTenderedStr) ?? 0.0;
  double get cashChange =>
      (cashTendered - grandTotal) > 0 ? (cashTendered - grandTotal) : 0.0;

  void toggleKeypad() {
    _showKeypad = !_showKeypad;
    notifyListeners();
  }

  void toggleVat(bool val) {
    _applyVat = val;
    notifyListeners();
  }

  void setDiscount(double disc) {
    _discountIsPercent = false;
    _discountPercent = 0;
    _setDiscountAmount(disc);
  }

  void _setDiscountAmount(double disc) {
    if (disc != _discount) _managerApprovalToken = null;
    _discount = disc;
    notifyListeners();
  }

  void setDiscountPercent(double percentage) {
    _discountIsPercent = true;
    _discountPercent = percentage.isFinite
        ? percentage.clamp(0.0, 100.0).toDouble()
        : 0.0;
    _recalculatePercentDiscount();
    notifyListeners();
  }

  void _recalculatePercentDiscount() {
    final amount = subtotal * _discountPercent / 100;
    final roundedAmount = (amount * 100).roundToDouble() / 100;
    if (roundedAmount != _discount) _managerApprovalToken = null;
    _discount = roundedAmount;
  }

  Future<bool> authorizeDiscount({
    required String email,
    required String password,
  }) async {
    _errorMessage = null;
    try {
      final response = await _api.post(
        '/api/sales/authorize-discount',
        body: {'email': email.trim(), 'password': password},
      );
      if (response is! Map || response['authorizationToken'] is! String) {
        throw AppException('The server did not return discount approval.');
      }
      _managerApprovalToken = response['authorizationToken'] as String;
      notifyListeners();
      return true;
    } catch (error) {
      _errorMessage = error.toString();
      notifyListeners();
      return false;
    }
  }

  void addToCart(Product product) {
    final existingIndex = _cart.indexWhere(
      (item) => item.product.id == product.id,
    );
    if (existingIndex >= 0) {
      if (_cart[existingIndex].quantity < product.stock) {
        _cart[existingIndex].quantity++;
      }
    } else {
      if (product.stock > 0) {
        _cart.add(CartItem(product: product, quantity: 1));
      }
    }
    if (_discountIsPercent) _recalculatePercentDiscount();
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
      if (_discountIsPercent) _recalculatePercentDiscount();
      notifyListeners();
    }
  }

  void removeFromCart(String productId) {
    _cart.removeWhere((item) => item.product.id == productId);
    if (_discountIsPercent) _recalculatePercentDiscount();
    notifyListeners();
  }

  void clearCart() {
    _cart.clear();
    _cashTenderedStr = '';
    _selectedCustomer = null;
    _paymentReference = null;
    _errorMessage = null;
    _discount = 0.0;
    _discountPercent = 0.0;
    _discountIsPercent = false;
    _applyVat = false;
    _managerApprovalToken = null;
    _checkoutAttemptFingerprint = null;
    _checkoutAttemptKey = null;
    notifyListeners();
  }

  // Hold current cart as parked draft
  void holdCurrentCart([String? note]) {
    if (_cart.isEmpty) return;
    final draft = HeldDraft(
      id: 'draft_${DateTime.now().millisecondsSinceEpoch}',
      note: note ?? (_selectedCustomer?.name ?? 'Table / Customer Tab'),
      savedAt: DateTime.now(),
      items: List.from(
        _cart.map((i) => CartItem(product: i.product, quantity: i.quantity)),
      ),
      customer: _selectedCustomer,
      discount: _discount,
      applyVat: _applyVat,
    );
    _heldDrafts.add(draft);
    clearCart();
    notifyListeners();
  }

  // Resume parked draft
  void resumeDraft(HeldDraft draft) {
    _cart.clear();
    _cart.addAll(draft.items);
    _selectedCustomer = draft.customer;
    _discount = draft.discount;
    _discountPercent = 0;
    _discountIsPercent = false;
    _applyVat = draft.applyVat;
    _heldDrafts.removeWhere((d) => d.id == draft.id);
    notifyListeners();
  }

  void deleteDraft(String draftId) {
    _heldDrafts.removeWhere((d) => d.id == draftId);
    notifyListeners();
  }

  void setPaymentMethod(String method) {
    _paymentMethod = method;
    if (method == AppConstants.paymentCash && _cashTenderedStr.isEmpty) {
      _cashTenderedStr = grandTotal.toStringAsFixed(2);
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
        _cashTenderedStr = _cashTenderedStr.isEmpty
            ? '0.'
            : '$_cashTenderedStr.';
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
      _cashTenderedStr = _cashTenderedStr.substring(
        0,
        _cashTenderedStr.length - 1,
      );
      notifyListeners();
    }
  }

  void handleKeypadClear() {
    _cashTenderedStr = '';
    notifyListeners();
  }

  void handleKeypadExact() {
    _cashTenderedStr = grandTotal.toStringAsFixed(2);
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

    if (_paymentMethod == AppConstants.paymentCash &&
        cashTendered < grandTotal) {
      _errorMessage = 'Tendered cash is less than the sale total';
      notifyListeners();
      return false;
    }

    if (_paymentMethod == AppConstants.paymentCredit &&
        _selectedCustomer == null) {
      _errorMessage = 'Please select a customer for credit sales';
      notifyListeners();
      return false;
    }

    if (!discount.isFinite || discount < 0 || discount > subtotal) {
      _errorMessage = 'Discount must be between zero and the cart subtotal';
      notifyListeners();
      return false;
    }

    final isCredit = _paymentMethod == AppConstants.paymentCredit;
    final reference = isCredit
        ? 'IDDA: Store Credit - ${_selectedCustomer!.name}'
        : _paymentReference?.trim();
    if (_paymentMethod != AppConstants.paymentCash &&
        !isCredit &&
        (reference == null || reference.isEmpty)) {
      _errorMessage = 'Enter the transaction reference for this payment';
      notifyListeners();
      return false;
    }

    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final payload = <String, dynamic>{
        'items': _cart
            .map(
              (item) => {
                'productId': item.product.id,
                'quantity': item.quantity,
              },
            )
            .toList(),
        'discountTotal': _discount,
        'applyVat': _applyVat,
        if (_managerApprovalToken != null)
          'managerApprovalToken': _managerApprovalToken,
        'customerId': _selectedCustomer?.id,
        if (isCredit) 'customerName': _selectedCustomer!.name,
        'payment': {
          'paymentMethod': _paymentMethod,
          'amount': grandTotal,
          'reference': reference,
          'tendered': _paymentMethod == AppConstants.paymentCash
              ? cashTendered
              : grandTotal,
        },
      };
      final fingerprint = jsonEncode(payload);
      if (_checkoutAttemptFingerprint != fingerprint ||
          _checkoutAttemptKey == null) {
        _checkoutAttemptFingerprint = fingerprint;
        _checkoutAttemptKey =
            'mobile_pos_${DateTime.now().microsecondsSinceEpoch}_${Random.secure().nextInt(0x7fffffff)}';
      }
      final idempotencyKey = _checkoutAttemptKey!;
      payload['idempotencyKey'] = idempotencyKey;

      final res = await _api.post('/api/sales', body: payload);
      if (res is! Map || res['receipt'] is! Map) {
        throw AppException('Checkout response did not contain a receipt');
      }
      final receipt = Map<String, dynamic>.from(res['receipt'] as Map);
      final payment = receipt['payment'] is Map
          ? Map<String, dynamic>.from(receipt['payment'] as Map)
          : <String, dynamic>{};
      final receiptItems = receipt['items'] is List
          ? (receipt['items'] as List)
                .whereType<Map>()
                .map(
                  (item) => <String, dynamic>{
                    'name': item['name']?.toString() ?? 'Item',
                    'quantity': item['quantity'] ?? 1,
                    'price': item['unitPrice'] ?? 0,
                    'total': item['lineTotal'] ?? 0,
                  },
                )
                .toList()
          : <Map<String, dynamic>>[];

      // Store receipt metadata for immediate preview modal
      _lastReceipt = {
        'receiptNumber':
            receipt['saleNumber']?.toString() ??
            receipt['saleId']?.toString() ??
            '',
        'date':
            receipt['createdAt']?.toString() ??
            DateTime.now().toIso8601String(),
        'items': receiptItems,
        'subtotal': receipt['subtotal'] ?? subtotal,
        'discount': receipt['discountTotal'] ?? _discount,
        'vat': receipt['taxTotal'] ?? vatAmount,
        'grandTotal': receipt['grandTotal'] ?? grandTotal,
        'amountPaid': payment['tendered'] ?? payment['amount'] ?? grandTotal,
        'change': payment['change'] ?? cashChange,
        'paymentMethod': isCredit
            ? 'CREDIT'
            : payment['method'] ?? _paymentMethod,
        'paymentReference': payment['reference'] ?? reference,
        'customerName': receipt['customerName'] ?? _selectedCustomer?.name,
      };

      clearCart();
      _isSubmitting = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      if (_errorMessage!.contains('Manager approval is invalid or expired')) {
        _managerApprovalToken = null;
      }
      _isSubmitting = false;
      notifyListeners();
      return false;
    }
  }
}
