class StockMovement {
  final String id;
  final String productId;
  final String productName;
  final String type; // INTAKE, SALE, DAMAGE, RETURN, ADJUSTMENT
  final int quantity;
  final String? reason;
  final DateTime createdAt;
  final String? userName;

  StockMovement({
    required this.id,
    required this.productId,
    required this.productName,
    required this.type,
    required this.quantity,
    this.reason,
    required this.createdAt,
    this.userName,
  });

  factory StockMovement.fromJson(Map<String, dynamic> json) {
    return StockMovement(
      id: json['id']?.toString() ?? '',
      productId: json['productId']?.toString() ?? '',
      productName: json['product'] != null
          ? json['product']['name']?.toString() ?? 'Unknown Item'
          : 'Unknown Item',
      type: json['type']?.toString() ?? 'ADJUSTMENT',
      quantity: (json['quantity'] is num)
          ? (json['quantity'] as num).toInt()
          : int.tryParse(json['quantity']?.toString() ?? '0') ?? 0,
      reason: json['reason']?.toString() ?? json['note']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      userName: json['user'] != null ? json['user']['name']?.toString() : null,
    );
  }
}

