import 'package:flutter/foundation.dart' show listEquals;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../core/formatters.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/shift_provider.dart';
import '../../theme/app_colors.dart';

class DashboardScreen extends StatefulWidget {
  final Function(int index)? onNavigateTab;
  final Function(String route)? onNavigateRoute;

  const DashboardScreen({super.key, this.onNavigateTab, this.onNavigateRoute});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _selectedRange = '7d';

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

    return Scaffold(
      appBar: AppBar(
        title: const Text('Store Overview'),
        actions: [
          IconButton(
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
                businessName: user?.business?.name ?? 'BizFlow Ethiopia',
                eatNow: eatNow,
                shift: shift,
                currency: currency,
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

              // KPI Grid
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
                      onTap: () => _nav('inventory', 1),
                    ),
                  ],
                ),
              const SizedBox(height: 12),
              _QuickActionsSection(
                onNavigate: (route) {
                  final legacyIndex = switch (route) {
                    'sales' => 2,
                    'products' => 1,
                    'expenses' => 4,
                    'reports' => 3,
                    _ => 0,
                  };
                  _nav(route, legacyIndex);
                },
              ),
              if (dashboard.errorMessage != null) ...[
                const SizedBox(height: 8),
                Card(
                  color: AppColors.danger.withValues(alpha: 0.08),
                  child: ListTile(
                    leading: const Icon(
                      Icons.error_outline,
                      color: AppColors.danger,
                    ),
                    title: const Text('Dashboard data could not be loaded'),
                    subtitle: Text(dashboard.errorMessage!),
                    trailing: IconButton(
                      tooltip: 'Retry',
                      onPressed: () => dashboard.fetchMetrics(_selectedRange),
                      icon: const Icon(Icons.refresh),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 12),
              _FinancialSummary(metrics: metrics, currency: currency),
              const SizedBox(height: 16),
              _SalesTrendCard(
                points: metrics.chartData,
                totalRevenue: metrics.todayRevenue,
                range: _selectedRange,
                currency: currency,
              ),
              const SizedBox(height: 16),
              _DashboardDetailsCard(
                metrics: metrics,
                onNavigate: (route) => _nav(route, 0),
                currency: currency,
              ),
              const SizedBox(height: 24),

              // Low Stock Alert Feed (Matching Web Dashboard)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(
                        Icons.warning_amber_rounded,
                        color: AppColors.warning,
                        size: 20,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Inventory Alerts',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: () => _nav('inventory', 1),
                    child: const Text('View All'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              if (lowStockItems.isEmpty)
                const Card(
                  child: ListTile(
                    leading: Icon(
                      Icons.check_circle_outline,
                      color: AppColors.success,
                    ),
                    title: Text('Inventory levels healthy'),
                    subtitle: Text(
                      'All products meet or exceed their restock thresholds.',
                    ),
                  ),
                )
              else ...[
                Card(
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: lowStockItems.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final item = lowStockItems[index];
                      return ListTile(
                        title: Text(
                          item.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                        subtitle: Text(
                          'SKU: ${item.sku} • Alert below ${item.reorderLevel} units',
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
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color:
                                    (item.isOut
                                            ? AppColors.danger
                                            : AppColors.warning)
                                        .withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                item.isOut
                                    ? 'OUT OF STOCK'
                                    : '${item.stock} left',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: item.isOut
                                      ? AppColors.danger
                                      : AppColors.warning,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
              const SizedBox(height: 24),

              // Recent Sales Transactions Feed (Matching Web Dashboard)
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
                        'For ${_dateRanges[_selectedRange]?.toLowerCase()}',
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark
                              ? AppColors.darkTextSecondary
                              : AppColors.lightTextSecondary,
                        ),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: () => _nav('sales', 2),
                    child: const Text('View All Sales'),
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

                      return ListTile(
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
                            Text(
                              sale.status,
                              style: const TextStyle(fontSize: 10),
                            ),
                          ],
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
  });

  final String greeting;
  final String name;
  final String role;
  final String businessName;
  final DateTime eatNow;
  final ShiftProvider shift;
  final String currency;

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

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  height: 42,
                  width: 42,
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(13),
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
                      Text(
                        '$greeting, $displayName!',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: primary,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      Text(
                        businessName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12, color: secondary),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    role.toUpperCase(),
                    style:
                        const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                        ).copyWith(
                          color: isDark
                              ? AppColors.primary
                              : AppColors.primaryDark,
                        ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.calendar_today_outlined,
                      size: 13,
                      color: secondary,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      '${DateFormat('EEE, d MMM yyyy').format(eatNow)} · ${DateFormat('h:mm a').format(eatNow)} EAT',
                      style: TextStyle(fontSize: 11, color: secondary),
                    ),
                  ],
                ),
                _DashboardStatusPill(
                  label: shift.hasActiveShift
                      ? 'Shift Open'
                      : 'No Active Shift',
                  color: shift.hasActiveShift
                      ? AppColors.success
                      : AppColors.warning,
                ),
                if (shift.hasActiveShift)
                  Text(
                    'Float ${Formatters.formatMoney(shift.currentShift!.openingFloat, currency: currency)}',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: secondary,
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
      'today' => 'Today · EAT',
      '7d' => 'Last 7 days',
      '30d' => 'Last 30 days',
      'month' => 'This calendar month',
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
                Icon(
                  Icons.calendar_month_outlined,
                  size: 16,
                  color: AppColors.primaryDark,
                ),
                const SizedBox(width: 7),
                Text(
                  'Overview Period',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: isDark
                        ? AppColors.darkTextPrimary
                        : AppColors.lightTextPrimary,
                  ),
                ),
                const Spacer(),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary,
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
                            horizontal: 12,
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
          padding: const EdgeInsets.all(13),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    height: 30,
                    width: 30,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(9),
                    ),
                    child: Icon(icon, size: 16, color: color),
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
                    size: 17,
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
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: textColor,
                  fontFamily: 'monospace',
                ),
              ),
              if (note != null && comparison != null) ...[
                const SizedBox(height: 2),
                Text(
                  note!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: color,
                  ),
                ),
              ],
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: comparison == null
                        ? Text(
                            note ?? '',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 9,
                              color: comparisonColor,
                              fontWeight: FontWeight.w700,
                            ),
                          )
                        : Row(
                            children: [
                              Icon(
                                comparisonIcon,
                                size: 12,
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
                      height: 20,
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

class _MetricSparklinePainter extends CustomPainter {
  const _MetricSparklinePainter(this.values, this.color);

  final List<double> values;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final points = values.where((value) => value.isFinite).toList();
    if (points.isEmpty) return;
    final minValue = points.reduce((a, b) => a < b ? a : b);
    final maxValue = points.reduce((a, b) => a > b ? a : b);
    final valueRange = maxValue - minValue;
    final path = Path();
    for (var index = 0; index < points.length; index++) {
      final x = points.length == 1
          ? size.width / 2
          : size.width * index / (points.length - 1);
      final y = valueRange == 0
          ? size.height / 2
          : size.height * (1 - (points[index] - minValue) / valueRange);
      if (index == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..strokeWidth = 2
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );
    if (points.length == 1) {
      canvas.drawCircle(
        Offset(size.width / 2, size.height / 2),
        2,
        Paint()..color = color,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _MetricSparklinePainter oldDelegate) {
    return !listEquals(oldDelegate.values, values) ||
        oldDelegate.color != color;
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
        const SizedBox(height: 6),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 8,
          mainAxisSpacing: 4,
          childAspectRatio: 2.05,
          children: [
            _QuickActionButton(
              title: 'New POS Sale',
              icon: Icons.point_of_sale_rounded,
              color: AppColors.primaryDark,
              onTap: () => onNavigate('pos'),
            ),
            _QuickActionButton(
              title: 'Sales History',
              icon: Icons.receipt_long_rounded,
              color: AppColors.secondary,
              onTap: () => onNavigate('sales'),
            ),
            _QuickActionButton(
              title: 'Products & Catalog',
              icon: Icons.inventory_2_outlined,
              color: const Color(0xFF0F766E),
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
              icon: Icons.credit_card_off_rounded,
              color: AppColors.danger,
              onTap: () => onNavigate('expenses'),
            ),
            _QuickActionButton(
              title: 'Reports & P&L',
              icon: Icons.bar_chart_rounded,
              color: const Color(0xFF8B5CF6),
              onTap: () => onNavigate('reports'),
            ),
          ],
        ),
      ],
    );
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
            const Text(
              'Financial Summary',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
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
                  label: 'Cost of Goods Sold',
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
                  color: AppColors.primary,
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
              Text(
                'Cash ${Formatters.formatMoney(metrics.cashCollected, currency: currency)}'
                '  •  Digital ${Formatters.formatMoney(metrics.digitalCollected, currency: currency)}',
                style: Theme.of(context).textTheme.bodySmall,
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
          Icon(icon, size: 18, color: color),
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

class _SalesTrendCard extends StatelessWidget {
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
  Widget build(BuildContext context) {
    final visiblePoints = points.length <= 7
        ? points
        : List<DashboardChartPoint>.generate(
            7,
            (index) => points[(index * (points.length - 1) / 6).round()],
          );
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Sales Trend',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                ),
                Text(
                  Formatters.formatMoney(totalRevenue, currency: currency),
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '${range == 'month' ? 'This month' : _rangeLabel(range)} • Revenue and gross profit',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 16),
            if (visiblePoints.isEmpty)
              const SizedBox(
                height: 130,
                child: Center(child: Text('No sales trend data available')),
              )
            else ...[
              SizedBox(
                height: 130,
                width: double.infinity,
                child: CustomPaint(painter: _SalesTrendPainter(visiblePoints)),
              ),
              const SizedBox(height: 8),
              Row(
                children: visiblePoints
                    .map(
                      (point) => Expanded(
                        child: Text(
                          point.day,
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 9),
                        ),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 12),
              const Row(
                children: [
                  _ChartLegend(color: AppColors.primary, label: 'Sales'),
                  SizedBox(width: 16),
                  _ChartLegend(color: AppColors.secondary, label: 'Profit'),
                ],
              ),
            ],
          ],
        ),
      ),
    );
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
        Text(label, style: const TextStyle(fontSize: 10)),
      ],
    );
  }
}

class _SalesTrendPainter extends CustomPainter {
  _SalesTrendPainter(this.points);

  final List<DashboardChartPoint> points;

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;
    const horizontalInset = 6.0;
    const verticalInset = 10.0;
    final graphWidth = size.width - horizontalInset * 2;
    final graphHeight = size.height - verticalInset * 2;
    final maxValue = points.fold<double>(
      0,
      (max, point) =>
          [max, point.amount, point.profit].reduce((a, b) => a > b ? a : b),
    );
    final scaleMax = maxValue <= 0 ? 1.0 : maxValue;
    final gridPaint = Paint()
      ..color = Colors.grey.withValues(alpha: 0.18)
      ..strokeWidth = 1;
    for (var index = 0; index < 4; index++) {
      final y = verticalInset + graphHeight * index / 3;
      canvas.drawLine(
        Offset(horizontalInset, y),
        Offset(size.width - horizontalInset, y),
        gridPaint,
      );
    }

    void drawSeries(double Function(DashboardChartPoint) value, Color color) {
      final path = Path();
      final pointPaint = Paint()
        ..color = color
        ..style = PaintingStyle.fill;
      final linePaint = Paint()
        ..color = color
        ..strokeWidth = 2.5
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round;
      for (var index = 0; index < points.length; index++) {
        final x = points.length == 1
            ? size.width / 2
            : horizontalInset + graphWidth * index / (points.length - 1);
        final y =
            verticalInset + graphHeight * (1 - value(points[index]) / scaleMax);
        if (index == 0) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
        canvas.drawCircle(Offset(x, y), 3.5, pointPaint);
      }
      canvas.drawPath(path, linePaint);
    }

    drawSeries((point) => point.amount, AppColors.primary);
    drawSeries((point) => point.profit, AppColors.secondary);
  }

  @override
  bool shouldRepaint(covariant _SalesTrendPainter oldDelegate) {
    return oldDelegate.points != points;
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
              'Quick Stats',
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
                'Payment Methods',
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
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
              textAlign: TextAlign.end,
            ),
          ],
        ),
      ),
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
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const Icon(Icons.arrow_forward_ios_rounded, size: 12),
            ],
          ),
        ),
      ),
    );
  }
}
