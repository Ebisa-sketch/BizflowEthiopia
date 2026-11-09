import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../models/shift.dart';

class ShiftProvider with ChangeNotifier {
  final ApiClient _api = ApiClient();
  Shift? _currentShift;
  bool _isLoading = false;
  String? _errorMessage;

  Shift? get currentShift => _currentShift;
  bool get hasActiveShift => _currentShift != null && _currentShift!.isOpen;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchCurrentShift() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.get('/api/shifts/current');
      if (res != null && res['shift'] != null) {
        _currentShift = Shift.fromJson(res['shift']);
      } else {
        _currentShift = null;
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> openShift(double openingFloat) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.post('/api/shifts', body: {
        'openingFloat': openingFloat,
      });
      if (res != null && res['shift'] != null) {
        _currentShift = Shift.fromJson(res['shift']);
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> closeShift(double actualCash, {String? notes}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _api.post('/api/shifts/close', body: {
        'closingCash': actualCash,
        'notes': notes,
      });
      _currentShift = null;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}

