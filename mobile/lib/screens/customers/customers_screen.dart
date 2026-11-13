import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants.dart';
import '../../core/formatters.dart';
import '../../models/customer.dart';
import '../../providers/customers_provider.dart';
import '../../theme/app_colors.dart';

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CustomersProvider>().fetchCustomers();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showAddCustomerDialog() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final tinCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    final limitCtrl = TextEditingController(text: '5000');
    final initialDebtCtrl = TextEditingController(text: '0');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Customer Account'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Customer / Shop Name *',
                  hintText: 'e.g. Ato Getachew',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: phoneCtrl,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  hintText: '+251 9...',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: tinCtrl,
                decoration: const InputDecoration(
                  labelText: 'TIN Number (optional)',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: notesCtrl,
                decoration: const InputDecoration(
                  labelText: 'Notes (optional)',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: initialDebtCtrl,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                decoration: const InputDecoration(
                  labelText: 'Opening Balance (ETB)',
                  prefixText: 'ETB ',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: limitCtrl,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                decoration: const InputDecoration(
                  labelText: 'Credit Limit (ETB)',
                  prefixText: 'ETB ',
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final name = nameCtrl.text.trim();
              if (name.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Customer name is required')),
                );
                return;
              }
              final limit = double.tryParse(limitCtrl.text.trim()) ?? 5000.0;
              final initialDebt =
                  double.tryParse(initialDebtCtrl.text.trim()) ?? 0;
              if (initialDebt < 0 || limit < 0) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Credit limit and opening balance cannot be negative',
                    ),
                  ),
                );
                return;
              }
              Navigator.pop(ctx);
              final success = await context
                  .read<CustomersProvider>()
                  .createCustomer(
                    name: name,
                    phone: phoneCtrl.text.trim(),
                    tinNumber: tinCtrl.text.trim(),
                    notes: notesCtrl.text.trim(),
                    creditLimit: limit,
                    initialDebt: initialDebt,
                  );
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      success
                          ? 'Customer "$name" registered!'
                          : 'Failed to register customer',
                    ),
                    backgroundColor: success
                        ? AppColors.primary
                        : AppColors.danger,
                  ),
                );
              }
            },
            child: const Text('Save Customer'),
          ),
        ],
      ),
    );
  }

  void _openRepaymentModal(Customer customer) {
    final amountController = TextEditingController(
      text: customer.creditBalance.toStringAsFixed(2),
    );
    String paymentMethod = AppConstants.paymentCash;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              title: Row(
                children: [
                  const Icon(Icons.payments_rounded, color: AppColors.primary),
                  const SizedBox(width: 8),
                  const Text(
                    'Record Repayment',
                    style: TextStyle(fontSize: 16),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    customer.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Outstanding Credit: ${Formatters.formatMoney(customer.creditBalance)}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontFamily: 'monospace',
                      color: AppColors.danger,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Repayment Amount (ETB)',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: amountController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.money_rounded),
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Repayment Method',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    initialValue: paymentMethod,
                    items: const [
                      DropdownMenuItem(
                        value: AppConstants.paymentCash,
                        child: Text('Cash'),
                      ),
                      DropdownMenuItem(
                        value: AppConstants.paymentTelebirr,
                        child: Text('Telebirr'),
                      ),
                      DropdownMenuItem(
                        value: AppConstants.paymentCbeBirr,
                        child: Text('CBE Birr'),
                      ),
                      DropdownMenuItem(
                        value: AppConstants.paymentBankTransfer,
                        child: Text('Bank Transfer'),
                      ),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setDialogState(() => paymentMethod = val);
                      }
                    },
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    final amt = double.tryParse(amountController.text) ?? 0.0;
                    if (amt <= 0) return;
                    final customersProv = context.read<CustomersProvider>();
                    final messenger = ScaffoldMessenger.of(context);
                    Navigator.pop(ctx);
                    final success = await customersProv.recordRepayment(
                      customerId: customer.id,
                      amount: amt,
                      paymentMethod: paymentMethod,
                    );
                    if (!mounted) return;
                    if (success) {
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text(
                            'Recorded ${Formatters.formatMoney(amt)} credit repayment for ${customer.name}',
                          ),
                          backgroundColor: AppColors.primary,
                        ),
                      );
                    }
                  },
                  child: const Text('Confirm Repayment'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final customersProv = context.watch<CustomersProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final filtered = customersProv.customers.where((c) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      return c.name.toLowerCase().contains(q) ||
          (c.phone?.contains(q) ?? false);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Customer Credit Ledger (Idda)'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_rounded),
            tooltip: 'Add Customer',
            onPressed: _showAddCustomerDialog,
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: customersProv.fetchCustomers,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddCustomerDialog,
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.person_add_rounded, color: Color(0xFF071924)),
        label: const Text(
          'New Customer',
          style: TextStyle(
            color: Color(0xFF071924),
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      body: Column(
        children: [
          // Total Outstanding Credit Header
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF451A03) : const Color(0xFFFEF3C7),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark
                    ? const Color(0xFF78350F)
                    : const Color(0xFFFDE68A),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Total Outstanding Credit',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isDark
                            ? const Color(0xFFFDE68A)
                            : const Color(0xFF92400E),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      Formatters.formatMoney(
                        customersProv.totalOutstandingCredit,
                      ),
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'monospace',
                        color: isDark
                            ? const Color(0xFFFDE68A)
                            : const Color(0xFF92400E),
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF78350F)
                        : const Color(0xFFFDE68A),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.account_balance_wallet_rounded,
                    color: Color(0xFF92400E),
                    size: 24,
                  ),
                ),
              ],
            ),
          ),

          // Search Box
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val.trim()),
              decoration: const InputDecoration(
                hintText: 'Search customer by name or phone...',
                prefixIcon: Icon(Icons.search_rounded, size: 20),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Customer List
          Expanded(
            child: customersProv.isLoading
                ? const Center(child: CircularProgressIndicator())
                : filtered.isEmpty
                ? Center(
                    child: Text(
                      'No customers found',
                      style: TextStyle(
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary,
                      ),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final c = filtered[index];
                      final hasCredit = c.creditBalance > 0;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: hasCredit
                                    ? const Color(0xFFFEE2E2)
                                    : (isDark
                                          ? AppColors.darkSurface
                                          : AppColors.lightSurface),
                                child: Icon(
                                  Icons.person_rounded,
                                  color: hasCredit
                                      ? AppColors.danger
                                      : AppColors.primary,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      c.name,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    Text(
                                      c.phone ?? 'No phone recorded',
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
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    Formatters.formatMoney(c.creditBalance),
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      fontFamily: 'monospace',
                                      color: hasCredit
                                          ? AppColors.danger
                                          : AppColors.success,
                                    ),
                                  ),
                                  if (hasCredit) ...[
                                    const SizedBox(height: 4),
                                    InkWell(
                                      onTap: () => _openRepaymentModal(c),
                                      child: const Text(
                                        'Repay',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
