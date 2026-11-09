class Category {
  final String id;
  final String name;
  final String? description;
  final int productCount;
  final int totalStock;
  final double totalValue;

  Category({
    required this.id,
    required this.name,
    this.description,
    this.productCount = 0,
    this.totalStock = 0,
    this.totalValue = 0.0,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    final count = json['productCount'] ?? json['totalProducts'] ?? 0;
    final stock = json['totalStock'] ?? 0;
    final val = json['totalValue'] ?? 0.0;

    return Category(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString(),
      productCount: (count is num) ? count.toInt() : int.tryParse(count.toString()) ?? 0,
      totalStock: (stock is num) ? stock.toInt() : int.tryParse(stock.toString()) ?? 0,
      totalValue: (val is num) ? val.toDouble() : double.tryParse(val.toString()) ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
  };
}
