import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'constants.dart';

class AppException implements Exception {
  final String message;
  final int? statusCode;
  AppException(this.message, [this.statusCode]);

  @override
  String toString() => message;
}

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  String _baseUrl = AppConstants.defaultApiUrl;
  String? _sessionCookie;
  String? _businessId;

  String get baseUrl => _baseUrl;
  String? get businessId => _businessId;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final savedUrl = prefs.getString(AppConstants.keyApiUrl);
    if (savedUrl != null) {
      if ((kIsWeb || defaultTargetPlatform != TargetPlatform.android) && savedUrl.contains('10.0.2.2')) {
        _baseUrl = AppConstants.defaultApiUrl;
        await prefs.setString(AppConstants.keyApiUrl, _baseUrl);
      } else {
        _baseUrl = savedUrl;
      }
    } else {
      _baseUrl = AppConstants.defaultApiUrl;
    }
    _sessionCookie = prefs.getString(AppConstants.keyAuthToken);
    final userJson = prefs.getString(AppConstants.keyUser);
    if (userJson != null) {
      try {
        final data = jsonDecode(userJson);
        _businessId = data['businessId'] ?? data['activeBusinessId'];
      } catch (_) {}
    }
  }

  Future<void> updateBaseUrl(String newUrl) async {
    _baseUrl = newUrl.endsWith('/') ? newUrl.substring(0, newUrl.length - 1) : newUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keyApiUrl, _baseUrl);
  }

  Future<void> setSessionCookie(String? cookie) async {
    _sessionCookie = cookie;
    final prefs = await SharedPreferences.getInstance();
    if (cookie != null) {
      await prefs.setString(AppConstants.keyAuthToken, cookie);
    } else {
      await prefs.remove(AppConstants.keyAuthToken);
    }
  }

  void setBusinessId(String? id) {
    _businessId = id;
  }

  Map<String, String> _buildHeaders() {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_sessionCookie != null) {
      headers['Cookie'] = _sessionCookie!;
      headers['Authorization'] = 'Bearer $_sessionCookie';
    }
    if (_businessId != null) {
      headers['x-business-id'] = _businessId!;
    }
    return headers;
  }

  Future<dynamic> get(String endpoint, {Map<String, dynamic>? queryParams}) async {
    final uri = Uri.parse('$_baseUrl$endpoint').replace(
      queryParameters: queryParams?.map((k, v) => MapEntry(k, v.toString())),
    );

    try {
      final response = await http.get(uri, headers: _buildHeaders());
      return _processResponse(response);
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppException('Connection failed: Check network & server URL ($e)');
    }
  }

  Future<dynamic> post(String endpoint, {Map<String, dynamic>? body}) async {
    final uri = Uri.parse('$_baseUrl$endpoint');
    try {
      final response = await http.post(
        uri,
        headers: _buildHeaders(),
        body: body != null ? jsonEncode(body) : null,
      );
      _captureCookies(response);
      return _processResponse(response);
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppException('Connection failed: Check network & server URL ($e)');
    }
  }

  Future<dynamic> put(String endpoint, {Map<String, dynamic>? body}) async {
    final uri = Uri.parse('$_baseUrl$endpoint');
    try {
      final response = await http.put(
        uri,
        headers: _buildHeaders(),
        body: body != null ? jsonEncode(body) : null,
      );
      return _processResponse(response);
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppException('Connection failed: Check network & server URL ($e)');
    }
  }

  Future<dynamic> patch(String endpoint, {Map<String, dynamic>? body}) async {
    final uri = Uri.parse('$_baseUrl$endpoint');
    try {
      final response = await http.patch(
        uri,
        headers: _buildHeaders(),
        body: body != null ? jsonEncode(body) : null,
      );
      return _processResponse(response);
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppException('Connection failed: Check network & server URL ($e)');
    }
  }

  Future<dynamic> delete(String endpoint) async {
    final uri = Uri.parse('$_baseUrl$endpoint');
    try {
      final response = await http.delete(uri, headers: _buildHeaders());
      return _processResponse(response);
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppException('Connection failed: Check network & server URL ($e)');
    }
  }

  void _captureCookies(http.Response response) {
    final rawCookie = response.headers['set-cookie'];
    if (rawCookie != null) {
      // Extract session cookie (e.g. auth-token=...)
      setSessionCookie(rawCookie.split(';').first);
    }
  }

  dynamic _processResponse(http.Response response) {
    dynamic jsonBody;
    try {
      if (response.body.isNotEmpty) {
        jsonBody = jsonDecode(response.body);
      }
    } catch (_) {
      jsonBody = null;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonBody;
    }

    String errorMsg = 'Request failed (${response.statusCode})';
    if (jsonBody is Map) {
      errorMsg = jsonBody['error'] ?? jsonBody['message'] ?? errorMsg;
    }

    throw AppException(errorMsg, response.statusCode);
  }
}

