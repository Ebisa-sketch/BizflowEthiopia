import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants.dart';
import '../../core/formatters.dart';
import '../../providers/auth_provider.dart';
import '../../providers/customers_provider.dart';
import '../../providers/pos_provider.dart';
import '../../providers/products_provider.dart';
import '../../providers/sales_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/thermal_receipt_modal.dart';
import '../../widgets/touch_keypad.dart';

class CheckoutModal extends StatefulWidget {
  const CheckoutModal({super.key});

  @override
  State<CheckoutModal> createState() => _CheckoutModalState();
}

class _CheckoutModalState extends State<CheckoutModal> {
  final _refController = TextEditingController();
  final _discountController = TextEditingController();
  bool _discountInitialized = false;

  @override
  void dispose() {
    _refController.dispose();
    _discountController.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_discountInitialized) {
      _discountController.text = context
          .read<PosProvider>()
          .discount
          .toStringAsFixed(2);
      _discountInitialized = true;
    }
  }

  Future<bool> _authorizeDiscount(PosProvider pos) async {
    final role = context.read<AuthProvider>().user?.role.toUpperCase();
    if (role == 'OWNER' || role == 'MANAGER') return true;

    final emailController = TextEditingController();
    final passwordController = TextEditingController();
    final credentials = await showDialog<Map<String, String>>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Manager approval required'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('An owner or manager must approve this discount.'),
            const SizedBox(height: 12),
            TextField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Manager email'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: passwordController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Manager password'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(dialogContext, {
              'email': emailController.text,
              'password': passwordController.text,
            }),
            child: const Text('Approve'),
          ),
        ],
      ),
    );
    emailController.dispose();
    passwordController.dispose();
    if (credentials == null) return false;

    final approved = await pos.authorizeDiscount(
      email: credentials['email'] ?? '',
      password: credentials['password'] ?? '',
    );
    if (!approved && mounted && pos.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(pos.errorMessage!),
          backgroundColor: AppColors.danger,
        ),
      );
    }
    return approved;
  }

  String _getReferenceHint(String method) {
    switch (method) {
      case AppConstants.paymentTelebirr:
        return 'e.g. TLB10CHARACTERS (Telebirr App Confirmation)';
      case AppConstants.paymentCbeBirr:
        return 'e.g. FT2409819283 (CBE Birr / CBE Mobile Banking)';
      case AppConstants.paymentBankTransfer:
        return 'e.g. AWASH / DASHEN / BOA Reference Code';
      default:
        return 'Digital transaction reference code';
    }
  }

  @override
  Widget build(BuildContext context) {
    final pos = context.watch<PosProvider>();
    final customers = context.watch<CustomersProvider>();
    final auth = context.watch<AuthProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.brandNavyCard : AppColors.lightSurface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        top: 16,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Modal Handle Bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark
                      ? AppColors.brandNavyBorder
                      : AppColors.lightBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Complete Checkout',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: isDark
                            ? AppColors.darkTextPrimary
                            : AppColors.lightTextPrimary,
                      ),
                    ),
                    Text(
                      '${pos.totalItemCount} item${pos.totalItemCount > 1 ? 's' : ''} in cart',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary,
                      ),
                    ),
                    Text(
                      pos.selectedCustomer?.name ?? 'Walk-in Customer',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Pricing & VAT Summary Box (Matching Web POS)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF071924) : AppColors.lightBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark
                      ? AppColors.brandNavyBorder
                      : AppColors.lightBorder,
                ),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Subtotal',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark
                              ? AppColors.darkTextSecondary
                              : AppColors.lightTextSecondary,
                        ),
                      ),
                      Text(
                        Formatters.formatMoney(pos.subtotal),
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _discountController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Discount (ETB)',
                      prefixText: 'ETB ',
                      isDense: true,
                    ),
                    onChanged: (value) {
                      final discount = double.tryParse(value.trim()) ?? 0;
                      pos.setDiscount(discount);
                    },
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Apply 15% VAT Tax',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                            ),
                          ),
                          const SizedBox(width: 6),
                          SizedBox(
                            height: 24,
                            width: 38,
                            child: Switch(
                              value: pos.applyVat,
                              activeThumbColor: AppColors.primary,
                              onChanged: (val) => pos.toggleVat(val),
                            ),
                          ),
                        ],
                      ),
                      Text(
                        pos.applyVat
                            ? '+${Formatters.formatMoney(pos.vatAmount)}'
                            : 'ETB 0.00',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: pos.applyVat ? AppColors.primary : Colors.grey,
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total Payable',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        Formatters.formatMoney(pos.grandTotal),
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: AppColors.primary,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Payment Methods Tabs
            const Text(
              'Select Payment Channel',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _PaymentMethodTab(
                    label: 'Cash',
                    icon: Icons.payments_rounded,
                    isSelected: pos.paymentMethod == AppConstants.paymentCash,
                    onTap: () => pos.setPaymentMethod(AppConstants.paymentCash),
                  ),
                  const SizedBox(width: 8),
                  _PaymentMethodTab(
                    label: 'Telebirr',
                    icon: Icons.phone_android_rounded,
                    isSelected:
                        pos.paymentMethod == AppConstants.paymentTelebirr,
                    activeColor: AppColors.telebirr,
                    onTap: () =>
                        pos.setPaymentMethod(AppConstants.paymentTelebirr),
                  ),
                  const SizedBox(width: 8),
                  _PaymentMethodTab(
                    label: 'CBE Birr',
                    icon: Icons.account_balance_rounded,
                    isSelected:
                        pos.paymentMethod == AppConstants.paymentCbeBirr,
                    activeColor: AppColors.cbeBirr,
                    onTap: () =>
                        pos.setPaymentMethod(AppConstants.paymentCbeBirr),
                  ),
                  const SizedBox(width: 8),
                  _PaymentMethodTab(
                    label: 'Bank Transfer',
                    icon: Icons.receipt_long_rounded,
                    isSelected:
                        pos.paymentMethod == AppConstants.paymentBankTransfer,
                    activeColor: AppColors.secondary,
                    onTap: () =>
                        pos.setPaymentMethod(AppConstants.paymentBankTransfer),
                  ),
                  const SizedBox(width: 8),
                  _PaymentMethodTab(
                    label: 'Store Credit (Idda)',
                    icon: Icons.person_search_rounded,
                    isSelected: pos.paymentMethod == AppConstants.paymentCredit,
                    activeColor: AppColors.warning,
                    onTap: () =>
                        pos.setPaymentMethod(AppConstants.paymentCredit),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Section according to payment method
            if (pos.paymentMethod == AppConstants.paymentCash) ...[
              // Cash Tendered & Change Row
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF071924)
                            : AppColors.lightBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isDark
                              ? AppColors.brandNavyBorder
                              : AppColors.lightBorder,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Cash Tendered',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            pos.cashTenderedStr.isEmpty
                                ? 'ETB 0.00'
                                : 'ETB ${pos.cashTenderedStr}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: pos.cashChange > 0
                            ? (isDark
                                  ? const Color(0xFF073228)
                                  : const Color(0xFFD1FAE5))
                            : (isDark
                                  ? const Color(0xFF071924)
                                  : AppColors.lightBg),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: pos.cashChange > 0
                              ? AppColors.primary
                              : (isDark
                                    ? AppColors.brandNavyBorder
                                    : AppColors.lightBorder),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Change Due',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: pos.cashChange > 0
                                  ? AppColors.primary
                                  : null,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            Formatters.formatMoney(pos.cashChange),
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: pos.cashChange > 0
                                  ? AppColors.primary
                                  : null,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Touch Keypad
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Touch Numeric Tender Keypad',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  IconButton(
                    icon: Icon(
                      pos.showKeypad
                          ? Icons.keyboard_hide_rounded
                          : Icons.keyboard_rounded,
                      size: 20,
                    ),
                    onPressed: pos.toggleKeypad,
                  ),
                ],
              ),
              if (pos.showKeypad) ...[
                const SizedBox(height: 6),
                TouchKeypad(
                  onDigitPress: pos.handleKeypadDigit,
                  onBackspace: pos.handleKeypadBackspace,
                  onClear: pos.handleKeypadClear,
                  onExact: pos.handleKeypadExact,
                  onQuickAdd: pos.handleKeypadAdd,
                ),
              ],
            ] else if (pos.paymentMethod == AppConstants.paymentCredit) ...[
              // Store Credit Customer Selection
              const Text(
                'Assign Debt to Customer *',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Select Customer Account',
                  prefixIcon: Icon(Icons.person_outline_rounded, size: 20),
                ),
                initialValue: pos.selectedCustomer?.id,
                items: customers.customers.map((c) {
                  return DropdownMenuItem(
                    value: c.id,
                    child: Text('${c.name} (${c.phone ?? "No phone"})'),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) {
                    final c = customers.customers.firstWhere(
                      (x) => x.id == val,
                    );
                    pos.setSelectedCustomer(c);
                  }
                },
              ),
              if (pos.selectedCustomer != null) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFF59E0B)),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.warning_amber_rounded,
                        color: Color(0xFFD97706),
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Current Outstanding Debt: ${Formatters.formatMoney(pos.selectedCustomer!.creditBalance)}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF92400E),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ] else ...[
              // Reference Number Input for Digital Payments
              Text(
                'Transaction Reference Number (Required for Audit)',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isDark
                      ? AppColors.darkTextPrimary
                      : AppColors.lightTextPrimary,
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _refController,
                onChanged: (val) => pos.setPaymentReference(val.trim()),
                decoration: InputDecoration(
                  hintText: _getReferenceHint(pos.paymentMethod),
                  prefixIcon: const Icon(
                    Icons.confirmation_number_outlined,
                    size: 20,
                  ),
                ),
              ),
            ],

            const SizedBox(height: 20),

            // Confirm Sale Button
            ElevatedButton(
              onPressed: pos.isSubmitting
                  ? null
                  : () async {
                      if (pos.discount > 0) {
                        if (pos.discount > pos.subtotal) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Discount cannot exceed the cart subtotal',
                              ),
                              backgroundColor: AppColors.danger,
                            ),
                          );
                          return;
                        }
                        final approved = await _authorizeDiscount(pos);
                        if (!approved || !context.mounted) return;
                      }
                      final success = await pos.checkout();
                      if (!context.mounted) return;
                      if (success) {
                        await Future.wait([
                          context
                              .read<ProductsProvider>()
                              .fetchProductsAndCategories(),
                          context.read<CustomersProvider>().fetchCustomers(),
                          context.read<SalesProvider>().fetchSales(),
                        ]);
                        if (!context.mounted) return;
                        Navigator.pop(context); // Close bottom sheet
                        final last = pos.lastReceipt;
                        if (last != null) {
                          // Show 80mm thermal receipt modal immediately
                          showDialog(
                            context: context,
                            builder: (_) => ThermalReceiptModal(
                              receipt: last,
                              businessName:
                                  auth.user?.business?.name ?? 'BizFlow Store',
                              cashierName: auth.user?.name,
                            ),
                          );
                        }
                      } else if (pos.errorMessage != null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(pos.errorMessage!),
                            backgroundColor: AppColors.danger,
                          ),
                        );
                      }
                    },
              child: pos.isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Color(0xFF071924),
                      ),
                    )
                  : const Text('Complete Sale & Print Receipt'),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentMethodTab extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;
  final Color? activeColor;

  const _PaymentMethodTab({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
    this.activeColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final selectedColor = activeColor ?? AppColors.primary;

    return Material(
      color: isSelected
          ? selectedColor.withValues(alpha: 0.18)
          : (isDark ? AppColors.brandNavyCard : AppColors.lightCard),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected
              ? selectedColor
              : (isDark ? AppColors.brandNavyBorder : AppColors.lightBorder),
          width: isSelected ? 1.5 : 1,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 16,
                color: isSelected
                    ? selectedColor
                    : (isDark
                          ? AppColors.darkTextSecondary
                          : AppColors.lightTextSecondary),
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected
                      ? selectedColor
                      : (isDark
                            ? AppColors.darkTextPrimary
                            : AppColors.lightTextPrimary),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
