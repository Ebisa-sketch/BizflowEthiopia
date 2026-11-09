import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  final Color? backgroundColor;

  const StatusBadge({
    super.key,
    required this.label,
    required this.color,
    this.backgroundColor,
  });

  factory StatusBadge.stock({required int stock, required int reorderLevel}) {
    if (stock <= 0) {
      return const StatusBadge(
        label: 'Out of Stock',
        color: AppColors.danger,
        backgroundColor: Color(0xFFFEE2E2),
      );
    } else if (stock <= reorderLevel) {
      return StatusBadge(
        label: 'Low Stock ($stock)',
        color: AppColors.warning,
        backgroundColor: const Color(0xFFFEF3C7),
      );
    } else {
      return StatusBadge(
        label: '$stock in stock',
        color: AppColors.success,
        backgroundColor: const Color(0xFFD1FAE5),
      );
    }
  }

  factory StatusBadge.shift({required bool isOpen}) {
    if (isOpen) {
      return const StatusBadge(
        label: 'Shift Active',
        color: AppColors.success,
        backgroundColor: Color(0xFFD1FAE5),
      );
    } else {
      return const StatusBadge(
        label: 'Shift Closed',
        color: AppColors.lightTextSecondary,
        backgroundColor: Color(0xFFF1F5F9),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = backgroundColor != null
        ? (isDark ? color.withValues(alpha: 0.2) : backgroundColor!)
        : color.withValues(alpha: 0.15);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}
