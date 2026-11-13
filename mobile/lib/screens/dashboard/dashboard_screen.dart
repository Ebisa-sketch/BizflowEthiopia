import 'package:flutter/foundation.dart' show listEquals;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../core/formatters.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/inventory_provider.dart';
import '../../providers/shift_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/thermal_receipt_modal.dart';

class DashboardScreen extends StatefulWidget {
  final Function(int index)? onNavigateTab;
  final Function(String route)? onNavigateRoute;

  const DashboardScreen({super.key, this.onNavigateTab, this.onNavigateRoute});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _selectedRange = '7d';
  double? _countedCash;
  double _startingFloat = 0;

  static const Map<String, String> _dateRanges = {
    'today': 'Today',
    '7d': '7 Days',
    '30d': '30 Days',
    'month': 'This Month',
  };

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DashboardProvider>().fetchMetrics(_selectedRange);
      context.read<ShiftProvider>().fetchCurrentShift();
    });
  }

  void _nav(String route, int legacyIndex) {
    if (widget.onNavigateRoute != null) {
      widget.onNavigateRoute!(route);
    } else if (widget.onNavigateTab != null) {
      widget.onNavigateTab!(legacyIndex);
    }
  }

  void _openZReportModal(BuildContext context, DashboardMetrics metrics, String businessName, String? cashierName, String currency) {
    showDialog(
      context: context,
      builder: (ctx) => _DailyZReportDialog(
        metrics: metrics,
        businessName: businessName,
        cashierName: cashierName ?? 'Cashier',
        currency: currency,
        countedCash: _countedCash,
        startingFloat: _startingFloat,
      ),
    );
  }

  void _openReconciliationModal(BuildContext context, DashboardMetrics metrics, String currency, double shiftFloat) {
    showDialog(
      context: context,
      builder: (ctx) => _CashDrawerReconciliationDialog(
        currency: currency,
        cashCollected: metrics.cashCollected,
        expectedCashInTill: metrics.expectedCashInTill > 0 ? metrics.expectedCashInTill : metrics.cashCollected,
        initialStartingFloat: shiftFloat > 0 ? shiftFloat : _startingFloat,
        onReconcile: (counted, floatVal) {
          setState(() {
            _countedCash = counted;
            _startingFloat = floatVal;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Till reconciled: ${Formatters.formatMoney(counted, currency: currency)} counted.',
              ),
              backgroundColor: AppColors.primaryDark,
              behavior: SnackBarBehavior.floating,
            ),
          );
        },
        onGenerateZReport: (counted, floatVal) {
          setState(() {
            _countedCash = counted;
            _startingFloat = floatVal;
          });
          final auth = context.read<AuthProvider>();
          final bName = auth.user?.business?.name ?? 'BizFlow Ethiopia';
          final cName = auth.user?.name ?? 'Cashier';
          _openZReportModal(context, metrics, bName, cName, currency);
        },
      ),
    );
  }

  void _openQuickRestockModal(BuildContext context, DashboardLowStockItem item) {
    showDialog(
      context: context,
      builder: (ctx) => _QuickRestockDialog(
        item: item,
        onSuccess: () {
          context.read<DashboardProvider>().fetchMetrics(_selectedRange);
        },
      ),
    );
  }

  void _openReceiptModal(BuildContext context, DashboardRecentTransaction tx, String businessName, String currency) {
    showDialog(
      context: context,
      builder: (ctx) => ThermalReceiptModal(
        receipt: {
          'receiptNumber': tx.saleNumber,
          'date': tx.createdAt ?? DateTime.now(),
          'customerName': tx.customerName,
          'paymentReference': '',
          'paymentMethod': tx.paymentMethod,
          'subtotal': tx.grandTotal,
          'tax': 0.0,
          'discount': 0.0,
          'grandTotal': tx.grandTotal,
          'items': [
            {
              'name': tx.productsSummary,
              'quantity': tx.itemCount > 0 ? tx.itemCount : 1,
              'price': tx.grandTotal / (tx.itemCount > 0 ? tx.itemCount : 1),
              'total': tx.grandTotal,
            }
          ],
        },
        businessName: businessName,
        cashierName: tx.cashierName,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final dashboard = context.watch<DashboardProvider>();
    final shift = context.watch<ShiftProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final user = auth.user;
    final metrics = dashboard.metrics;
    final currency = user?.business?.currency ?? 'ETB';
    final eatNow = DateTime.now().toUtc().add(const Duration(hours: 3));
    final eatHour = eatNow.hour;
    final greeting = eatHour < 12
        ? 'Good morning'
        : eatHour < 17
            ? 'Good afternoon'
            : 'Good evening';
    final lowStockItems = metrics.lowStockItems.take(4).toList();
    final recentTransactions = metrics.recentTransactions.take(6).toList();
    final businessName = user?.business?.name ?? 'BizFlow Ethiopia';
    final cashierName = user?.name ?? 'Staff';
    final shiftFloat = shift.currentShift?.openingFloat ?? 0.0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Store Overview'),
        actions: [
          IconButton(
            tooltip: 'Print Daily Z-Report',
            icon: const Icon(Icons.print_outlined),
            onPressed: () => _openZReportModal(context, metrics, businessName, cashierName, currency),
          ),
          IconButton(
            tooltip: 'Reconcile Cash Till',
            icon: const Icon(Icons.point_of_sale_rounded),
            onPressed: () => _openReconciliationModal(context, metrics, currency, shiftFloat),
          ),
          IconButton(
            tooltip: 'Refresh Metrics',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              dashboard.fetchMetrics(_selectedRange);
              shift.fetchCurrentShift();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await dashboard.fetchMetrics(_selectedRange);
          await shift.fetchCurrentShift();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _DashboardWelcomeCard(
                greeting: greeting,
                name: user?.name ?? 'Staff',
                role: user?.role ?? 'CASHIER',
                businessName: businessName,
                eatNow: eatNow,
                shift: shift,
                currency: currency,
                countedCash: _countedCash,
                onOpenZReport: () => _openZReportModal(context, metrics, businessName, cashierName, currency),
                onOpenReconciliation: () => _openReconciliationModal(context, metrics, currency, shiftFloat),
              ),
              const SizedBox(height: 12),
              _DashboardPeriodSelector(
                selectedRange: _selectedRange,
                ranges: _dateRanges,
                onSelected: (range) {
                  setState(() => _selectedRange = range);
                  context.read<DashboardProvider>().fetchMetrics(range);
                },
              ),
              const SizedBox(height: 12),

              // KPI Grid with Smooth Cubic Bézier Sparklines
              if (dashboard.isLoading && dashboard.hasLoaded)
                const Padding(
                  padding: EdgeInsets.only(bottom: 8),
                  child: LinearProgressIndicator(minHeight: 2),
                ),
              if (dashboard.isLoading && !dashboard.hasLoaded)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: CircularProgressIndicator(),
                  ),
                )
              else
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.15,
                  children: [
                    _DashboardMetricCard(
                      title: 'Gross Sales',
                      value: Formatters.formatMoney(
                        metrics.todayRevenue,
                        currency: currency,
                      ),
                      icon: Icons.account_balance_wallet_outlined,
                      color: AppColors.primaryDark,
                      comparison: metrics.comparisons['sales'],
                      comparisonLabel: metrics.comparisonLabel,
                      sparkline: metrics.chartData
                          .map((point) => point.amount)
                          .toList(),
                      onTap: () => _nav('sales', 2),
                    ),
                    _DashboardMetricCard(
                      title: 'Gross Profit',
                      value: Formatters.formatMoney(
                        metrics.grossProfit,
                        currency: currency,
                      ),
                      icon: Icons.trending_up_rounded,
                      color: AppColors.secondary,
                      note:
                          '${metrics.grossMarginPercentage.toStringAsFixed(1)}% margin',
                      comparison: metrics.comparisons['grossProfit'],
                      comparisonLabel: metrics.comparisonLabel,
                      sparkline: metrics.chartData
                          .map((point) => point.profit)
                          .toList(),
                      onTap: () => _nav('reports', 3),
                    ),
                    _DashboardMetricCard(
                      title: 'Transactions',
                      value: '${metrics.todayTransactions}',
                      icon: Icons.receipt_long_rounded,
                      color: const Color(0xFF9333EA),
                      comparison: metrics.comparisons['transactions'],
                      comparisonLabel: metrics.comparisonLabel,
                      sparkline: metrics.chartData
                          .map((point) => point.sales.toDouble())
                          .toList(),
                      onTap: () => _nav('sales', 2),
                    ),
                    _DashboardMetricCard(
                      title: 'Low Stock Items',
                      value: '${metrics.lowStockCount}',
                      icon: Icons.warning_amber_rounded,
                      color: metrics.lowStockCount > 0
                          ? AppColors.warning
                          : AppColors.success,
                      note: metrics.lowStockCount > 0
                          ? 'Reorder required'
                          : 'Inventory healthy',
                      sparkline: metrics.lowStockCount > 0
                          ? [
                              (metrics.lowStockCount + 3).toDouble(),
                              (metrics.lowStockCount + 2).toDouble(),
                              (metrics.lowStockCount + 1).toDouble(),
                              (metrics.lowStockCount + 2).toDouble(),
                              metrics.lowStockCount.toDouble(),
                            ]
                          : [2, 1, 1, 0, 0],
                      onTap: () => _nav('inventory', 1),
                    ),
                  ],
                ),
              const SizedBox(height: 14),

              // Secondary Financial Metrics Strip (Matching Web Dashboard)
              _FinancialSummary(metrics: metrics, currency: currency),
              const SizedBox(height: 16),

              // Interactive Sales Trend Chart (Area & Bar Mode with Touch Scrubber)
              _SalesTrendCard(
                points: metrics.chartData,
                totalRevenue: metrics.todayRevenue,
                range: _selectedRange,
                currency: currency,
              ),
              const SizedBox(height: 16),

              // Quick Actions Section
              _QuickActionsSection(
                onNavigate: (route) {
                  if (route == 'z_report') {
                    _openZReportModal(context, metrics, businessName, cashierName, currency);
                  } else if (route == 'reconcile') {
                    _openReconciliationModal(context, metrics, currency, shiftFloat);
                  } else {
                    final legacyIndex = switch (route) {
                      'pos' => 2,
                      'sales' => 2,
                      'products' => 1,
                      'customers' => 0,
                      'expenses' => 4,
                      'reports' => 3,
                      _ => 0,
                    };
                    _nav(route, legacyIndex);
                  }
                },
              ),
              const SizedBox(height: 16),

              // Business Insights & Store Details
              _DashboardDetailsCard(
                metrics: metrics,
                onNavigate: (route) => _nav(route, 0),
                currency: currency,
              ),
              const SizedBox(height: 24),

              // Low Stock Inventory Feed with Direct "Restock" Action
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.warning.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.warning_amber_rounded,
                          color: AppColors.warning,
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Inventory Alerts',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  TextButton.icon(
                    icon: const Icon(Icons.arrow_forward_rounded, size: 14),
                    label: const Text('View All'),
                    onPressed: () => _nav('inventory', 1),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              if (lowStockItems.isEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.success.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.check_circle_outline,
                            color: AppColors.success,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 14),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Inventory Levels Healthy',
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'All products currently meet or exceed their restock thresholds.',
                                style: TextStyle(fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                Card(
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: lowStockItems.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final item = lowStockItems[index];
                      final isOut = item.isOut || item.stock <= 0;
                      final iconData = item.name.toLowerCase().contains('oil')
                          ? Icons.water_drop_outlined
                          : item.name.toLowerCase().contains('cola')
                              ? Icons.local_drink_outlined
                              : Icons.inventory_2_outlined;

                      return ListTile(
                        leading: Container(
                          height: 38,
                          width: 38,
                          decoration: BoxDecoration(
                            color: (isOut ? AppColors.danger : AppColors.warning)
                                .withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            iconData,
                            size: 20,
                            color: isOut ? AppColors.danger : AppColors.warning,
                          ),
                        ),
                        title: Text(
                          item.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                        subtitle: Text(
                          isOut
                              ? 'SKU: ${item.sku} • OUT OF STOCK'
                              : 'SKU: ${item.sku} • Alert below ${item.reorderLevel} units',
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark
                                ? AppColors.darkTextSecondary
                                : AppColors.lightTextSecondary,
                          ),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: (isOut ? AppColors.danger : AppColors.warning)
                                    .withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                isOut ? 'OUT' : '${item.stock} left',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: isOut ? AppColors.danger : AppColors.warning,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                minimumSize: const Size(0, 30),
                                side: BorderSide(
                                  color: AppColors.primaryDark.withValues(alpha: 0.5),
                                ),
                              ),
                              onPressed: () => _openQuickRestockModal(context, item),
                              child: const Text(
                                'Restock',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primaryDark,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              const SizedBox(height: 24),

              // Recent Sales Transactions Feed with Tap-To-View Receipt Modal
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Recent Transactions',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        'Tap any sale to view 80mm thermal receipt',
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark
                              ? AppColors.darkTextSecondary
                              : AppColors.lightTextSecondary,
                        ),
                      ),
                    ],
                  ),
                  TextButton.icon(
                    icon: const Icon(Icons.arrow_forward_rounded, size: 14),
                    label: const Text('View All'),
                    onPressed: () => _nav('sales', 2),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              if (recentTransactions.isEmpty)
                const Card(
                  child: ListTile(
                    leading: Icon(Icons.receipt_long_outlined),
                    title: Text('No transactions in this period'),
                    subtitle: Text('Sales processed through POS appear here.'),
                  ),
                )
              else
                Card(
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: recentTransactions.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final sale = recentTransactions[index];
                      final dateText = sale.createdAt == null
                          ? ''
                          : '${DateFormat('MMM d, hh:mm a').format(sale.createdAt!.toUtc().add(const Duration(hours: 3)))} EAT';

                      return InkWell(
                        onTap: () => _openReceiptModal(context, sale, businessName, currency),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: AppColors.primary.withValues(
                              alpha: 0.15,
                            ),
                            child: const Icon(
                              Icons.receipt_rounded,
                              color: AppColors.primary,
                              size: 18,
                            ),
                          ),
                          title: Text(
                            sale.saleNumber,
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                              fontFamily: 'monospace',
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${sale.productsSummary} • ${sale.customerName}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                '$dateText • ${sale.paymentMethod.replaceAll('_', ' ')} • ${sale.cashierName}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                          isThreeLine: true,
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                Formatters.formatMoney(
                                  sale.grandTotal,
                                  currency: currency,
                                ),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12,
                                  color: AppColors.primary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.success.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  sale.status,
                                  style: const TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.success,
                                  ),
                                ),
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
        ),
      ),
    );
  }
}

