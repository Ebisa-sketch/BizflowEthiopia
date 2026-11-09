import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/formatters.dart';
import '../../models/sale_record.dart';
import '../../providers/sales_provider.dart';
import '../../theme/app_colors.dart';

class SalesHistoryScreen extends StatefulWidget {
  const SalesHistoryScreen({super.key});

  @override
  State<SalesHistoryScreen> createState() => _SalesHistoryScreenState();
}

class _SalesHistoryScreenState extends State<SalesHistoryScreen> {
  final _searchController = TextEditingController();
  bool _isSearching = false;

  final List<String> _paymentFilters = [
    'ALL',
    'CASH',
    'TELEBIRR',
    'CBE_BIRR',
    'BANK_TRANSFER',
    'CREDIT',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SalesProvider>().fetchSales();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final salesProvider = context.watch<SalesProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final sales = salesProvider.filteredSales;

    return Scaffold(
      appBar: AppBar(
        title: _isSearching
            ? TextField(
                controller: _searchController,
                autofocus: true,
                style: const TextStyle(fontSize: 16),
                decoration: const InputDecoration(
                  hintText: 'Search receipt # or customer...',
                  border: InputBorder.none,
                ),
                onChanged: (val) => salesProvider.setSearchQuery(val),
              )
            : const Text('Sales History'),
        actions: [
          IconButton(
            icon: Icon(_isSearching ? Icons.close_rounded : Icons.search_rounded),
            onPressed: () {
              setState(() {
                if (_isSearching) {
                  _searchController.clear();
                  salesProvider.setSearchQuery('');
                }
                _isSearching = !_isSearching;
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => salesProvider.fetchSales(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Payment Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: _paymentFilters.map((method) {
                final isSelected = salesProvider.selectedPaymentMethod == method;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(
                      method == 'ALL' ? 'All Payments' : method.replaceAll('_', ' '),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected ? Colors.white : null,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: AppColors.primary,
                    checkmarkColor: Colors.white,
                    onSelected: (_) => salesProvider.setPaymentFilter(method),
                  ),
                );
              }).toList(),
            ),
          ),

          // Total Sales Count / Banner
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${sales.length} transactions',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                ),
                Text(
                  'Total: ${Formatters.formatMoney(sales.fold(0.0, (sum, s) => sum + s.total))}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),

          // Sales List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => salesProvider.fetchSales(),
              child: salesProvider.isLoading && sales.isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : sales.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.receipt_long_rounded,
                                size: 64,
                                color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'No sales records found',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Complete checkouts from the POS tab to see receipts',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: sales.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final sale = sales[index];
                            return _SaleRecordCard(sale: sale);
                          },
                        ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SaleRecordCard extends StatefulWidget {
  final SaleRecord sale;

  const _SaleRecordCard({required this.sale});

  @override
  State<_SaleRecordCard> createState() => _SaleRecordCardState();
}

class _SaleRecordCardState extends State<_SaleRecordCard> {
  bool _expanded = false;

  Color _getPaymentColor(String method) {
    switch (method.toUpperCase()) {
      case 'TELEBIRR':
        return AppColors.telebirr;
      case 'CBE_BIRR':
        return AppColors.cbeBirr;
      case 'BANK_TRANSFER':
        return AppColors.secondary;
      case 'CREDIT':
        return AppColors.warning;
      case 'CASH':
      default:
        return AppColors.cash;
    }
  }

  @override
  Widget build(BuildContext context) {
    final sale = widget.sale;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dateStr = DateFormat('MMM dd, yyyy • hh:mm a').format(sale.createdAt);

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => setState(() => _expanded = !_expanded),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Receipt # and Total
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.receipt_rounded,
                          color: AppColors.primary,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            sale.receiptNumber,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              fontFamily: 'monospace',
                            ),
                          ),
                          Text(
                            dateStr,
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        Formatters.formatMoney(sale.total),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: _getPaymentColor(sale.paymentMethod).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          sale.paymentMethod.replaceAll('_', ' '),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: _getPaymentColor(sale.paymentMethod),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              // Customer / Cashier subline
              if (sale.customerName != null || sale.cashierName != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    if (sale.customerName != null) ...[
                      Icon(Icons.person_outline_rounded, size: 14, color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                      const SizedBox(width: 4),
                      Text(
                        sale.customerName!,
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                    if (sale.cashierName != null) ...[
                      Icon(Icons.badge_outlined, size: 14, color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                      const SizedBox(width: 4),
                      Text(
                        'Cashier: ${sale.cashierName}',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                      ),
                    ],
                  ],
                ),
              ],

              // Expanded Item Details
              if (_expanded) ...[
                const Divider(height: 20),
                Text(
                  'Items (${sale.items.length})',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 6),
                ...sale.items.map((item) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 3),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              '${item.quantity}× ${item.productName}',
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
                          Text(
                            Formatters.formatMoney(item.total),
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    )),
                if (sale.amountPaid > 0) ...[
                  const Divider(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Amount Tendered',
                        style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                      ),
                      Text(
                        Formatters.formatMoney(sale.amountPaid),
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  if (sale.change > 0)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Change Returned',
                          style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                        ),
                        Text(
                          Formatters.formatMoney(sale.change),
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.success),
                        ),
                      ],
                    ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}
