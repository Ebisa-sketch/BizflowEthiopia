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

    test('calculates 15% VAT and discounts accurately', () {
      pos.addToCart(testProduct); // subtotal = 35.0
      expect(pos.grandTotal, 35.0);

      // Apply 15% VAT
      pos.toggleVat(true);
      expect(pos.vatAmount, closeTo(5.25, 0.01)); // 35 * 0.15 = 5.25
      expect(pos.grandTotal, closeTo(40.25, 0.01));

      // Apply 5 ETB discount
      pos.setDiscount(5.0);
      expect(pos.vatAmount, closeTo(4.50, 0.01)); // (35 - 5) * 0.15 = 4.50
      expect(pos.grandTotal, closeTo(34.50, 0.01)); // 30 + 4.50 = 34.50
    });

    test('percentage discounts track cart subtotal and stay within 100%', () {
      pos.addToCart(testProduct);
      pos.setDiscountPercent(10);
      expect(pos.discount, 3.5);
      expect(pos.discountPercent, 10);
      expect(pos.discountIsPercent, isTrue);

      pos.addToCart(testProduct);
      expect(pos.discount, 7);

      pos.setDiscountPercent(150);
      expect(pos.discountPercent, 100);
      expect(pos.discount, 70);

      pos.setDiscount(5);
      expect(pos.discountIsPercent, isFalse);
      expect(pos.discountPercent, 0);
    });

    test('parks cart as held draft and resumes draft', () {
      pos.addToCart(testProduct);
      expect(pos.cart.length, 1);

      // Park order
      pos.holdCurrentCart('Table 4 Order');
      expect(pos.cart.isEmpty, true);
      expect(pos.heldDrafts.length, 1);
      expect(pos.heldDrafts.first.note, 'Table 4 Order');

      // Resume order
      pos.resumeDraft(pos.heldDrafts.first);
      expect(pos.cart.length, 1);
      expect(pos.heldDrafts.isEmpty, true);
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
