import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants.dart';
import '../../core/formatters.dart';
import '../../providers/customers_provider.dart';
import '../../providers/pos_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/touch_keypad.dart';

class CheckoutModal extends StatefulWidget {
  const CheckoutModal({super.key});

  @override
  State<CheckoutModal> createState() => _CheckoutModalState();
}

class _CheckoutModalState extends State<CheckoutModal> {
  final _refController = TextEditingController();

  @override
  void dispose() {
    _refController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pos = context.watch<PosProvider>();
    final customers = context.watch<CustomersProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
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
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
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
                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                      ),
                    ),
                    Text(
                      '${pos.totalItemCount} item${pos.totalItemCount > 1 ? 's' : ''} in cart',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
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
            const SizedBox(height: 16),

            // Amount Due Box
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkBg : AppColors.lightBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Total Payable',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                  Text(
                    Formatters.formatMoney(pos.subtotal),
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: AppColors.primary,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Payment Methods Tabs
            const Text(
              'Payment Method',
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
                    isSelected: pos.paymentMethod == AppConstants.paymentTelebirr,
                    activeColor: AppColors.telebirr,
                    onTap: () => pos.setPaymentMethod(AppConstants.paymentTelebirr),
                  ),
                  const SizedBox(width: 8),
                  _PaymentMethodTab(
                    label: 'CBE Birr',
                    icon: Icons.account_balance_rounded,
                    isSelected: pos.paymentMethod == AppConstants.paymentCbeBirr,
                    activeColor: AppColors.cbeBirr,
                    onTap: () => pos.setPaymentMethod(AppConstants.paymentCbeBirr),
                  ),
                  const SizedBox(width: 8),
                  _PaymentMethodTab(
                    label: 'Bank Transfer',
                    icon: Icons.receipt_long_rounded,
                    isSelected: pos.paymentMethod == AppConstants.paymentBankTransfer,
                    activeColor: AppColors.secondary,
                    onTap: () => pos.setPaymentMethod(AppConstants.paymentBankTransfer),
                  ),
                  const SizedBox(width: 8),
                  _PaymentMethodTab(
                    label: 'Store Credit',
                    icon: Icons.person_search_rounded,
                    isSelected: pos.paymentMethod == AppConstants.paymentCredit,
                    activeColor: AppColors.warning,
                    onTap: () => pos.setPaymentMethod(AppConstants.paymentCredit),
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
                        color: isDark ? AppColors.darkBg : AppColors.lightBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Cash Tendered',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
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
                            ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFD1FAE5))
                            : (isDark ? AppColors.darkBg : AppColors.lightBg),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: pos.cashChange > 0
                              ? AppColors.primary
                              : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
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
                              color: pos.cashChange > 0 ? AppColors.primary : null,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            Formatters.formatMoney(pos.cashChange),
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: pos.cashChange > 0 ? AppColors.primary : null,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Touch Keypad
              TouchKeypad(
                onDigitPress: pos.handleKeypadDigit,
                onBackspace: pos.handleKeypadBackspace,
                onClear: pos.handleKeypadClear,
                onExact: pos.handleKeypadExact,
                onQuickAdd: pos.handleKeypadAdd,
              ),
            ] else if (pos.paymentMethod == AppConstants.paymentCredit) ...[
              // Customer Selection for Credit
              const Text(
                'Select Customer for Credit Ledger',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                initialValue: pos.selectedCustomer?.id,
                hint: const Text('Choose a registered customer'),
                items: customers.customers.map((c) {
                  return DropdownMenuItem(
                    value: c.id,
                    child: Text('${c.name} (${c.phone ?? "No phone"})'),
                  );
                }).toList(),
                onChanged: (id) {
                  final customer = customers.customers.firstWhere((c) => c.id == id);
                  pos.setSelectedCustomer(customer);
                },
              ),
              if (pos.selectedCustomer != null) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFDE68A)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, size: 18, color: Color(0xFF92400E)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Current Credit Balance: ${Formatters.formatMoney(pos.selectedCustomer!.creditBalance)}',
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
              const Text(
                'Transaction Reference Code (Optional)',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _refController,
                onChanged: (val) => pos.setPaymentReference(val.trim()),
                decoration: const InputDecoration(
                  hintText: 'e.g. TLB8934291 or CBE12304958',
                  prefixIcon: Icon(Icons.confirmation_number_outlined, size: 20),
                ),
              ),
            ],

            const SizedBox(height: 20),

            // Confirm Sale Button
            ElevatedButton(
              onPressed: pos.isSubmitting
                  ? null
                  : () async {
                      final success = await pos.checkout();
                      if (!context.mounted) return;
                      if (success) {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Sale confirmed & receipt recorded!'),
                            backgroundColor: AppColors.primary,
                          ),
                        );
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
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Confirm Sale & Print Receipt'),
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
          ? selectedColor.withValues(alpha: 0.15)
          : (isDark ? AppColors.darkCard : AppColors.lightCard),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected
              ? selectedColor
              : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
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
                    : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                  color: isSelected
                      ? selectedColor
                      : (isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
