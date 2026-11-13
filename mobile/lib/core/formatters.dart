import 'package:intl/intl.dart';

class Formatters {
  static final NumberFormat _currencyFormat = NumberFormat('#,##0.00', 'en_US');
  static final NumberFormat _integerFormat = NumberFormat('#,##0', 'en_US');
  static final DateFormat _dateTimeFormat = DateFormat(
    'MMM dd, yyyy • hh:mm a',
  );
  static final DateFormat _dateFormat = DateFormat('MMM dd, yyyy');
  static final DateFormat _timeFormat = DateFormat('hh:mm a');

  /// Formats currency to ETB standard matching BizFlow web app:
  /// e.g. ETB 1,250.50
  static String formatMoney(dynamic amount, {String currency = 'ETB'}) {
    if (amount == null) return '$currency 0.00';
    double val = 0.0;
    if (amount is num) {
      val = amount.toDouble();
    } else if (amount is String) {
      val = double.tryParse(amount) ?? 0.0;
    }
    return '$currency ${_currencyFormat.format(val)}';
  }

  /// Formats number with commas: 1,500
  static String formatNumber(num number) {
    return _integerFormat.format(number);
  }

  /// Formats date and time
  static String formatDateTime(DateTime dateTime) {
    return _dateTimeFormat.format(dateTime);
  }

  /// Formats date only
  static String formatDate(DateTime dateTime) {
    return _dateFormat.format(dateTime);
  }

  /// Formats time only
  static String formatTime(DateTime dateTime) {
    return _timeFormat.format(dateTime);
  }
}
