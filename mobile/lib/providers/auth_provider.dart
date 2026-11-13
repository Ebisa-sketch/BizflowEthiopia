import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/api_client.dart';
import '../core/constants.dart';
import '../models/user.dart';

class AuthProvider with ChangeNotifier {
  AuthProvider({ApiClient? apiClient}) : _api = apiClient ?? ApiClient();

  final ApiClient _api;
  User? _user;
  bool _isLoading = false;
  bool _isSwitchingBusiness = false;
  String? _errorMessage;

  User? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;
  bool get isSwitchingBusiness => _isSwitchingBusiness;
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
        await prefs.setString(
          AppConstants.keyUser,
          jsonEncode(_user!.toJson()),
        );
        if (_user?.businessId != null) {
          _api.setBusinessId(_user!.businessId);
        }
      } else if (res is Map && res['authenticated'] == false) {
        _user = null;
        _api.setBusinessId(null);
        await _api.setSessionCookie(null);
        await prefs.remove(AppConstants.keyUser);
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
      final res = await _api.post(
        '/api/auth/login',
        body: {'email': email.trim(), 'password': password},
      );

      if (res != null && res['user'] != null) {
        _user = User.fromJson(res['user']);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(
          AppConstants.keyUser,
          jsonEncode(_user!.toJson()),
        );
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

  Future<bool> switchBusiness(String businessId) async {
    if (_user == null || _isSwitchingBusiness) return false;

    _isSwitchingBusiness = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final response = await _api.post(
        '/api/auth/switch-business',
        body: {'businessId': businessId},
      );
      if (response is! Map ||
          response['success'] != true ||
          response['activeBusiness'] is! Map) {
        throw AppException('Invalid business switch response from server');
      }

      final activeBusiness = Map<String, dynamic>.from(
        response['activeBusiness'] as Map,
      );
      final activeBusinessId = activeBusiness['id']?.toString();
      if (activeBusinessId == null || activeBusinessId.isEmpty) {
        throw AppException('The server did not return an active business');
      }

      _user = User.fromJson({
        ..._user!.toJson(),
        'businessId': activeBusinessId,
        'businessName': activeBusiness['name'],
        'currency': activeBusiness['currency'],
        'role': activeBusiness['role'],
        'business': {
          'id': activeBusinessId,
          'name': activeBusiness['name'],
          'currency': activeBusiness['currency'],
        },
      });
      _api.setBusinessId(activeBusinessId);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConstants.keyUser, jsonEncode(_user!.toJson()));
      return true;
    } catch (error) {
      _errorMessage = error.toString();
      return false;
    } finally {
      _isSwitchingBusiness = false;
      notifyListeners();
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
