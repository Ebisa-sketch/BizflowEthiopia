import 'package:flutter_test/flutter_test.dart';
import 'package:bizflow_mobile/core/formatters.dart';

void main() {
  group('Formatters', () {
    test('formatMoney formats amounts with ETB prefix and commas', () {
      expect(Formatters.formatMoney(0), 'ETB 0.00');
      expect(Formatters.formatMoney(50), 'ETB 50.00');
      expect(Formatters.formatMoney(1250.5), 'ETB 1,250.50');
      expect(Formatters.formatMoney('4999.99'), 'ETB 4,999.99');
      expect(Formatters.formatMoney(null), 'ETB 0.00');
    });

    test('formatNumber formats numbers with commas', () {
      expect(Formatters.formatNumber(100), '100');
      expect(Formatters.formatNumber(1500), '1,500');
      expect(Formatters.formatNumber(250000), '250,000');
    });
  });
}

