class Expense {
  final String id;
  final String category;
  final double amount;
  final DateTime date;
  final String? note;
  final String? recordedByName;

  Expense({
    required this.id,
    required this.category,
    required this.amount,
    required this.date,
    this.note,
    this.recordedByName,
  });

  factory Expense.fromJson(Map<String, dynamic> json) {
    return Expense(
      id: json['id']?.toString() ?? '',
      category: json['category']?.toString() ?? 'OTHER',
      amount: (json['amount'] is num)
          ? (json['amount'] as num).toDouble()
          : double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0,
      date:
          DateTime.tryParse(
            json['date']?.toString() ?? json['createdAt']?.toString() ?? '',
          ) ??
          DateTime.now(),
      note: json['description']?.toString() ?? json['note']?.toString(),
      recordedByName:
          json['recordedBy']?.toString() ??
          (json['user'] != null ? json['user']['name']?.toString() : null),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'category': category,
    'amount': amount,
    'date': date.toIso8601String(),
    'note': note,
  };
}
