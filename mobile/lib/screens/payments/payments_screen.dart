import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/formatters.dart';
import '../../providers/reports_provider.dart';
import '../../providers/shift_provider.dart';
import '../../theme/app_colors.dart';

class PaymentsScreen extends StatefulWidget {
  const PaymentsScreen({super.key});

  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReportsProvider>().fetchReport();
      context.read<ShiftProvider>().fetchCurrentShift();
    });
  }

  Color _getMethodColor(String method) {
    switch (method.toUpperCase()) {
      case 'TELEBIRR':
        return AppColors.telebirr;
      case 'CBE_BIRR':
        return AppColors.cbeBirr;
      case 'CASH':
        return AppColors.cash;
      case 'BANK_TRANSFER':
        return AppColors.secondary;
      case 'CREDIT':
        return AppColors.warning;
      default:
        return const Color(0xFF64748B);
    }
  }

  IconData _getMethodIcon(String method) {
    switch (method.toUpperCase()) {
      case 'TELEBIRR':
        return Icons.phone_android_rounded;
      case 'CBE_BIRR':
        return Icons.account_balance_rounded;
      case 'CASH':
        return Icons.payments_rounded;
      case 'BANK_TRANSFER':
        return Icons.account_balance_wallet_rounded;
      case 'CREDIT':
        return Icons.credit_score_rounded;
      default:
        return Icons.payment_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final reportsProvider = context.watch<ReportsProvider>();
    final shiftProvider = context.watch<ShiftProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final breakdown = reportsProvider.report.paymentBreakdown;
    final total = reportsProvider.report.totalRevenue;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Payments & Till Reconciliation'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              reportsProvider.fetchReport();
              shiftProvider.fetchCurrentShift();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await reportsProvider.fetchReport();
          await shiftProvider.fetchCurrentShift();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Register / Till Shift Status
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: shiftProvider.hasActiveShift
                      ? AppColors.primary.withValues(alpha: 0.12)
                      : AppColors.warning.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: shiftProvider.hasActiveShift
                        ? AppColors.primary.withValues(alpha: 0.3)
                        : AppColors.warning.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      shiftProvider.hasActiveShift
                          ? Icons.check_circle_rounded
                          : Icons.info_outline_rounded,
                      color: shiftProvider.hasActiveShift
                          ? AppColors.primary
                          : AppColors.warning,
                      size: 28,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            shiftProvider.hasActiveShift
                                ? 'Active Cash Register Shift'
                                : 'Register Shift Closed',
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            shiftProvider.hasActiveShift
                                ? 'Opening float: ${Formatters.formatMoney(shiftProvider.currentShift!.openingFloat)}'
                                : 'Start a shift in the Shift tab to track cash drawer balance',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // Total Collections Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0F766E), Color(0xFF115E59)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0F766E).withValues(alpha: 0.3),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Total Digital & Cash Collections',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      Formatters.formatMoney(total),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Aggregated over ${breakdown.length} active payment channels',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Section Title
              const Text(
                'Payment Channels Breakdown',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 10),

              if (breakdown.isEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Center(
                      child: Column(
                        children: [
                          Icon(
                            Icons.payment_rounded,
                            size: 48,
                            color: isDark
                                ? AppColors.darkTextMuted
                                : AppColors.lightTextMuted,
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'No payments recorded for this period',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              else
                ...breakdown.entries.map((entry) {
                  final method = entry.key;
                  final amount = entry.value;
                  final color = _getMethodColor(method);
                  final icon = _getMethodIcon(method);
                  final ratio = total > 0
                      ? (amount / total).clamp(0.0, 1.0)
                      : 0.0;
                  final percentStr = (ratio * 100).toStringAsFixed(1);

                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: color.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(icon, color: color, size: 22),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      method.replaceAll('_', ' '),
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 14,
                                      ),
                                    ),
                                    Text(
                                      '$percentStr% of total payments',
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
                                Formatters.formatMoney(amount),
                                style: TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 16,
                                  color: color,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: ratio,
                              minHeight: 8,
                              backgroundColor: isDark
                                  ? AppColors.darkBorder
                                  : AppColors.lightBorder,
                              valueColor: AlwaysStoppedAnimation(color),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
            ],
          ),
        ),
      ),
    );
  }
}
