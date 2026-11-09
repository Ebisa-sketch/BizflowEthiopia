import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api_client.dart';
import '../core/constants.dart';
import '../models/user.dart';

class AuthProvider with ChangeNotifier {
  final ApiClient _api = ApiClient();
  User? _user;
  bool _isLoading = false;
  String? _errorMessage;

  User? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> checkAuthStatus() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString(AppConstants.keyUser);
      if (userJson != null) {
        _user = User.fromJson(jsonDecode(userJson));
        if (_user?.businessId != null) {
          _api.setBusinessId(_user!.businessId);
        }
      }

      // Verify token with backend
      final res = await _api.get('/api/auth/me');
      if (res != null && res['user'] != null) {
        _user = User.fromJson(res['user']);
        await prefs.setString(AppConstants.keyUser, jsonEncode(_user!.toJson()));
        if (_user?.businessId != null) {
          _api.setBusinessId(_user!.businessId);
        }
      }
    } catch (_) {
      // Offline fallback: keep cached user if present
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.post('/api/auth/login', body: {
        'email': email.trim(),
        'password': password,
      });

      if (res != null && res['user'] != null) {
        _user = User.fromJson(res['user']);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConstants.keyUser, jsonEncode(_user!.toJson()));
        if (_user?.businessId != null) {
          _api.setBusinessId(_user!.businessId);
        }
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        throw AppException('Invalid login response from server');
      }
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _api.post('/api/auth/logout');
    } catch (_) {}

    _user = null;
    await _api.setSessionCookie(null);
    _api.setBusinessId(null);

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.keyUser);
    await prefs.remove(AppConstants.keyAuthToken);
    notifyListeners();
  }
}

