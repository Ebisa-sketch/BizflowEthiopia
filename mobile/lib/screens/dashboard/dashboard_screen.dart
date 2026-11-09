import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/formatters.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/shift_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/metric_card.dart';
import '../../widgets/status_badge.dart';

class DashboardScreen extends StatefulWidget {
  final Function(int index)? onNavigateTab;
  final Function(String route)? onNavigateRoute;

  const DashboardScreen({
    super.key,
    this.onNavigateTab,
    this.onNavigateRoute,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DashboardProvider>().fetchMetrics();
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
    final user = auth.user;
    final metrics = dashboard.metrics;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Store Overview'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              dashboard.fetchMetrics();
              shift.fetchCurrentShift();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await dashboard.fetchMetrics();
          await shift.fetchCurrentShift();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Store Greeting Header Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0D9668), Color(0xFF065F46)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.25),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            user?.business?.name ?? 'BizFlow Store',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            user?.role ?? 'CASHIER',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Cashier / Staff: ${user?.name ?? "Staff"}',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        StatusBadge.shift(isOpen: shift.hasActiveShift),
                        const SizedBox(width: 8),
                        if (shift.hasActiveShift)
                          Text(
                            'Float: ${Formatters.formatMoney(shift.currentShift!.openingFloat)}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // KPI Grid
              const Text(
                'Today\'s Performance',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 10),

              dashboard.isLoading
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32),
                        child: CircularProgressIndicator(),
                      ),
                    )
                  : GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.15,
                      children: [
                        MetricCard(
                          title: 'Net Revenue',
                          value: Formatters.formatMoney(metrics.todayRevenue),
                          icon: Icons.trending_up_rounded,
                          iconColor: AppColors.primary,
                          subtitle: 'Today\'s sales',
                        ),
                        MetricCard(
                          title: 'Transactions',
                          value: '${metrics.todayTransactions}',
                          icon: Icons.receipt_long_rounded,
                          iconColor: AppColors.secondary,
                          subtitle: 'Completed sales',
                        ),
                        MetricCard(
                          title: 'Gross Profit',
                          value: Formatters.formatMoney(metrics.grossProfit),
                          icon: Icons.account_balance_wallet_rounded,
                          iconColor: AppColors.success,
                          subtitle: 'Estimated profit',
                        ),
                        MetricCard(
                          title: 'Low Stock Alert',
                          value: '${metrics.lowStockCount}',
                          icon: Icons.warning_amber_rounded,
                          iconColor: metrics.lowStockCount > 0 ? AppColors.danger : AppColors.success,
                          subtitle: 'Needs replenishment',
                        ),
                      ],
                    ),
              const SizedBox(height: 24),

              // Quick Actions (Full suite matching Web App)
              const Text(
                'Quick Store Actions',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 10),

              Row(
                children: [
                  Expanded(
                    child: _QuickActionButton(
                      title: 'New POS Sale',
                      icon: Icons.point_of_sale_rounded,
                      color: AppColors.primary,
                      onTap: () => _nav('pos', 0),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _QuickActionButton(
                      title: 'Sales History',
                      icon: Icons.receipt_long_rounded,
                      color: AppColors.secondary,
                      onTap: () => _nav('sales', 2),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _QuickActionButton(
                      title: 'Inventory & Stock',
                      icon: Icons.inventory_2_outlined,
                      color: const Color(0xFF0F766E),
                      onTap: () => _nav('products', 1),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _QuickActionButton(
                      title: 'Customer Credit',
                      icon: Icons.people_alt_rounded,
                      color: AppColors.warning,
                      onTap: () => _nav('customers', 0),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _QuickActionButton(
                      title: 'Operating Expenses',
                      icon: Icons.credit_card_off_rounded,
                      color: const Color(0xFFEF4444),
                      onTap: () => _nav('expenses', 4),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _QuickActionButton(
                      title: 'Reports & P&L',
                      icon: Icons.bar_chart_rounded,
                      color: const Color(0xFF8B5CF6),
                      onTap: () => _nav('reports', 3),
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
