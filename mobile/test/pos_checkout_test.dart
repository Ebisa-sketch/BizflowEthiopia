import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:bizflow_mobile/core/api_client.dart';
import 'package:bizflow_mobile/core/constants.dart';
import 'package:bizflow_mobile/models/product.dart';
import 'package:bizflow_mobile/providers/pos_provider.dart';

void main() {
  final product = Product(id: 'prod-1', name: 'Coffee', price: 120, stock: 5);

  test(
    'checkout sends the API payload and reuses its key after a retry',
    () async {
      final requestBodies = <Map<String, dynamic>>[];
      var requestCount = 0;
      final client = MockClient((request) async {
        requestCount++;
        requestBodies.add(
          Map<String, dynamic>.from(jsonDecode(request.body) as Map),
        );
        if (requestCount == 1) {
          return http.Response('{"error":"Temporary server error"}', 503);
        }
        return http.Response(
          jsonEncode({
            'success': true,
            'receipt': {
              'saleId': 'sale-1',
              'saleNumber': 'BF-2026-001',
              'createdAt': '2026-11-11T08:00:00.000Z',
              'customerName': 'Walk-in Customer',
              'items': [
                {
                  'name': 'Coffee',
                  'quantity': 1,
                  'unitPrice': 120,
                  'lineTotal': 120,
                },
              ],
              'subtotal': 120,
              'discountTotal': 5,
              'taxTotal': 17.25,
              'grandTotal': 132.25,
              'payment': {
                'method': 'CASH',
                'amount': 132.25,
                'reference': null,
                'tendered': 132.25,
                'change': 0,
              },
            },
          }),
          200,
        );
      });
      final pos = PosProvider(
        apiClient: ApiClient.forTesting(client, 'https://api.example.test'),
      );
      pos.addToCart(product);
      pos.toggleVat(true);
      pos.setDiscount(5);
      pos.setPaymentMethod(AppConstants.paymentCash);

      expect(await pos.checkout(), isFalse);
      expect(await pos.checkout(), isTrue);
      expect(requestCount, 2);

      final firstPayload = requestBodies.first;
      final payment = firstPayload['payment'] as Map;
      expect(firstPayload['items'], [
        {'productId': 'prod-1', 'quantity': 1},
      ]);
      expect(firstPayload['discountTotal'], 5);
      expect(firstPayload['applyVat'], isTrue);
      expect(firstPayload.containsKey('paymentMethod'), isFalse);
      expect(payment['paymentMethod'], 'CASH');
      expect(payment['amount'], 132.25);
      expect(payment['tendered'], 132.25);
      expect(
        requestBodies.last['idempotencyKey'],
        firstPayload['idempotencyKey'],
      );
      expect(firstPayload['idempotencyKey'], isA<String>());
      expect(
        firstPayload['idempotencyKey'],
        startsWith('mobile_pos_'),
      );
      expect(pos.lastReceipt?['receiptNumber'], 'BF-2026-001');
      expect(pos.lastReceipt?['grandTotal'], 132.25);
    },
  );

  test('digital checkout requires a transaction reference', () async {
    var requestCount = 0;
    final pos = PosProvider(
      apiClient: ApiClient.forTesting(
        MockClient((_) async {
          requestCount++;
          return http.Response('{}', 200);
        }),
        'https://api.example.test',
      ),
    );
    pos.addToCart(product);
    pos.setPaymentMethod(AppConstants.paymentTelebirr);

    expect(await pos.checkout(), isFalse);
    expect(pos.errorMessage, contains('reference'));
    expect(pos.isSubmitting, isFalse);
    expect(requestCount, 0);
  });

  test('discount approval token is included in the sale request', () async {
    final requestBodies = <Map<String, dynamic>>[];
    final client = MockClient((request) async {
      final body = Map<String, dynamic>.from(jsonDecode(request.body) as Map);
      requestBodies.add(body);
      if (request.url.path.endsWith('/authorize-discount')) {
        return http.Response(
          jsonEncode({'success': true, 'authorizationToken': 'approved-token'}),
          200,
        );
      }
      return http.Response(
        jsonEncode({
          'success': true,
          'receipt': {
            'saleNumber': 'BF-2026-002',
            'items': [],
            'payment': {'method': 'CASH', 'amount': 115, 'tendered': 115},
          },
        }),
        200,
      );
    });
    final pos = PosProvider(
      apiClient: ApiClient.forTesting(client, 'https://api.example.test'),
    );
    pos.addToCart(product);
    pos.setDiscount(5);
    pos.setPaymentMethod(AppConstants.paymentCash);

    expect(
      await pos.authorizeDiscount(
        email: 'manager@example.com',
        password: 'manager-password',
      ),
      isTrue,
    );
    expect(await pos.checkout(), isTrue);
    expect(requestBodies.first, {
      'email': 'manager@example.com',
      'password': 'manager-password',
    });
    expect(requestBodies.last['managerApprovalToken'], 'approved-token');
  });
}
