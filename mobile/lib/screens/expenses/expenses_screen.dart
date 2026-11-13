import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../core/formatters.dart';
import '../../models/expense.dart';
import '../../providers/expenses_provider.dart';
import '../../theme/app_colors.dart';

class ExpensesScreen extends StatefulWidget {
  const ExpensesScreen({super.key});

  @override
  State<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends State<ExpensesScreen> {
  final List<String> _categories = [
    'ALL',
    'RENT',
    'SALARY',
    'UTILITIES',
    'SUPPLIES',
    'TRANSPORT',
    'MARKETING',
    'OTHER',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ExpensesProvider>().fetchExpenses();
    });
  }

  void _showAddExpenseDialog() {
    String selectedCategory = 'UTILITIES';
    final amountCtrl = TextEditingController();
    final noteCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Record Store Expense'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Expense Category *',
                  ),
                  initialValue: selectedCategory,
                  items: const [
                    DropdownMenuItem(value: 'RENT', child: Text('Rent')),
                    DropdownMenuItem(
                      value: 'SALARY',
                      child: Text('Staff Salary / Wage'),
                    ),
                    DropdownMenuItem(
                      value: 'UTILITIES',
                      child: Text('Utilities (Electricity / Water / WiFi)'),
                    ),
                    DropdownMenuItem(
                      value: 'SUPPLIES',
                      child: Text('Supplies & Packaging'),
                    ),
                    DropdownMenuItem(
                      value: 'TRANSPORT',
                      child: Text('Transport / Logistics'),
                    ),
                    DropdownMenuItem(
                      value: 'MARKETING',
                      child: Text('Marketing / Signage'),
                    ),
                    DropdownMenuItem(
                      value: 'OTHER',
                      child: Text('Other Overhead'),
                    ),
                  ],
                  onChanged: (val) {
                    if (val != null) {
                      setDialogState(() => selectedCategory = val);
                    }
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: amountCtrl,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: const InputDecoration(
                    labelText: 'Amount (ETB) *',
                    hintText: 'e.g. 1500.00',
                    prefixText: 'ETB ',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: noteCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Expense Note / Reason',
                    hintText: 'e.g. Monthly electricity bill #49102',
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
                final amount = double.tryParse(amountCtrl.text.trim()) ?? 0.0;
                if (amount <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Please enter a valid expense amount'),
                    ),
                  );
                  return;
                }
                Navigator.pop(ctx);
                final success = await context
                    .read<ExpensesProvider>()
                    .recordExpense(
                      category: selectedCategory,
                      amount: amount,
                      note: noteCtrl.text.trim(),
                    );
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        success
                            ? 'Expense recorded successfully!'
                            : 'Failed to record expense',
                      ),
                      backgroundColor: success
                          ? AppColors.primary
                          : AppColors.danger,
                    ),
                  );
                }
              },
              child: const Text('Record'),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDeleteExpense(Expense exp) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Expense Record'),
        content: Text(
          'Are you sure you want to delete this expense of ${Formatters.formatMoney(exp.amount)}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await context
                  .read<ExpensesProvider>()
                  .deleteExpense(exp.id);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      success ? 'Expense removed!' : 'Failed to delete expense',
                    ),
                    backgroundColor: success
                        ? AppColors.primary
                        : AppColors.danger,
                  ),
                );
              }
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  Color _getCategoryColor(String cat) {
    switch (cat.toUpperCase()) {
      case 'RENT':
        return const Color(0xFFEF4444);
      case 'SALARY':
        return const Color(0xFF3B82F6);
      case 'UTILITIES':
        return const Color(0xFFF59E0B);
      case 'SUPPLIES':
        return const Color(0xFF10B981);
      case 'TRANSPORT':
        return const Color(0xFF8B5CF6);
      case 'MARKETING':
        return const Color(0xFFEC4899);
      case 'OTHER':
      default:
        return const Color(0xFF64748B);
    }
  }

  @override
  Widget build(BuildContext context) {
    final expProvider = context.watch<ExpensesProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final filtered = expProvider.filteredExpenses;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Operating Expenses'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => expProvider.fetchExpenses(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddExpenseDialog,
        backgroundColor: const Color(0xFFEF4444),
        icon: const Icon(Icons.add_card_rounded, color: Colors.white),
        label: const Text(
          'Add Expense',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      body: Column(
        children: [
          // Total Expense Header Card
          Padding(
            padding: const EdgeInsets.all(16),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFDC2626), Color(0xFF991B1B)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: Colors.red.withValues(alpha: 0.25),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Total Operating Expenses',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        Formatters.formatMoney(expProvider.totalExpenses),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.credit_card_off_rounded,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Category Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: _categories.map((cat) {
                final isSelected = expProvider.selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(
                      cat,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected
                            ? FontWeight.w700
                            : FontWeight.w500,
                        color: isSelected ? Colors.white : null,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: _getCategoryColor(cat),
                    checkmarkColor: Colors.white,
                    onSelected: (_) => expProvider.setCategoryFilter(cat),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 8),

          // List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => expProvider.fetchExpenses(),
              child: expProvider.isLoading && expProvider.expenses.isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : filtered.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.receipt_long_rounded,
                            size: 56,
                            color: isDark
                                ? AppColors.darkTextMuted
                                : AppColors.lightTextMuted,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'No expense records found',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Record rent, utilities, and daily costs',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark
                                  ? AppColors.darkTextMuted
                                  : AppColors.lightTextMuted,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: filtered.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final exp = filtered[index];
                        final catColor = _getCategoryColor(exp.category);
                        final dateStr = DateFormat('MMM dd, yyyy')
                            .format(exp.date);

                        return Card(
                          child: ListTile(
                            leading: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: catColor.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                Icons.outbox_rounded,
                                color: catColor,
                                size: 20,
                              ),
                            ),
                            title: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  exp.category,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14,
                                    color: catColor,
                                  ),
                                ),
                                Text(
                                  Formatters.formatMoney(exp.amount),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 15,
                                    color: Color(0xFFEF4444),
                                  ),
                                ),
                              ],
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (exp.note != null &&
                                    exp.note!.isNotEmpty) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    exp.note!,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isDark
                                          ? AppColors.darkTextPrimary
                                          : AppColors.lightTextPrimary,
                                    ),
                                  ),
                                ],
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Text(
                                      dateStr,
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: isDark
                                            ? AppColors.darkTextSecondary
                                            : AppColors.lightTextSecondary,
                                      ),
                                    ),
                                    if (exp.recordedByName != null) ...[
                                      const SizedBox(width: 8),
                                      Text(
                                        '•',
                                        style: TextStyle(
                                          color: isDark
                                              ? AppColors.darkTextMuted
                                              : AppColors.lightTextMuted,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        exp.recordedByName!,
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: isDark
                                              ? AppColors.darkTextMuted
                                              : AppColors.lightTextMuted,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                            trailing: IconButton(
                              icon: const Icon(
                                Icons.delete_outline_rounded,
                                size: 20,
                                color: AppColors.danger,
                              ),
                              onPressed: () => _confirmDeleteExpense(exp),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
