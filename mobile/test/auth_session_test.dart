import 'dart:convert';

import 'package:bizflow_mobile/core/api_client.dart';
import 'package:bizflow_mobile/core/constants.dart';
import 'package:bizflow_mobile/providers/auth_provider.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test(
    'clears cached user when server confirms session is unauthenticated',
    () async {
      SharedPreferences.setMockInitialValues({
        AppConstants.keyUser: jsonEncode({
          'id': 'user-1',
          'name': 'Aster',
          'email': 'aster@example.com',
          'role': 'OWNER',
          'businessId': 'business-1',
        }),
        AppConstants.keyAuthToken: 'bizflow_session=expired',
      });

      final api = ApiClient.forTesting(
        MockClient(
          (_) async => http.Response(
            jsonEncode({
              'success': false,
              'authenticated': false,
              'user': null,
            }),
            200,
          ),
        ),
        'https://api.example.test',
      );
      await api.init();

      final auth = AuthProvider(apiClient: api);
      await auth.checkAuthStatus();

      final prefs = await SharedPreferences.getInstance();
      expect(auth.isAuthenticated, isFalse);
      expect(prefs.containsKey(AppConstants.keyUser), isFalse);
      expect(prefs.containsKey(AppConstants.keyAuthToken), isFalse);
      expect(api.businessId, isNull);
    },
  );
}
