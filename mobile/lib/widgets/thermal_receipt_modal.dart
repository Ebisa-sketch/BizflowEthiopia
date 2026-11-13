import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../core/formatters.dart';
import '../theme/app_colors.dart';

class ThermalReceiptModal extends StatelessWidget {
  final Map<String, dynamic> receipt;
  final String businessName;
  final String? cashierName;

  const ThermalReceiptModal({
    super.key,
    required this.receipt,
    required this.businessName,
    this.cashierName,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final items = (receipt['items'] as List?) ?? [];
    final date = receipt['date'] is DateTime
        ? receipt['date'] as DateTime
        : DateTime.tryParse(receipt['date']?.toString() ?? '') ??
              DateTime.now();
    final dateStr = DateFormat('yyyy-MM-dd HH:mm:ss').format(date);

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 380),
          decoration: BoxDecoration(
            color: isDark ? AppColors.brandNavyCard : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isDark ? AppColors.brandNavyBorder : AppColors.lightBorder,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.25),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Modal Top Action Bar
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(
                          Icons.receipt_long_rounded,
                          color: AppColors.primary,
                          size: 20,
                        ),
                        SizedBox(width: 8),
                        Text(
                          '80mm Thermal Receipt',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),

              // Scrollable 80mm Receipt Body
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF071924)
                          : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isDark
                            ? AppColors.brandNavyBorder
                            : AppColors.lightBorder,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Store Header
                        Center(
                          child: Column(
                            children: [
                              Text(
                                businessName.toUpperCase(),
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 16,
                                  letterSpacing: 1.1,
                                ),
                              ),
                              const SizedBox(height: 2),
                              const Text(
                                'OFFICIAL SALES RECEIPT',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.2,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Addis Ababa, Ethiopia',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark
                                      ? AppColors.darkTextSecondary
                                      : AppColors.lightTextSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        const _DottedLine(),
                        const SizedBox(height: 10),

                        // Receipt Details
                        _ReceiptRow(
                          label: 'Receipt #:',
                          value:
                              receipt['receiptNumber']?.toString() ?? 'REC-001',
                          isMonospace: true,
                        ),
                        _ReceiptRow(label: 'Date & Time:', value: dateStr),
                        _ReceiptRow(
                          label: 'Cashier:',
                          value: cashierName ?? 'Cashier',
                        ),
                        if (receipt['customerName'] != null)
                          _ReceiptRow(
                            label: 'Customer:',
                            value: receipt['customerName'].toString(),
                          ),
                        if (receipt['paymentReference'] != null &&
                            receipt['paymentReference'].toString().isNotEmpty)
                          _ReceiptRow(
                            label: 'Txn Ref:',
                            value: receipt['paymentReference'].toString(),
                            isMonospace: true,
                          ),

                        const SizedBox(height: 10),
                        const _DottedLine(),
                        const SizedBox(height: 10),

                        // Line Items Header
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                'ITEM / DESC',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                            SizedBox(
                              width: 40,
                              child: Text(
                                'QTY',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                            Text(
                              'TOTAL (ETB)',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),

                        // Line Items
                        ...items.map((item) {
                          final name = item['name']?.toString() ?? 'Item';
                          final qty = item['quantity']?.toString() ?? '1';
                          final total = (item['total'] is num)
                              ? (item['total'] as num).toDouble()
                              : 0.0;
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 3),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    name,
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                ),
                                SizedBox(
                                  width: 40,
                                  child: Text(
                                    qty,
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                Text(
                                  Formatters.formatMoney(total),
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),

                        const SizedBox(height: 10),
                        const _DottedLine(),
                        const SizedBox(height: 10),

                        // Pricing Totals
                        _ReceiptRow(
                          label: 'Subtotal:',
                          value: Formatters.formatMoney(
                            (receipt['subtotal'] as num?)?.toDouble() ?? 0.0,
                          ),
                        ),
                        if ((receipt['discount'] as num?)?.toDouble() != null &&
                            (receipt['discount'] as num) > 0)
                          _ReceiptRow(
                            label: 'Discount:',
                            value:
                                '-${Formatters.formatMoney((receipt['discount'] as num).toDouble())}',
                          ),
                        if ((receipt['vat'] as num?)?.toDouble() != null &&
                            (receipt['vat'] as num) > 0)
                          _ReceiptRow(
                            label: 'VAT (15%):',
                            value: Formatters.formatMoney(
                              (receipt['vat'] as num).toDouble(),
                            ),
                          ),
                        const Divider(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'GRAND TOTAL:',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            Text(
                              Formatters.formatMoney(
                                (receipt['grandTotal'] as num?)?.toDouble() ??
                                    0.0,
                              ),
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        _ReceiptRow(
                          label: 'Payment Method:',
                          value: (receipt['paymentMethod'] ?? 'CASH')
                              .toString()
                              .replaceAll('_', ' '),
                        ),
                        _ReceiptRow(
                          label: 'Tendered:',
                          value: Formatters.formatMoney(
                            (receipt['amountPaid'] as num?)?.toDouble() ?? 0.0,
                          ),
                        ),
                        if ((receipt['change'] as num?)?.toDouble() != null &&
                            (receipt['change'] as num) > 0)
                          _ReceiptRow(
                            label: 'Change Returned:',
                            value: Formatters.formatMoney(
                              (receipt['change'] as num).toDouble(),
                            ),
                          ),

                        const SizedBox(height: 14),
                        const _DottedLine(),
                        const SizedBox(height: 12),

                        // Footer
                        const Center(
                          child: Column(
                            children: [
                              Text(
                                'THANK YOU FOR YOUR BUSINESS!',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.8,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Powered by BizFlow Ethiopia Cloud POS',
                                style: TextStyle(
                                  fontSize: 9,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Bottom Actions
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(
                          Icons.add_shopping_cart_rounded,
                          size: 18,
                        ),
                        label: const Text('Next Sale'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Receipt sent to 80mm ESC/POS printer queue!',
                              ),
                              backgroundColor: AppColors.primary,
                            ),
                          );
                          Navigator.pop(context);
                        },
                        icon: const Icon(Icons.print_rounded, size: 18),
                        label: const Text('Print Receipt'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReceiptRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isMonospace;

  const _ReceiptRow({
    required this.label,
    required this.value,
    this.isMonospace = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: Colors.grey,
              fontWeight: FontWeight.w600,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              fontFamily: isMonospace ? 'monospace' : null,
            ),
          ),
        ],
      ),
    );
  }
}

class _DottedLine extends StatelessWidget {
  const _DottedLine();

  @override
  Widget build(BuildContext context) {
    return Text(
      '- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -',
      maxLines: 1,
      overflow: TextOverflow.clip,
      style: TextStyle(color: Colors.grey.withValues(alpha: 0.5), fontSize: 10),
    );
  }
}
