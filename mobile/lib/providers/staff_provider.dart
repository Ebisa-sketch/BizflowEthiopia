import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../models/staff_member.dart';

class StaffProvider with ChangeNotifier {
  final ApiClient _api = ApiClient();
  List<StaffMember> _staff = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<StaffMember> get staff => _staff;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchStaff() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.get('/api/staff');
      if (res is List) {
        _staff = res.map((j) => StaffMember.fromJson(j)).toList();
      } else if (res is Map && res['staff'] is List) {
        _staff = (res['staff'] as List).map((j) => StaffMember.fromJson(j)).toList();
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addStaff({
    required String name,
    required String email,
    required String role,
    String? phone,
    String? password,
  }) async {
    try {
      await _api.post('/api/staff', body: {
        'name': name.trim(),
        'email': email.trim(),
        'role': role,
        if (phone != null && phone.isNotEmpty) 'phone': phone.trim(),
        if (password != null && password.isNotEmpty) 'password': password.trim(),
      });
      await fetchStaff();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateStaff({
    required String id,
    String? role,
    String? status,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (role != null) body['role'] = role;
      if (status != null) body['status'] = status;
      await _api.patch('/api/staff/$id', body: body);
      await fetchStaff();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteStaff(String id) async {
    try {
      await _api.delete('/api/staff/$id');
      await fetchStaff();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }
}