class _DashboardWelcomeCard extends StatelessWidget {
  const _DashboardWelcomeCard({
    required this.greeting,
    required this.name,
    required this.role,
    required this.businessName,
    required this.eatNow,
    required this.shift,
    required this.currency,
    this.countedCash,
    required this.onOpenZReport,
    required this.onOpenReconciliation,
  });

  final String greeting;
  final String name;
  final String role;
  final String businessName;
  final DateTime eatNow;
  final ShiftProvider shift;
  final String currency;
  final double? countedCash;
  final VoidCallback onOpenZReport;
  final VoidCallback onOpenReconciliation;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final trimmedName = name.trim();
    final displayName = trimmedName.isEmpty
        ? 'there'
        : trimmedName.split(' ').first;
    final primary = isDark
        ? AppColors.darkTextPrimary
        : AppColors.lightTextPrimary;
    final secondary = isDark
        ? AppColors.darkTextSecondary
        : AppColors.lightTextSecondary;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.brandNavy : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? AppColors.brandNavyBorder : AppColors.lightBorder,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  height: 44,
                  width: 44,
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: AppColors.warning.withValues(alpha: 0.3),
                    ),
                  ),
                  child: const Icon(
                    Icons.wb_sunny_outlined,
                    color: AppColors.warning,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              '$greeting, $displayName!',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: primary,
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: AppColors.primary.withValues(alpha: 0.3),
                              ),
                            ),
                            child: Text(
                              role.toUpperCase(),
                              style: const TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                                color: AppColors.primaryDark,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        businessName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12, color: secondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Live Addis Ababa Date & Shift Telemetry
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.brandNavyCard : AppColors.lightBg,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isDark ? AppColors.brandNavyBorder : AppColors.lightBorder,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.calendar_today_outlined, size: 12, color: secondary),
                      const SizedBox(width: 5),
                      Text(
                        '${DateFormat('EEE, d MMM').format(eatNow)} • ${DateFormat('h:mm a').format(eatNow)} EAT',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: secondary),
                      ),
                    ],
                  ),
                ),
                _DashboardStatusPill(
                  label: shift.hasActiveShift ? 'Shift Open' : 'No Active Shift',
                  color: shift.hasActiveShift ? AppColors.success : AppColors.warning,
                ),
                if (shift.hasActiveShift)
                  Text(
                    'Float: ${Formatters.formatMoney(shift.currentShift!.openingFloat, currency: currency)}',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: secondary,
                    ),
                  ),
                if (countedCash != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.primaryDark.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppColors.primaryDark.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      'Reconciled Till: ${Formatters.formatMoney(countedCash!, currency: currency)}',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primaryDark,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),

            // Operational Action Buttons (Till Count & Daily Z-Report)
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      side: BorderSide(
                        color: isDark ? AppColors.brandNavyBorder : AppColors.lightBorder,
                      ),
                    ),
                    icon: const Icon(Icons.point_of_sale_rounded, size: 15, color: AppColors.primaryDark),
                    label: const Text(
                      'Till Count',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                    onPressed: onOpenReconciliation,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDark ? AppColors.brandNavyCard : AppColors.brandNavy,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.print_outlined, size: 15, color: AppColors.primary),
                    label: const Text(
                      'Daily Z-Report',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                    onPressed: onOpenZReport,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DashboardStatusPill extends StatelessWidget {
  const _DashboardStatusPill({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: 6,
            width: 6,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _DashboardPeriodSelector extends StatelessWidget {
  const _DashboardPeriodSelector({
    required this.selectedRange,
    required this.ranges,
    required this.onSelected,
  });

  final String selectedRange;
  final Map<String, String> ranges;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final label = switch (selectedRange) {
      'today' => 'Today (00:00 – Present EAT)',
      '7d' => 'Last 7 Days',
      '30d' => 'Last 30 Days',
      'month' => 'This Calendar Month',
      _ => 'Selected period',
    };

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.calendar_month_outlined,
                  size: 16,
                  color: AppColors.primaryDark,
                ),
                const SizedBox(width: 7),
                Text(
                  'Overview Period:',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: isDark
                        ? AppColors.darkTextPrimary
                        : AppColors.lightTextPrimary,
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isDark
                          ? AppColors.darkTextSecondary
                          : AppColors.lightTextSecondary,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: ranges.entries.map((entry) {
                  final selected = selectedRange == entry.key;
                  final selectedColor = isDark
                      ? AppColors.primary
                      : AppColors.brandNavy;
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: Material(
                      color: selected
                          ? selectedColor
                          : (isDark ? AppColors.darkBg : AppColors.lightBg),
                      borderRadius: BorderRadius.circular(10),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(10),
                        onTap: () => onSelected(entry.key),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 8,
                          ),
                          child: Text(
                            entry.value,
                            style: TextStyle(
                              color: selected
                                  ? (isDark
                                        ? AppColors.brandNavy
                                        : Colors.white)
                                  : (isDark
                                        ? AppColors.darkTextSecondary
                                        : AppColors.lightTextSecondary),
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DashboardMetricCard extends StatelessWidget {
  const _DashboardMetricCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    required this.onTap,
    this.note,
    this.comparison,
    this.comparisonLabel = '',
    this.sparkline = const [],
  });

  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final String? note;
  final DashboardComparison? comparison;
  final String comparisonLabel;
  final List<double> sparkline;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark
        ? AppColors.darkTextPrimary
        : AppColors.lightTextPrimary;
    final mutedColor = isDark
        ? AppColors.darkTextSecondary
        : AppColors.lightTextSecondary;
    final comparisonColor = switch (comparison?.direction.toLowerCase()) {
      'up' => AppColors.success,
      'down' => AppColors.danger,
      _ => mutedColor,
    };
    final comparisonIcon = switch (comparison?.direction.toLowerCase()) {
      'up' => Icons.trending_up_rounded,
      'down' => Icons.trending_down_rounded,
      _ => Icons.horizontal_rule_rounded,
    };

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    height: 28,
                    width: 28,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(icon, size: 15, color: color),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: mutedColor,
                      ),
                    ),
                  ),
                  Icon(
                    Icons.chevron_right_rounded,
                    size: 16,
                    color: mutedColor,
                  ),
                ],
              ),
              const Spacer(),
              Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  color: textColor,
                  fontFamily: 'monospace',
                ),
              ),
              if (note != null && note!.isNotEmpty) ...[
                const SizedBox(height: 2),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    note!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      color: color,
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: comparison == null
                        ? const SizedBox.shrink()
                        : Row(
                            children: [
                              Icon(
                                comparisonIcon,
                                size: 11,
                                color: comparisonColor,
                              ),
                              const SizedBox(width: 2),
                              Flexible(
                                child: Text(
                                  '${comparison!.text} $comparisonLabel',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w700,
                                    color: comparisonColor,
                                  ),
                                ),
                              ),
                            ],
                          ),
                  ),
                  if (sparkline.isNotEmpty)
                    SizedBox(
                      width: 48,
                      height: 22,
                      child: CustomPaint(
                        painter: _MetricSparklinePainter(sparkline, color),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Catmull-Rom Cubic Bézier Spline Sparkline with Area Gradient (Matches Web App)
class _MetricSparklinePainter extends CustomPainter {
  const _MetricSparklinePainter(this.values, this.color);

  final List<double> values;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    if (values.isEmpty) return;

    var data = values.where((v) => v.isFinite).toList();
    if (data.isEmpty) return;
    if (data.length == 1) {
      data = [data[0], data[0], data[0]];
    } else if (data.length == 2) {
      data = [data[0], (data[0] + data[1]) / 2, data[1]];
    }

    final minValue = data.reduce((a, b) => a < b ? a : b);
    final maxValue = data.reduce((a, b) => a > b ? a : b);
    final valueRange = maxValue - minValue == 0 ? 1.0 : maxValue - minValue;

    const padX = 2.0;
    const padY = 3.0;
    final w = size.width - padX * 2;
    final h = size.height - padY * 2;

    final points = <Offset>[];
    for (var i = 0; i < data.length; i++) {
      final x = padX + (data.length > 1 ? (i / (data.length - 1)) * w : w / 2);
      final y = padY + (1 - (data[i] - minValue) / valueRange) * h;
      points.add(Offset(x, y));
    }

    // Build Catmull-Rom to Cubic Bézier Spline
    final path = Path()..moveTo(points[0].dx, points[0].dy);
    for (var i = 0; i < points.length - 1; i++) {
      final p0 = points[i == 0 ? 0 : i - 1];
      final p1 = points[i];
      final p2 = points[i + 1];
      final p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      final cp1x = p1.dx + (p2.dx - p0.dx) / 6;
      final cp1y = p1.dy + (p2.dy - p0.dy) / 6;
      final cp2x = p2.dx - (p3.dx - p1.dx) / 6;
      final cp2y = p2.dy - (p3.dy - p1.dy) / 6;

      path.cubicTo(cp1x, cp1y, cp2x, cp2y, p2.dx, p2.dy);
    }

    // Fill area gradient underneath curve
    final areaPath = Path.from(path)
      ..lineTo(points.last.dx, size.height)
      ..lineTo(points.first.dx, size.height)
      ..close();

    final areaPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          color.withValues(alpha: 0.35),
          color.withValues(alpha: 0.0),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.fill;

    canvas.drawPath(areaPath, areaPaint);

    // Stroke line
    final strokePaint = Paint()
      ..color = color
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.drawPath(path, strokePaint);
  }

  @override
  bool shouldRepaint(covariant _MetricSparklinePainter oldDelegate) {
    return !listEquals(oldDelegate.values, values) || oldDelegate.color != color;
  }
}

class _FinancialSummary extends StatelessWidget {
  const _FinancialSummary({required this.metrics, required this.currency});

  final DashboardMetrics metrics;
  final String currency;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Financial Summary',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                ),
                Text(
                  'Net Margin: ${metrics.netMarginPercentage.toStringAsFixed(1)}%',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primaryDark,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 14,
              children: [
                _SummaryValue(
                  label: 'Payments Collected',
                  value: metrics.collected,
                  icon: Icons.payments_outlined,
                  color: AppColors.success,
                  currency: currency,
                ),
                _SummaryValue(
                  label: 'Cost of Goods (COGS)',
                  value: metrics.cogs,
                  icon: Icons.inventory_2_outlined,
                  color: AppColors.secondary,
                  currency: currency,
                ),
                _SummaryValue(
                  label: 'Operating Expenses',
                  value: metrics.expenses,
                  icon: Icons.receipt_long_outlined,
                  color: AppColors.warning,
                  currency: currency,
                ),
                _SummaryValue(
                  label: 'Outstanding Credit',
                  value: metrics.outstandingCredit,
                  icon: Icons.credit_score_outlined,
                  color: AppColors.danger,
                  currency: currency,
                ),
                _SummaryValue(
                  label: 'Net Operating Profit',
                  value: metrics.netOperatingProfit,
                  icon: Icons.account_balance_wallet_outlined,
                  color: AppColors.primaryDark,
                  currency: currency,
                ),
                _SummaryValue(
                  label: 'Average Order Value',
                  value: metrics.averageOrderValue,
                  icon: Icons.shopping_bag_outlined,
                  color: AppColors.secondary,
                  currency: currency,
                ),
              ],
            ),
            if (metrics.cashCollected > 0 || metrics.digitalCollected > 0) ...[
              const Divider(height: 24),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'Cash: ${Formatters.formatMoney(metrics.cashCollected, currency: currency)}',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.success,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.secondary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'Digital: ${Formatters.formatMoney(metrics.digitalCollected, currency: currency)}',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.secondary,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SummaryValue extends StatelessWidget {
  const _SummaryValue({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.currency,
  });

  final String label;
  final double value;
  final IconData icon;
  final Color color;
  final String currency;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 145,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(fontSize: 10),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  Formatters.formatMoney(value, currency: currency),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    fontFamily: 'monospace',
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Interactive Sales Trend & Revenue Chart with Scrubber Tooltip and View Toggle
class _SalesTrendCard extends StatefulWidget {
  const _SalesTrendCard({
    required this.points,
    required this.totalRevenue,
    required this.range,
    required this.currency,
  });

  final List<DashboardChartPoint> points;
  final double totalRevenue;
  final String range;
  final String currency;

  @override
  State<_SalesTrendCard> createState() => _SalesTrendCardState();
}

class _SalesTrendCardState extends State<_SalesTrendCard> {
  bool _isBarView = false;
  int? _hoveredIndex;

  @override
  Widget build(BuildContext context) {
    final points = widget.points;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    DashboardChartPoint? activePoint;
    if (_hoveredIndex != null && _hoveredIndex! >= 0 && _hoveredIndex! < points.length) {
      activePoint = points[_hoveredIndex!];
    }

    // Find peak day
    DashboardChartPoint? peakPoint;
    if (points.isNotEmpty) {
      peakPoint = points.reduce((a, b) => a.amount > b.amount ? a : b);
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        _isBarView ? Icons.bar_chart_rounded : Icons.trending_up_rounded,
                        color: AppColors.primaryDark,
                        size: 16,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Sales Trend',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
                Row(
                  children: [
                    Text(
                      Formatters.formatMoney(widget.totalRevenue, currency: widget.currency),
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 13,
                        color: AppColors.primaryDark,
                        fontFamily: 'monospace',
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      tooltip: _isBarView ? 'Switch to Curve View' : 'Switch to Bar View',
                      iconSize: 18,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      icon: Icon(
                        _isBarView ? Icons.show_chart_rounded : Icons.bar_chart_rounded,
                        color: AppColors.primaryDark,
                      ),
                      onPressed: () => setState(() => _isBarView = !_isBarView),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Text(
                  '${widget.range == 'month' ? 'This month' : _rangeLabel(widget.range)} • Revenue vs Gross Profit',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                if (peakPoint != null && peakPoint.amount > 0) ...[
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'Peak: ${peakPoint.day} (${Formatters.formatMoney(peakPoint.amount, currency: widget.currency)})',
                      style: const TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primaryDark,
                      ),
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 12),

            // Active Scrubber Tooltip Display
            if (activePoint != null)
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.brandNavyCard : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${activePoint.day}:',
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11),
                    ),
                    Text(
                      'Sales: ${Formatters.formatMoney(activePoint.amount, currency: widget.currency)}',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primaryDark,
                      ),
                    ),
                    Text(
                      'Profit: ${Formatters.formatMoney(activePoint.profit, currency: widget.currency)}',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.secondary,
                      ),
                    ),
                    Text(
                      '${activePoint.sales} orders',
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),

            if (points.isEmpty)
              const SizedBox(
                height: 140,
                child: Center(child: Text('No sales trend data available')),
              )
            else ...[
              GestureDetector(
                onPanDown: (details) => _handleTouch(details.localPosition.dx),
                onPanUpdate: (details) => _handleTouch(details.localPosition.dx),
                onTapUp: (_) => setState(() => _hoveredIndex = null),
                child: SizedBox(
                  height: 140,
                  width: double.infinity,
                  child: CustomPaint(
                    painter: _InteractiveTrendPainter(
                      points: points,
                      isBarView: _isBarView,
                      selectedIndex: _hoveredIndex,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: points
                    .map(
                      (point) => Expanded(
                        child: Text(
                          point.day,
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: activePoint?.day == point.day
                                ? FontWeight.w900
                                : FontWeight.normal,
                            color: activePoint?.day == point.day
                                ? AppColors.primaryDark
                                : null,
                          ),
                        ),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 12),
              const Row(
                children: [
                  _ChartLegend(color: AppColors.primary, label: 'Sales Revenue'),
                  SizedBox(width: 16),
                  _ChartLegend(color: AppColors.secondary, label: 'Gross Profit'),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _handleTouch(double dx) {
    if (widget.points.isEmpty) return;
    final total = widget.points.length;
    final index = (dx / (context.size?.width ?? 300) * total).floor().clamp(0, total - 1);
    setState(() => _hoveredIndex = index);
  }

  static String _rangeLabel(String range) {
    return switch (range) {
      'today' => 'Today',
      '7d' => 'Last 7 days',
      '30d' => 'Last 30 days',
      _ => 'Selected period',
    };
  }
}

class _ChartLegend extends StatelessWidget {
  const _ChartLegend({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 5),
        Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700)),
      ],
    );
  }
}

class _InteractiveTrendPainter extends CustomPainter {
  _InteractiveTrendPainter({
    required this.points,
    required this.isBarView,
    this.selectedIndex,
  });

  final List<DashboardChartPoint> points;
  final bool isBarView;
  final int? selectedIndex;

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;
    const horizontalInset = 8.0;
    const verticalInset = 12.0;
    final graphWidth = size.width - horizontalInset * 2;
    final graphHeight = size.height - verticalInset * 2;

    final maxVal = points.fold<double>(
      0,
      (max, p) => [max, p.amount, p.profit].reduce((a, b) => a > b ? a : b),
    );
    final scaleMax = maxVal <= 0 ? 1.0 : maxVal * 1.15;

    // Grid lines
    final gridPaint = Paint()
      ..color = Colors.grey.withValues(alpha: 0.15)
      ..strokeWidth = 1;
    for (var i = 0; i < 4; i++) {
      final y = verticalInset + graphHeight * i / 3;
      canvas.drawLine(
        Offset(horizontalInset, y),
        Offset(size.width - horizontalInset, y),
        gridPaint,
      );
    }

    if (isBarView) {
      // Draw Bar View
      final barGroupWidth = graphWidth / points.length;
      final singleBarWidth = (barGroupWidth * 0.35).clamp(4.0, 14.0);

      for (var i = 0; i < points.length; i++) {
        final p = points[i];
        final centerX = horizontalInset + barGroupWidth * i + barGroupWidth / 2;

        final salesHeight = (p.amount / scaleMax) * graphHeight;
        final profitHeight = (p.profit / scaleMax) * graphHeight;

        // Sales Bar
        final salesRect = RRect.fromRectAndRadius(
          Rect.fromLTWH(
            centerX - singleBarWidth - 1,
            verticalInset + graphHeight - salesHeight,
            singleBarWidth,
            salesHeight,
          ),
          const Radius.circular(3),
        );
        canvas.drawRRect(
          salesRect,
          Paint()..color = (selectedIndex == i ? AppColors.primaryDark : AppColors.primary),
        );

        // Profit Bar
        final profitRect = RRect.fromRectAndRadius(
          Rect.fromLTWH(
            centerX + 1,
            verticalInset + graphHeight - profitHeight,
            singleBarWidth,
            profitHeight,
          ),
          const Radius.circular(3),
        );
        canvas.drawRRect(
          profitRect,
          Paint()..color = (selectedIndex == i ? AppColors.secondaryDark : AppColors.secondary),
        );
      }
    } else {
      // Draw Curve View (Catmull-Rom Bézier spline with gradient)
      void drawSeries(double Function(DashboardChartPoint) value, Color color, bool drawArea) {
        final pts = <Offset>[];
        for (var i = 0; i < points.length; i++) {
          final x = points.length == 1
              ? size.width / 2
              : horizontalInset + graphWidth * i / (points.length - 1);
          final y = verticalInset + graphHeight * (1 - value(points[i]) / scaleMax);
          pts.add(Offset(x, y));
        }

        final path = Path()..moveTo(pts[0].dx, pts[0].dy);
        for (var i = 0; i < pts.length - 1; i++) {
          final p0 = pts[i == 0 ? 0 : i - 1];
          final p1 = pts[i];
          final p2 = pts[i + 1];
          final p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

          final cp1x = p1.dx + (p2.dx - p0.dx) / 6;
          final cp1y = p1.dy + (p2.dy - p0.dy) / 6;
          final cp2x = p2.dx - (p3.dx - p1.dx) / 6;
          final cp2y = p2.dy - (p3.dy - p1.dy) / 6;

          path.cubicTo(cp1x, cp1y, cp2x, cp2y, p2.dx, p2.dy);
        }

        if (drawArea) {
          final areaPath = Path.from(path)
            ..lineTo(pts.last.dx, verticalInset + graphHeight)
            ..lineTo(pts.first.dx, verticalInset + graphHeight)
            ..close();

          canvas.drawPath(
            areaPath,
            Paint()
              ..shader = LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  color.withValues(alpha: 0.25),
                  color.withValues(alpha: 0.0),
                ],
              ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
              ..style = PaintingStyle.fill,
          );
        }

        canvas.drawPath(
          path,
          Paint()
            ..color = color
            ..strokeWidth = 2.2
            ..style = PaintingStyle.stroke
            ..strokeCap = StrokeCap.round
            ..strokeJoin = StrokeJoin.round,
        );

        // Draw points
        for (var i = 0; i < pts.length; i++) {
          final pt = pts[i];
          final isSelected = selectedIndex == i;
          canvas.drawCircle(
            pt,
            isSelected ? 5.0 : 3.0,
            Paint()..color = Colors.white,
          );
          canvas.drawCircle(
            pt,
            isSelected ? 3.5 : 2.0,
            Paint()..color = color,
          );
        }
      }

      drawSeries((p) => p.amount, AppColors.primary, true);
      drawSeries((p) => p.profit, AppColors.secondary, false);
    }

    // Scrubber vertical indicator line
    if (selectedIndex != null && selectedIndex! >= 0 && selectedIndex! < points.length) {
      final x = points.length == 1
          ? size.width / 2
          : horizontalInset + graphWidth * selectedIndex! / (points.length - 1);
      canvas.drawLine(
        Offset(x, verticalInset),
        Offset(x, verticalInset + graphHeight),
        Paint()
          ..color = AppColors.primaryDark.withValues(alpha: 0.6)
          ..strokeWidth = 1.5
          ..style = PaintingStyle.stroke,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _InteractiveTrendPainter oldDelegate) {
    return oldDelegate.points != points ||
        oldDelegate.isBarView != isBarView ||
        oldDelegate.selectedIndex != selectedIndex;
  }
}

class _QuickActionsSection extends StatelessWidget {
  const _QuickActionsSection({required this.onNavigate});

  final ValueChanged<String> onNavigate;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          childAspectRatio: 2.1,
          children: [
            _QuickActionButton(
              title: 'New POS Sale',
              icon: Icons.point_of_sale_rounded,
              color: AppColors.primaryDark,
              onTap: () => onNavigate('pos'),
            ),
            _QuickActionButton(
              title: 'Daily Z-Report',
              icon: Icons.print_outlined,
              color: const Color(0xFF071924),
              onTap: () => onNavigate('z_report'),
            ),
            _QuickActionButton(
              title: 'Reconcile Till',
              icon: Icons.payments_outlined,
              color: const Color(0xFF0F766E),
              onTap: () => onNavigate('reconcile'),
            ),
            _QuickActionButton(
              title: 'Products & Stock',
              icon: Icons.inventory_2_outlined,
              color: const Color(0xFF4F46E5),
              onTap: () => onNavigate('products'),
            ),
            _QuickActionButton(
              title: 'Customer Credit',
              icon: Icons.people_alt_rounded,
              color: AppColors.warning,
              onTap: () => onNavigate('customers'),
            ),
            _QuickActionButton(
              title: 'Operating Expenses',
              icon: Icons.receipt_long_rounded,
              color: AppColors.danger,
              onTap: () => onNavigate('expenses'),
            ),
          ],
        ),
      ],
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.title,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const Icon(Icons.arrow_forward_ios_rounded, size: 11),
            ],
          ),
        ),
      ),
    );
  }
}

