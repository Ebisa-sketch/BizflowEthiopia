import 'category.dart';

class Product {
  final String id;
  final String name;
  final String? sku;
  final String? barcode;
  final double price;
  final double costPrice;
  final int stock;
  final int reorderLevel;
  final String? categoryId;
  final Category? category;

  Product({
    required this.id,
    required this.name,
    this.sku,
    this.barcode,
    required this.price,
    this.costPrice = 0.0,
    required this.stock,
    this.reorderLevel = 5,
    this.categoryId,
    this.category,
  });

  bool get isOutOfStock => stock <= 0;
  bool get isLowStock => stock > 0 && stock <= reorderLevel;

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unnamed Product',
      sku: json['sku']?.toString(),
      barcode: json['barcode']?.toString(),
      price: (json['price'] is num)
          ? (json['price'] as num).toDouble()
          : double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      costPrice: (json['costPrice'] is num)
          ? (json['costPrice'] as num).toDouble()
          : double.tryParse(json['costPrice']?.toString() ?? '0') ?? 0.0,
      stock: (json['stock'] is num)
          ? (json['stock'] as num).toInt()
          : int.tryParse(json['stock']?.toString() ?? '0') ?? 0,
      reorderLevel: (json['reorderLevel'] is num)
          ? (json['reorderLevel'] as num).toInt()
          : int.tryParse(json['reorderLevel']?.toString() ?? '5') ?? 5,
      categoryId: json['categoryId']?.toString(),
      category: json['category'] != null ? Category.fromJson(json['category']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'sku': sku,
    'barcode': barcode,
    'price': price,
    'costPrice': costPrice,
    'stock': stock,
    'reorderLevel': reorderLevel,
    'categoryId': categoryId,
  };
}
