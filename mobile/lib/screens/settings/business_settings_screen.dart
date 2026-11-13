import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_colors.dart';

class BusinessSettingsScreen extends StatefulWidget {
  const BusinessSettingsScreen({super.key});

  @override
  State<BusinessSettingsScreen> createState() => _BusinessSettingsScreenState();
}

class _BusinessSettingsScreenState extends State<BusinessSettingsScreen> {
  final _api = ApiClient();
  final Map<String, TextEditingController> _fields = {
    'businessName': TextEditingController(),
    'tradeName': TextEditingController(),
    'tin': TextEditingController(),
    'contactEmail': TextEditingController(),
    'phone': TextEditingController(),
    'address': TextEditingController(),
    'city': TextEditingController(),
    'subcity': TextEditingController(),
    'currency': TextEditingController(text: 'ETB'),
    'lowStockThresholdDefault': TextEditingController(text: '5'),
    'receiptFooterMessage': TextEditingController(),
  };
  bool _isLoading = true;
  bool _isSaving = false;
  bool _canManage = false;
  bool _vatRegistered = false;
  bool _autoReceiptPrint = true;
  bool _lowStockAlertEnabled = true;
  bool _requireReasonForAdjustment = true;
  bool _allowNegativeStock = false;
  bool _showCostPriceToStaff = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  @override
  void dispose() {
    for (final controller in _fields.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _loadSettings() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final response = await _api.get('/api/businesses/current');
      if (response is! Map || response['settings'] is! Map) {
        throw AppException('The server returned invalid business settings.');
      }
      final settings = Map<String, dynamic>.from(response['settings'] as Map);
      for (final entry in _fields.entries) {
        entry.value.text = settings[entry.key]?.toString() ?? '';
      }
      _canManage = settings['canManageBusiness'] == true;
      _vatRegistered = settings['vatRegistered'] == true;
      _autoReceiptPrint = settings['autoReceiptPrint'] != false;
      _lowStockAlertEnabled = settings['lowStockAlertEnabled'] != false;
      _requireReasonForAdjustment =
          settings['requireReasonForAdjustment'] != false;
      _allowNegativeStock = settings['allowNegativeStock'] == true;
      _showCostPriceToStaff = settings['showCostPriceToStaff'] == true;
    } catch (error) {
      _errorMessage = error.toString();
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _saveSettings() async {
    final threshold = double.tryParse(
      _fields['lowStockThresholdDefault']!.text.trim(),
    );
    if (threshold == null || threshold < 0) {
      _showMessage(
        'Enter a valid non-negative low-stock threshold.',
        isError: true,
      );
      return;
    }

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });
    try {
      final response = await _api.patch(
        '/api/businesses/current',
        body: {
          for (final entry in _fields.entries)
            entry.key: entry.key == 'lowStockThresholdDefault'
                ? threshold
                : entry.value.text.trim(),
          'vatRegistered': _vatRegistered,
          'autoReceiptPrint': _autoReceiptPrint,
          'lowStockAlertEnabled': _lowStockAlertEnabled,
          'requireReasonForAdjustment': _requireReasonForAdjustment,
          'allowNegativeStock': _allowNegativeStock,
          'showCostPriceToStaff': _showCostPriceToStaff,
        },
      );
      if (response is! Map || response['success'] != true) {
        throw AppException('The server did not confirm the settings update.');
      }
      await _loadSettings();
      if (mounted) _showMessage('Business settings saved.');
    } catch (error) {
      if (mounted) _showMessage(error.toString(), isError: true);
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.danger : AppColors.primary,
      ),
    );
  }

  Widget _textField(String key, String label, {TextInputType? keyboardType}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: _fields[key],
        keyboardType: keyboardType,
        readOnly: !_canManage,
        decoration: InputDecoration(labelText: label),
      ),
    );
  }

  Widget _settingSwitch(
    String title,
    String subtitle,
    bool value,
    ValueChanged<bool> onChanged,
  ) {
    return SwitchListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(title),
      subtitle: Text(subtitle),
      value: value,
      onChanged: _canManage ? onChanged : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    final role = context.watch<AuthProvider>().user?.role ?? '';
    return Scaffold(
      appBar: AppBar(title: const Text('Business Settings')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_errorMessage!, textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: _loadSettings,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (!_canManage)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Text(
                        'You are signed in as $role. Only an owner or manager with business-management permission can change these settings.',
                      ),
                    ),
                  ),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'Store Profile',
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 14),
                        _textField('businessName', 'Business name'),
                        _textField('tradeName', 'Trade name'),
                        _textField('tin', 'TIN / tax number'),
                        _textField(
                          'contactEmail',
                          'Contact email',
                          keyboardType: TextInputType.emailAddress,
                        ),
                        _textField(
                          'phone',
                          'Phone',
                          keyboardType: TextInputType.phone,
                        ),
                        _textField('address', 'Address'),
                        _textField('city', 'City'),
                        _textField('subcity', 'Subcity'),
                        _textField('currency', 'Currency (ETB, USD, EUR)'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'POS & Inventory',
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 8),
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('VAT registered'),
                          value: _vatRegistered,
                          onChanged: _canManage
                              ? (value) =>
                                    setState(() => _vatRegistered = value)
                              : null,
                        ),
                        _settingSwitch(
                          'Print receipts automatically',
                          'Use automatic receipt printing at checkout.',
                          _autoReceiptPrint,
                          (value) => setState(() => _autoReceiptPrint = value),
                        ),
                        _settingSwitch(
                          'Low-stock alerts',
                          'Show warnings when products approach reorder levels.',
                          _lowStockAlertEnabled,
                          (value) =>
                              setState(() => _lowStockAlertEnabled = value),
                        ),
                        _textField(
                          'lowStockThresholdDefault',
                          'Default low-stock threshold',
                          keyboardType: TextInputType.number,
                        ),
                        _textField(
                          'receiptFooterMessage',
                          'Receipt footer message',
                        ),
                        _settingSwitch(
                          'Require reason for stock adjustments',
                          'Keep inventory adjustments auditable.',
                          _requireReasonForAdjustment,
                          (value) => setState(
                            () => _requireReasonForAdjustment = value,
                          ),
                        ),
                        _settingSwitch(
                          'Allow negative stock',
                          'Permit sales when recorded stock is depleted.',
                          _allowNegativeStock,
                          (value) =>
                              setState(() => _allowNegativeStock = value),
                        ),
                        _settingSwitch(
                          'Show cost price to staff',
                          'Expose wholesale cost in staff views.',
                          _showCostPriceToStaff,
                          (value) =>
                              setState(() => _showCostPriceToStaff = value),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: _canManage && !_isSaving ? _saveSettings : null,
                  child: _isSaving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Save Business Settings'),
                ),
              ],
            ),
    );
  }
}