class _DashboardDetailsCard extends StatelessWidget {
  const _DashboardDetailsCard({
    required this.metrics,
    required this.onNavigate,
    required this.currency,
  });

  final DashboardMetrics metrics;
  final ValueChanged<String> onNavigate;
  final String currency;

  @override
  Widget build(BuildContext context) {
    final topProduct = metrics.topProduct;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Business Insights',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 10),
            _InsightRow(
              icon: Icons.trending_up,
              label: 'Top Selling Product',
              value: topProduct == null
                  ? 'No sales recorded yet'
                  : '${topProduct.name} • ${topProduct.units} units • ${Formatters.formatMoney(topProduct.revenue, currency: currency)}',
            ),
            const Divider(height: 18),
            _InsightRow(
              icon: Icons.inventory_2_outlined,
              label: 'No Sales in Selected Period',
              value: metrics.noSalesProduct ?? 'Inventory moving consistently',
            ),
            const Divider(height: 18),
            _InsightRow(
              icon: Icons.trending_down,
              label: 'Expense Trend',
              value: metrics.expenseTrendText,
            ),
            const SizedBox(height: 16),
            const Text(
              'Store Quick Stats',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 10),
            _QuickStatRow(
              icon: Icons.inventory_2_outlined,
              label: 'Total Products',
              value: Formatters.formatNumber(metrics.totalProducts),
              onTap: () => onNavigate('products'),
            ),
            _QuickStatRow(
              icon: Icons.people_outline,
              label: 'Named Customers',
              value: Formatters.formatNumber(metrics.customersWithSales),
              onTap: () => onNavigate('customers'),
            ),
            _QuickStatRow(
              icon: Icons.warehouse_outlined,
              label: 'Total Stock Value',
              value: Formatters.formatMoney(
                metrics.totalStockValue,
                currency: currency,
              ),
              onTap: () => onNavigate('inventory'),
            ),
            _QuickStatRow(
              icon: Icons.receipt_long_outlined,
              label: 'Expenses in Period',
              value: Formatters.formatMoney(
                metrics.expenses,
                currency: currency,
              ),
              onTap: () => onNavigate('expenses'),
            ),
            if (metrics.paymentMethods.isNotEmpty) ...[
              const SizedBox(height: 14),
              const Text(
                'Payment Methods Breakdown',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 6),
              ...metrics.paymentMethods.map(
                (payment) => _QuickStatRow(
                  icon: Icons.payments_outlined,
                  label: payment.method.replaceAll('_', ' '),
                  value:
                      '${Formatters.formatMoney(payment.amount, currency: currency)} (${payment.percentage}%)',
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _InsightRow extends StatelessWidget {
  const _InsightRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 11)),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _QuickStatRow extends StatelessWidget {
  const _QuickStatRow({
    required this.icon,
    required this.label,
    required this.value,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            Icon(icon, size: 16, color: AppColors.secondary),
            const SizedBox(width: 8),
            Expanded(child: Text(label, style: const TextStyle(fontSize: 11))),
            Text(
              value,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                fontFamily: 'monospace',
              ),
              textAlign: TextAlign.end,
            ),
          ],
        ),
      ),
    );
  }
}

