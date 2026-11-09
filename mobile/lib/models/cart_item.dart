import 'product.dart';

class CartItem {
  final Product product;
  int quantity;
  double customPrice;
  double discount;

  CartItem({
    required this.product,
    this.quantity = 1,
    double? customPrice,
    this.discount = 0.0,
  }) : customPrice = customPrice ?? product.price;

  double get unitPrice => customPrice - discount > 0 ? customPrice - discount : 0;
  double get total => unitPrice * quantity;

  Map<String, dynamic> toJson() => {
    'productId': product.id,
    'quantity': quantity,
    'unitPrice': customPrice,
    'discount': discount,
    'total': total,
  };
}

