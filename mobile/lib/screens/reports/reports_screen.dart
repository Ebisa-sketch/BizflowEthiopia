import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/formatters.dart';
import '../../providers/reports_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/metric_card.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final Map<String, String> _periods = {
    'today': 'Today',
    'week': 'This Week',
    'month': 'This Month',
    'quarter': 'Last 90 Days',
  };

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReportsProvider>().fetchReport();
    });
  }

  @override
  Widget build(BuildContext context) {
    final reportsProvider = context.watch<ReportsProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final data = reportsProvider.report;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports & P&L Analysis'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => reportsProvider.fetchReport(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => reportsProvider.fetchReport(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Period Selector
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _periods.entries.map((entry) {
                    final isSelected = reportsProvider.period == entry.key;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(
                          entry.value,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected
                                ? FontWeight.w700
                                : FontWeight.w500,
                            color: isSelected ? Colors.white : null,
                          ),
                        ),
                        selected: isSelected,
                        selectedColor: AppColors.primary,
                        onSelected: (_) => reportsProvider.setPeriod(entry.key),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 16),

              if (reportsProvider.isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: CircularProgressIndicator(),
                  ),
                )
              else ...[
                // KPI Grid
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.15,
                  children: [
                    MetricCard(
                      title: 'Net Revenue',
                      value: Formatters.formatMoney(data.totalRevenue),
                      icon: Icons.trending_up_rounded,
                      iconColor: AppColors.primary,
                      subtitle: 'Total completed sales',
                    ),
                    MetricCard(
                      title: 'Cost of Goods',
                      value: Formatters.formatMoney(data.totalCogs),
                      icon: Icons.inventory_rounded,
                      iconColor: AppColors.warning,
                      subtitle: 'Wholesale product cost',
                    ),
                    MetricCard(
                      title: 'Gross Profit',
                      value: Formatters.formatMoney(data.grossProfit),
                      icon: Icons.account_balance_wallet_rounded,
                      iconColor: AppColors.secondary,
                      subtitle: 'Revenue minus COGS',
                    ),
                    MetricCard(
                      title: 'Net Profit',
                      value: Formatters.formatMoney(data.netProfit),
                      icon: Icons.stars_rounded,
                      iconColor: data.netProfit >= 0
                          ? AppColors.success
                          : AppColors.danger,
                      subtitle: 'After all expenses',
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // P&L Statement Card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(
                              Icons.bar_chart_rounded,
                              color: AppColors.primary,
                              size: 20,
                            ),
                            SizedBox(width: 8),
                            Text(
                              'Profit & Loss Statement',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _PnLRow(
                          label: 'Total Revenue',
                          amount: data.totalRevenue,
                          isBold: true,
                          color: AppColors.primary,
                        ),
                        const Divider(height: 16),
                        _PnLRow(
                          label: '(-) Cost of Goods Sold (COGS)',
                          amount: data.totalCogs,
                          color: AppColors.warning,
                        ),
                        const Divider(height: 16),
                        _PnLRow(
                          label: '(=) Gross Profit',
                          amount: data.grossProfit,
                          isBold: true,
                          color: AppColors.secondary,
                        ),
                        const Divider(height: 16),
                        _PnLRow(
                          label: '(-) Operating Expenses',
                          amount: data.totalExpenses,
                          color: AppColors.danger,
                        ),
                        const Divider(height: 20, thickness: 1.5),
                        _PnLRow(
                          label: '(=) Net Profit',
                          amount: data.netProfit,
                          isBold: true,
                          isLarge: true,
                          color: data.netProfit >= 0
                              ? AppColors.success
                              : AppColors.danger,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Payment Methods Breakdown Card
                if (data.paymentBreakdown.isNotEmpty) ...[
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(
                                Icons.account_balance_rounded,
                                color: AppColors.secondary,
                                size: 20,
                              ),
                              SizedBox(width: 8),
                              Text(
                                'Payment Channels',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          ...data.paymentBreakdown.entries.map((entry) {
                            final total = data.totalRevenue > 0
                                ? data.totalRevenue
                                : 1.0;
                            final percent = (entry.value / total).clamp(
                              0.0,
                              1.0,
                            );
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        entry.key.replaceAll('_', ' '),
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      Text(
                                        '${Formatters.formatMoney(entry.value)} (${(percent * 100).toStringAsFixed(1)}%)',
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(4),
                                    child: LinearProgressIndicator(
                                      value: percent,
                                      minHeight: 6,
                                      backgroundColor: isDark
                                          ? AppColors.darkBorder
                                          : AppColors.lightBorder,
                                      valueColor: const AlwaysStoppedAnimation(
                                        AppColors.primary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                // Top Selling Products Leaderboard
                if (data.topProducts.isNotEmpty) ...[
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(
                                Icons.leaderboard_rounded,
                                color: AppColors.warning,
                                size: 20,
                              ),
                              SizedBox(width: 8),
                              Text(
                                'Top Selling Products',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ...data.topProducts.asMap().entries.map((item) {
                            final rank = item.key + 1;
                            final product = item.value;
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 14,
                                    backgroundColor: rank <= 3
                                        ? AppColors.warning.withValues(
                                            alpha: 0.2,
                                          )
                                        : AppColors.primary.withValues(
                                            alpha: 0.1,
                                          ),
                                    child: Text(
                                      '$rank',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: rank <= 3
                                            ? AppColors.warning
                                            : AppColors.primary,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          product.name,
                                          style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                        Text(
                                          '${product.unitsSold} units sold',
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
                                  Text(
                                    Formatters.formatMoney(product.revenue),
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
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

class _PnLRow extends StatelessWidget {
  final String label;
  final double amount;
  final bool isBold;
  final bool isLarge;
  final Color? color;

  const _PnLRow({
    required this.label,
    required this.amount,
    this.isBold = false,
    this.isLarge = false,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isLarge ? 15 : 13,
            fontWeight: isBold ? FontWeight.w800 : FontWeight.w500,
          ),
        ),
        Text(
          Formatters.formatMoney(amount),
          style: TextStyle(
            fontSize: isLarge ? 17 : 13,
            fontWeight: isBold ? FontWeight.w900 : FontWeight.w600,
            color: color,
          ),
        ),
      ],
    );
  }
}