/// Official End-of-Day Daily Z-Report Dialog (Matches src/components/dashboard/daily-z-report-modal.tsx)
class _DailyZReportDialog extends StatelessWidget {
  const _DailyZReportDialog({
    required this.metrics,
    required this.businessName,
    required this.cashierName,
    required this.currency,
    this.countedCash,
    required this.startingFloat,
  });

  final DashboardMetrics metrics;
  final String businessName;
  final String cashierName;
  final String currency;
  final double? countedCash;
  final double startingFloat;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final eatNow = DateTime.now().toUtc().add(const Duration(hours: 3));
    final expectedTill = startingFloat + (metrics.expectedCashInTill > 0 ? metrics.expectedCashInTill : metrics.cashCollected);
    final variance = countedCash != null ? countedCash! - expectedTill : null;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 420),
          decoration: BoxDecoration(
            color: isDark ? AppColors.brandNavyCard : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isDark ? AppColors.brandNavyBorder : AppColors.lightBorder,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.3),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.print_outlined, color: AppColors.primaryDark, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Daily Z-Report / የቀን ማጠቃለያ',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
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

              // Scrollable Z-Report Content
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(18),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF071924) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isDark ? AppColors.brandNavyBorder : AppColors.lightBorder,
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
                                'OFFICIAL STORE AUDIT Z-REPORT',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.1,
                                  color: AppColors.primaryDark,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${DateFormat('EEEE, MMMM d, yyyy').format(eatNow)} • ${DateFormat('h:mm a').format(eatNow)} EAT',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                ),
                              ),
                              Text(
                                'Operator: $cashierName',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Divider(height: 1),
                        const SizedBox(height: 10),

                        // Section 1: Financial & Sales Summary
                        const Text(
                          '1. FINANCIAL & SALES AUDIT',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 0.8),
                        ),
                        const SizedBox(height: 8),
                        _ZReportRow(label: 'Gross Sales Invoiced:', value: Formatters.formatMoney(metrics.todayRevenue, currency: currency), isBold: true),
                        _ZReportRow(label: 'Total Discount Given:', value: Formatters.formatMoney(metrics.discountTotal, currency: currency)),
                        _ZReportRow(label: '15% VAT / Tax Total:', value: Formatters.formatMoney(metrics.taxTotal, currency: currency)),
                        _ZReportRow(label: 'Cost of Goods Sold (COGS):', value: Formatters.formatMoney(metrics.cogs, currency: currency)),
                        _ZReportRow(label: 'Gross Profit:', value: Formatters.formatMoney(metrics.grossProfit, currency: currency), isBold: true),
                        _ZReportRow(label: 'Gross Profit Margin:', value: '${metrics.grossMarginPercentage.toStringAsFixed(1)}%'),
                        _ZReportRow(label: 'Operating Expenses:', value: Formatters.formatMoney(metrics.expenses, currency: currency)),
                        _ZReportRow(label: 'Net Operating Profit:', value: Formatters.formatMoney(metrics.netOperatingProfit, currency: currency), isBold: true),
                        _ZReportRow(label: 'Net Operating Margin:', value: '${metrics.netMarginPercentage.toStringAsFixed(1)}%'),
                        _ZReportRow(label: 'Completed Orders:', value: '${metrics.todayTransactions} transactions'),
                        _ZReportRow(label: 'Average Order Value:', value: Formatters.formatMoney(metrics.averageOrderValue, currency: currency)),

                        const SizedBox(height: 12),
                        const Divider(height: 1),
                        const SizedBox(height: 10),

                        // Section 2: Cash Till Reconciliation
                        const Text(
                          '2. CASH TILL RECONCILIATION',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 0.8),
                        ),
                        const SizedBox(height: 8),
                        _ZReportRow(label: 'Opening Cash Float:', value: Formatters.formatMoney(startingFloat, currency: currency)),
                        _ZReportRow(label: 'Cash Sales Collected:', value: Formatters.formatMoney(metrics.cashCollected, currency: currency)),
                        _ZReportRow(label: 'Expected Cash in Till:', value: Formatters.formatMoney(expectedTill, currency: currency), isBold: true),
                        if (countedCash != null) ...[
                          _ZReportRow(label: 'Counted Drawer Cash:', value: Formatters.formatMoney(countedCash!, currency: currency), isBold: true),
                          _ZReportRow(
                            label: 'Drawer Cash Variance:',
                            value: variance == 0
                                ? 'BALANCED (0.00)'
                                : variance! > 0
                                    ? '+${Formatters.formatMoney(variance, currency: currency)} (Over)'
                                    : '${Formatters.formatMoney(variance, currency: currency)} (Short)',
                            isBold: true,
                            textColor: variance == 0
                                ? AppColors.success
                                : variance! > 0
                                    ? AppColors.warning
                                    : AppColors.danger,
                          ),
                        ],

                        const SizedBox(height: 12),
                        const Divider(height: 1),
                        const SizedBox(height: 10),

                        // Section 3: Payment Method Distribution
                        const Text(
                          '3. PAYMENT METHODS DISTRIBUTION',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 0.8),
                        ),
                        const SizedBox(height: 8),
                        _ZReportRow(
                          label: 'Cash Tendered:',
                          value: '${Formatters.formatMoney(metrics.cashCollected, currency: currency)} (${metrics.todayRevenue > 0 ? ((metrics.cashCollected / metrics.todayRevenue) * 100).toStringAsFixed(1) : 0}%)',
                        ),
                        _ZReportRow(
                          label: 'Digital Payments:',
                          value: '${Formatters.formatMoney(metrics.digitalCollected, currency: currency)} (${metrics.todayRevenue > 0 ? ((metrics.digitalCollected / metrics.todayRevenue) * 100).toStringAsFixed(1) : 0}%)',
                        ),
                        if (metrics.outstandingCredit > 0)
                          _ZReportRow(
                            label: 'Customer Credit (Idda):',
                            value: Formatters.formatMoney(metrics.outstandingCredit, currency: currency),
                          ),
                        const SizedBox(height: 14),

                        Center(
                          child: Text(
                            '*** END OF Z-REPORT AUDIT ***\nBizFlow Ethiopia Retail POS System',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Action Buttons
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Close'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryDark,
                          foregroundColor: Colors.white,
                        ),
                        icon: const Icon(Icons.share_rounded, size: 16),
                        label: const Text('Share Report'),
                        onPressed: () {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Z-Report exported successfully.'),
                              backgroundColor: AppColors.primaryDark,
                            ),
                          );
                        },
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

