class AppConstants {
  // Default API Base URL: 
  // In development, Android emulator uses 10.0.2.2 to access host machine localhost.
  // Physical device can configure the host IP in app settings.
  static const String defaultApiUrl = 'http://10.0.2.2:3000';

  // Storage Keys
  static const String keyApiUrl = 'bizflow_api_url';
  static const String keyAuthToken = 'bizflow_auth_token';
  static const String keyUser = 'bizflow_user';
  static const String keyActiveBusiness = 'bizflow_active_business';
  static const String keyThemeMode = 'bizflow_theme_mode';

  // Payment Methods
  static const String paymentCash = 'CASH';
  static const String paymentTelebirr = 'TELEBIRR';
  static const String paymentCbeBirr = 'CBE_BIRR';
  static const String paymentBankTransfer = 'BANK_TRANSFER';
  static const String paymentCredit = 'CREDIT';

  // Shift Status
  static const String shiftOpen = 'OPEN';
  static const String shiftClosed = 'CLOSED';
}
