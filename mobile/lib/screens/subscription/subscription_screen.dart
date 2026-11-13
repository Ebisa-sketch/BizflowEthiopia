import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../theme/app_colors.dart';

class SubscriptionScreen extends StatelessWidget {
  const SubscriptionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Store Subscription & Plan')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Current Plan Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0D9668), Color(0xFF047857)],
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
                      const Text(
                        'CURRENT STORE PLAN',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.2,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.25),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          'ACTIVE',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    user?.business?.name ?? 'BizFlow Merchant',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Business Pro Edition • Multi-tenant Cloud POS',
                    style: TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Plan Features
            const Text(
              'Included Store Capabilities',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 10),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _FeatureTile(
                      icon: Icons.check_circle_rounded,
                      color: AppColors.success,
                      title: 'Unlimited POS Sales & Receipts',
                      subtitle:
                          'Fast touch keypad and custom tender calculations',
                    ),
                    const Divider(height: 16),
                    _FeatureTile(
                      icon: Icons.check_circle_rounded,
                      color: AppColors.success,
                      title: 'Ethiopian Digital Payments',
                      subtitle: 'Native Telebirr QR, CBE Birr & Bank Transfers',
                    ),
                    const Divider(height: 16),
                    _FeatureTile(
                      icon: Icons.check_circle_rounded,
                      color: AppColors.success,
                      title: 'Idda / Customer Credit Ledger',
                      subtitle:
                          'Record customer tab balances and partial repayments',
                    ),
                    const Divider(height: 16),
                    _FeatureTile(
                      icon: Icons.check_circle_rounded,
                      color: AppColors.success,
                      title: 'Realtime Multi-User Inventory',
                      subtitle: 'Track intakes, damages, adjustments and low-stock alerts',
                    ),
                    const Divider(height: 16),
                    _FeatureTile(
                      icon: Icons.check_circle_rounded,
                      color: AppColors.success,
                      title: 'Operational P&L Reports',
                      subtitle: 'COGS computation, gross margins & operating expense tracking',
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Need custom licensing
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const Icon(
                      Icons.support_agent_rounded,
                      size: 36,
                      color: AppColors.primary,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Multi-Branch & Enterprise Support',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'For additional branches, custom hardware integration, or fiscal printer support, reach out to BizFlow Ethiopia enterprise support.',
                      textAlign: TextAlign.center,
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
            ),
          ],
        ),
      ),
    );
  }
}

class _FeatureTile extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;

  const _FeatureTile({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
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
      ],
    );
  }
}