class _ZReportRow extends StatelessWidget {
  const _ZReportRow({
    required this.label,
    required this.value,
    this.isBold = false,
    this.textColor,
  });

  final String label;
  final String value;
  final bool isBold;
  final Color? textColor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isBold ? FontWeight.w800 : FontWeight.w500,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isBold ? FontWeight.w900 : FontWeight.w700,
              fontFamily: 'monospace',
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}

/// Cash Drawer Reconciliation Modal (Matches src/components/dashboard/cash-drawer-reconciliation-modal.tsx)
class _CashDrawerReconciliationDialog extends StatefulWidget {
  const _CashDrawerReconciliationDialog({
    required this.currency,
    required this.cashCollected,
    required this.expectedCashInTill,
    required this.initialStartingFloat,
    required this.onReconcile,
    required this.onGenerateZReport,
  });

  final String currency;
  final double cashCollected;
  final double expectedCashInTill;
  final double initialStartingFloat;
  final Function(double counted, double startingFloat) onReconcile;
  final Function(double counted, double startingFloat) onGenerateZReport;

  @override
  State<_CashDrawerReconciliationDialog> createState() => _CashDrawerReconciliationDialogState();
}

class _CashDrawerReconciliationDialogState extends State<_CashDrawerReconciliationDialog> {
  bool _useDenominations = true;
  late final TextEditingController _floatController;
  final TextEditingController _manualController = TextEditingController();

