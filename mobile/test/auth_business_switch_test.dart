import 'dart:convert';

import 'package:bizflow_mobile/core/api_client.dart';
import 'package:bizflow_mobile/providers/auth_provider.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('switching business updates active tenant and session cookie', () async {
    SharedPreferences.setMockInitialValues({});
    final requests = <http.Request>[];
    final client = MockClient((request) async {
      requests.add(request);
      if (request.url.path.endsWith('/api/auth/login')) {
        return http.Response(
          jsonEncode({
            'success': true,
            'user': {
              'id': 'user-1',
              'name': 'Aster',
              'email': 'aster@example.com',
              'role': 'OWNER',
              'businessId': 'business-1',
              'businessName': 'Aster Shop',
              'currency': 'ETB',
              'availableBusinesses': [
                {'id': 'business-1', 'name': 'Aster Shop', 'role': 'OWNER'},
                {'id': 'business-2', 'name': 'Aster Cafe', 'role': 'MANAGER'},
              ],
            },
          }),
          200,
          headers: {'set-cookie': 'auth-token=business-1; Path=/; HttpOnly'},
        );
      }
      if (request.url.path.endsWith('/api/auth/switch-business')) {
        return http.Response(
          jsonEncode({
            'success': true,
            'activeBusiness': {
              'id': 'business-2',
              'name': 'Aster Cafe',
              'role': 'MANAGER',
              'currency': 'ETB',
            },
          }),
          200,
          headers: {'set-cookie': 'auth-token=business-2; Path=/; HttpOnly'},
        );
      }
      return http.Response(
        '{"success":true}',
        200,
        headers: {'set-cookie': 'auth-token=refreshed; Path=/; HttpOnly'},
      );
    });
    final api = ApiClient.forTesting(client, 'https://api.example.test');
    final auth = AuthProvider(apiClient: api);

    expect(await auth.login('aster@example.com', 'password'), isTrue);
    expect(await auth.switchBusiness('business-2'), isTrue);

    expect(auth.user?.businessId, 'business-2');
    expect(auth.user?.business?.name, 'Aster Cafe');
    expect(auth.user?.role, 'MANAGER');
    expect(auth.user?.availableBusinesses, hasLength(2));

    await api.get('/api/auth/me');
    expect(requests.last.headers['cookie'], 'auth-token=business-2');
    expect(requests.last.headers['x-business-id'], 'business-2');
    await api.get('/api/auth/me');
    expect(requests.last.headers['cookie'], 'auth-token=refreshed');
  });
}
