class Shift {
  final String id;
  final String status; // OPEN or CLOSED
  final double openingFloat;
  final double? closingCash;
  final double? expectedCash;
  final DateTime startTime;
  final DateTime? endTime;
  final String? cashierName;

  Shift({
    required this.id,
    required this.status,
    required this.openingFloat,
    this.closingCash,
    this.expectedCash,
    required this.startTime,
    this.endTime,
    this.cashierName,
  });

  bool get isOpen => status == 'OPEN';

  factory Shift.fromJson(Map<String, dynamic> json) {
    return Shift(
      id: json['id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'OPEN',
      openingFloat: (json['openingFloat'] is num)
          ? (json['openingFloat'] as num).toDouble()
          : double.tryParse(json['openingFloat']?.toString() ?? '0') ?? 0.0,
      closingCash: json['closingCash'] != null
          ? ((json['closingCash'] is num)
              ? (json['closingCash'] as num).toDouble()
              : double.tryParse(json['closingCash'].toString()))
          : null,
      expectedCash: json['expectedCash'] != null
          ? ((json['expectedCash'] is num)
              ? (json['expectedCash'] as num).toDouble()
              : double.tryParse(json['expectedCash'].toString()))
          : null,
      startTime: DateTime.tryParse(json['startTime']?.toString() ?? '') ?? DateTime.now(),
      endTime: json['endTime'] != null ? DateTime.tryParse(json['endTime'].toString()) : null,
      cashierName: json['cashier'] != null ? json['cashier']['name']?.toString() : null,
    );
  }
}