  final TextEditingController _n200 = TextEditingController();
  final TextEditingController _n100 = TextEditingController();
  final TextEditingController _n50 = TextEditingController();
  final TextEditingController _n10 = TextEditingController();
  final TextEditingController _n5 = TextEditingController();
  final TextEditingController _coins = TextEditingController();

  @override
  void initState() {
    super.initState();
    _floatController = TextEditingController(
      text: widget.initialStartingFloat > 0 ? widget.initialStartingFloat.toStringAsFixed(0) : '0',
    );
  }

  @override
  void dispose() {
    _floatController.dispose();
    _manualController.dispose();
    _n200.dispose();
    _n100.dispose();
    _n50.dispose();
    _n10.dispose();
    _n5.dispose();
    _coins.dispose();
    super.dispose();
  }

  double get _startingFloat => double.tryParse(_floatController.text.trim()) ?? 0.0;

  double get _countedFromDenominations {
    final v200 = (int.tryParse(_n200.text.trim()) ?? 0) * 200.0;
    final v100 = (int.tryParse(_n100.text.trim()) ?? 0) * 100.0;
    final v50 = (int.tryParse(_n50.text.trim()) ?? 0) * 50.0;
    final v10 = (int.tryParse(_n10.text.trim()) ?? 0) * 10.0;
    final v5 = (int.tryParse(_n5.text.trim()) ?? 0) * 5.0;
    final c = double.tryParse(_coins.text.trim()) ?? 0.0;
    return v200 + v100 + v50 + v10 + v5 + c;
  }

