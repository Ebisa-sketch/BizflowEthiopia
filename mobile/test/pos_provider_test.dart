import 'package:flutter_test/flutter_test.dart';
import 'package:bizflow_mobile/models/product.dart';
import 'package:bizflow_mobile/providers/pos_provider.dart';

void main() {
  group('PosProvider & Touch Keypad Logic', () {
    late PosProvider pos;
    final testProduct = Product(
      id: 'prod_1',
      name: 'Ambo Water 500ml',
      sku: 'AMB-001',
      price: 35.0,
      stock: 50,
      reorderLevel: 10,
    );

    setUp(() {
      pos = PosProvider();
    });

    test('adds items to cart and computes subtotal accurately', () {
      pos.addToCart(testProduct);
      expect(pos.totalItemCount, 1);
      expect(pos.subtotal, 35.0);

      pos.addToCart(testProduct);
      expect(pos.totalItemCount, 2);
      expect(pos.subtotal, 70.0);
    });

    test('touch keypad digits update cash tendered and calculates change', () {
      pos.addToCart(testProduct); // subtotal = 35.0

      // Type 50 on keypad
      pos.handleKeypadDigit('5');
      pos.handleKeypadDigit('0');
      expect(pos.cashTenderedStr, '50');
      expect(pos.cashTendered, 50.0);
      expect(pos.cashChange, 15.0); // 50 - 35 = 15 change

      // Backspace
      pos.handleKeypadBackspace();
      expect(pos.cashTenderedStr, '5');

      // Clear
      pos.handleKeypadClear();
      expect(pos.cashTenderedStr, '');

      // Exact
      pos.handleKeypadExact();
      expect(pos.cashTendered, 35.0);
      expect(pos.cashChange, 0.0);

      // Quick add +50 ETB
      pos.handleKeypadAdd(50);
      expect(pos.cashTendered, 85.0);
      expect(pos.cashChange, 50.0);
    });

    test('clearing cart resets all values', () {
      pos.addToCart(testProduct);
      pos.handleKeypadDigit('1');
      pos.handleKeypadDigit('0');
      pos.handleKeypadDigit('0');

      pos.clearCart();
      expect(pos.cart.isEmpty, true);
      expect(pos.cashTenderedStr, '');
      expect(pos.totalItemCount, 0);
      expect(pos.subtotal, 0.0);
    });
  });
}
