class SaleItemRecord {
  final String id;
  final String productName;
  final int quantity;
  final double unitPrice;
  final double discount;
  final double total;

  SaleItemRecord({
    required this.id,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    this.discount = 0.0,
    required this.total,
  });

  factory SaleItemRecord.fromJson(Map<String, dynamic> json) {
    return SaleItemRecord(
      id: json['id']?.toString() ?? '',
      productName:
          json['name']?.toString() ??
          (json['product'] != null
              ? json['product']['name']?.toString() ?? 'Item'
              : json['productNameSnapshot']?.toString() ??
                    json['productName']?.toString() ??
                    'Item'),
      quantity: (json['quantity'] is num)
          ? (json['quantity'] as num).toInt()
          : int.tryParse(json['quantity']?.toString() ?? '1') ?? 1,
      unitPrice: (json['unitPrice'] is num)
          ? (json['unitPrice'] as num).toDouble()
          : double.tryParse(json['unitPrice']?.toString() ?? '0') ?? 0.0,
      discount: (json['discount'] is num)
          ? (json['discount'] as num).toDouble()
          : double.tryParse(json['discount']?.toString() ?? '0') ?? 0.0,
      total: _number(json['total'] ?? json['lineTotal']),
    );
  }

  static double _number(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0.0;
  }
}

class SaleRecord {
  final String id;
  final String receiptNumber;
  final double total;
  final double amountPaid;
  final double change;
  final String paymentMethod;
  final DateTime createdAt;
  final String? customerName;
  final String? customerPhone;
  final String? cashierName;
  final List<SaleItemRecord> items;

  SaleRecord({
    required this.id,
    required this.receiptNumber,
    required this.total,
    required this.amountPaid,
    required this.change,
    required this.paymentMethod,
    required this.createdAt,
    this.customerName,
    this.customerPhone,
    this.cashierName,
    required this.items,
  });

  factory SaleRecord.fromJson(Map<String, dynamic> json) {
    var rawItems = json['items'] ?? json['saleItems'] ?? [];
    List<SaleItemRecord> itemsList = [];
    if (rawItems is List) {
      itemsList = rawItems.map((i) => SaleItemRecord.fromJson(i)).toList();
    }

    final rawPayments = json['payments'];
    final payments = rawPayments is List
        ? rawPayments.whereType<Map>().toList()
        : const <Map>[];
    final firstPayment = payments.isNotEmpty ? payments.first : null;
    final paymentMethod =
        firstPayment?['method'] ?? json['paymentMethod'] ?? 'CASH';
    final paymentReference = firstPayment?['reference']?.toString() ?? '';
    final normalizedMethod =
        paymentMethod.toString() == 'OTHER' &&
            paymentReference.toUpperCase().contains('IDDA')
        ? 'CREDIT'
        : paymentMethod.toString();
    final amountPaid = payments.fold<double>(
      0,
      (sum, payment) => sum + SaleItemRecord._number(payment['amount']),
    );

    return SaleRecord(
      id: json['id']?.toString() ?? '',
      receiptNumber:
          json['saleNumber']?.toString() ??
          json['receiptNumber']?.toString() ??
          (json['id']?.toString() ?? ''),
      total: SaleItemRecord._number(json['grandTotal'] ?? json['total']),
      amountPaid: SaleItemRecord._number(json['amountPaid']) > 0
          ? SaleItemRecord._number(json['amountPaid'])
          : amountPaid,
      change: (json['change'] is num)
          ? (json['change'] as num).toDouble()
          : double.tryParse(json['change']?.toString() ?? '0') ?? 0.0,
      paymentMethod: normalizedMethod,
      createdAt:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      customerName:
          json['customerName']?.toString() ??
          (json['customer'] != null
              ? json['customer']['name']?.toString()
              : null),
      customerPhone: json['customer'] != null
          ? json['customer']['phone']?.toString()
          : null,
      cashierName: json['cashier'] != null
          ? json['cashier']['name']?.toString()
          : null,
      items: itemsList,
    );
  }
}