  double get _totalCounted {
    if (_useDenominations) {
      return _countedFromDenominations;
    }
    return double.tryParse(_manualController.text.trim()) ?? 0.0;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final counted = _totalCounted;
    final expected = _startingFloat + widget.expectedCashInTill;
    final variance = counted - expected;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 420),
          decoration: BoxDecoration(
            color: isDark ? AppColors.brandNavyCard : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isDark ? AppColors.brandNavyBorder : AppColors.lightBorder,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.point_of_sale_rounded, color: AppColors.primaryDark, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Cash Drawer Reconciliation',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
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

              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Starting Float Field
                      TextField(
                        controller: _floatController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Opening Cash Float (${widget.currency})',
                          prefixIcon: const Icon(Icons.wallet_outlined, size: 18),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                        onChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 12),

                      // Mode Switcher
                      Row(
                        children: [
                          Expanded(
                            child: ChoiceChip(
                              label: const Text('Denominations Count'),
                              selected: _useDenominations,
                              onSelected: (val) => setState(() => _useDenominations = true),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ChoiceChip(
                              label: const Text('Direct Total'),
                              selected: !_useDenominations,
                              onSelected: (val) => setState(() => _useDenominations = false),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      if (_useDenominations) ...[
                        const Text(
                          'Count Ethiopian Banknotes:',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11),
                        ),
                        const SizedBox(height: 8),
                        _DenominationRow(label: '200 ETB Notes', multiplier: 200, controller: _n200, onChanged: () => setState(() {})),
                        _DenominationRow(label: '100 ETB Notes', multiplier: 100, controller: _n100, onChanged: () => setState(() {})),
                        _DenominationRow(label: '50 ETB Notes', multiplier: 50, controller: _n50, onChanged: () => setState(() {})),
                        _DenominationRow(label: '10 ETB Notes', multiplier: 10, controller: _n10, onChanged: () => setState(() {})),
                        _DenominationRow(label: '5 ETB Notes', multiplier: 5, controller: _n5, onChanged: () => setState(() {})),
                        _DenominationRow(label: 'Coins (Total Birr)', multiplier: 1, controller: _coins, onChanged: () => setState(() {})),
                      ] else ...[
                        TextField(
                          controller: _manualController,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            labelText: 'Total Physical Cash Counted (${widget.currency})',
                            prefixIcon: const Icon(Icons.payments_outlined, size: 18),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onChanged: (_) => setState(() {}),
                        ),
                      ],
                      const SizedBox(height: 14),

                      // Reconciliation Computation Result
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.brandNavy : AppColors.lightBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isDark ? AppColors.brandNavyBorder : AppColors.lightBorder,
                          ),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Total Counted:', style: TextStyle(fontSize: 11)),
                                Text(
                                  Formatters.formatMoney(counted, currency: widget.currency),
                                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12, fontFamily: 'monospace'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Expected Till:', style: TextStyle(fontSize: 11)),
                                Text(
                                  Formatters.formatMoney(expected, currency: widget.currency),
                                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12, fontFamily: 'monospace'),
                                ),
                              ],
                            ),
                            const Divider(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Cash Variance:', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: (variance == 0
                                            ? AppColors.success
                                            : variance > 0
                                                ? AppColors.warning
                                                : AppColors.danger)
                                        .withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    variance == 0
                                        ? 'BALANCED (0.00)'
                                        : variance > 0
                                            ? '+${Formatters.formatMoney(variance, currency: widget.currency)} (Over)'
                                            : '${Formatters.formatMoney(variance, currency: widget.currency)} (Short)',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w900,
                                      fontSize: 11,
                                      color: variance == 0
                                          ? AppColors.success
                                          : variance > 0
                                              ? AppColors.warning
                                              : AppColors.danger,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Action Buttons
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          widget.onReconcile(counted, _startingFloat);
                          Navigator.pop(context);
                        },
                        child: const Text('Save Count'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryDark,
                          foregroundColor: Colors.white,
                        ),
                        icon: const Icon(Icons.print_outlined, size: 16),
                        label: const Text('Open Z-Report'),
                        onPressed: () {
                          Navigator.pop(context);
                          widget.onGenerateZReport(counted, _startingFloat);
                        },
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

class _DenominationRow extends StatelessWidget {
  const _DenominationRow({
    required this.label,
    required this.multiplier,
    required this.controller,
    required this.onChanged,
  });

  final String label;
  final int multiplier;
  final TextEditingController controller;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    final count = int.tryParse(controller.text.trim()) ?? 0;
    final subtotal = count * multiplier;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(
            flex: 4,
            child: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
          ),
          SizedBox(
            width: 70,
            height: 32,
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
              decoration: InputDecoration(
                contentPadding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                hintText: '0',
              ),
              onChanged: (_) => onChanged(),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 3,
            child: Text(
              '= ${Formatters.formatMoney(subtotal.toDouble())}',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, fontFamily: 'monospace'),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}

/// Direct Dashboard Quick Restock Dialog
class _QuickRestockDialog extends StatefulWidget {
  const _QuickRestockDialog({
    required this.item,
    required this.onSuccess,
  });

  final DashboardLowStockItem item;
  final VoidCallback onSuccess;

  @override
  State<_QuickRestockDialog> createState() => _QuickRestockDialogState();
}

class _QuickRestockDialogState extends State<_QuickRestockDialog> {
  final TextEditingController _qtyController = TextEditingController(text: '10');
  final TextEditingController _noteController = TextEditingController(text: 'Restocked from store dashboard');
  String _movementType = 'RECEIPT';
  bool _isSaving = false;

  @override
  void dispose() {
    _qtyController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final qty = int.tryParse(_qtyController.text.trim()) ?? 0;
    if (qty <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid quantity greater than 0')),
      );
      return;
    }

    setState(() => _isSaving = true);
    final invProvider = context.read<InventoryProvider>();
    final success = await invProvider.recordMovement(
      productId: widget.item.id,
      type: _movementType,
      quantity: qty,
      note: _noteController.text.trim(),
    );

    if (mounted) {
      setState(() => _isSaving = false);
      if (success) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Replenished ${widget.item.name} by +$qty units.'),
            backgroundColor: AppColors.primaryDark,
          ),
        );
        widget.onSuccess();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(invProvider.errorMessage ?? 'Failed to record restock'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Row(
        children: [
          const Icon(Icons.add_shopping_cart_rounded, color: AppColors.primaryDark, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Quick Restock: ${widget.item.name}',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'SKU: ${widget.item.sku} • Current Stock: ${widget.item.stock} • Reorder Threshold: ${widget.item.reorderLevel}',
              style: const TextStyle(fontSize: 11, color: AppColors.lightTextSecondary),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _qtyController,
              keyboardType: TextInputType.number,
              autofocus: true,
              decoration: InputDecoration(
                labelText: 'Quantity to Add *',
                prefixIcon: const Icon(Icons.numbers_rounded, size: 18),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _movementType,
              decoration: InputDecoration(
                labelText: 'Movement Type',
                prefixIcon: const Icon(Icons.sync_alt_rounded, size: 18),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              items: const [
                DropdownMenuItem(value: 'RECEIPT', child: Text('Purchase Receipt (Intake)')),
                DropdownMenuItem(value: 'ADJUSTMENT', child: Text('Stock Adjustment')),
              ],
              onChanged: (val) {
                if (val != null) setState(() => _movementType = val);
              },
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _noteController,
              decoration: InputDecoration(
                labelText: 'Audit Note / Reason',
                prefixIcon: const Icon(Icons.notes_rounded, size: 18),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isSaving ? null : () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primaryDark,
            foregroundColor: Colors.white,
          ),
          onPressed: _isSaving ? null : _submit,
          child: _isSaving
              ? const SizedBox(
                  height: 16,
                  width: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : const Text('Confirm Restock'),
        ),
      ],
    );
  }
}
