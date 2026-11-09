import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class TouchKeypad extends StatelessWidget {
  final Function(String digit) onDigitPress;
  final VoidCallback onBackspace;
  final VoidCallback onClear;
  final VoidCallback onExact;
  final Function(int amount) onQuickAdd;

  const TouchKeypad({
    super.key,
    required this.onDigitPress,
    required this.onBackspace,
    required this.onClear,
    required this.onExact,
    required this.onQuickAdd,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final btnBg = isDark ? AppColors.darkCard : Colors.white;
    final btnBorder = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textCol = isDark ? Colors.white : AppColors.lightTextPrimary;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Quick Add Chips
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
          child: Row(
            children: [
              Expanded(
                child: _QuickAddChip(
                  label: '+50 ETB',
                  onTap: () => onQuickAdd(50),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: _QuickAddChip(
                  label: '+100 ETB',
                  onTap: () => onQuickAdd(100),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: _QuickAddChip(
                  label: '+200 ETB',
                  onTap: () => onQuickAdd(200),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: _QuickAddChip(
                  label: 'Exact',
                  isHighlight: true,
                  onTap: onExact,
                ),
              ),
            ],
          ),
        ),

        // 4x4 Grid
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 3,
          childAspectRatio: 1.8,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
          children: [
            _KeypadButton(text: '1', onTap: () => onDigitPress('1'), bg: btnBg, border: btnBorder, textCol: textCol),
            _KeypadButton(text: '2', onTap: () => onDigitPress('2'), bg: btnBg, border: btnBorder, textCol: textCol),
            _KeypadButton(text: '3', onTap: () => onDigitPress('3'), bg: btnBg, border: btnBorder, textCol: textCol),
            _KeypadButton(text: '4', onTap: () => onDigitPress('4'), bg: btnBg, border: btnBorder, textCol: textCol),
            _KeypadButton(text: '5', onTap: () => onDigitPress('5'), bg: btnBg, border: btnBorder, textCol: textCol),
            _KeypadButton(text: '6', onTap: () => onDigitPress('6'), bg: btnBg, border: btnBorder, textCol: textCol),
            _KeypadButton(text: '7', onTap: () => onDigitPress('7'), bg: btnBg, border: btnBorder, textCol: textCol),
            _KeypadButton(text: '8', onTap: () => onDigitPress('8'), bg: btnBg, border: btnBorder, textCol: textCol),
            _KeypadButton(text: '9', onTap: () => onDigitPress('9'), bg: btnBg, border: btnBorder, textCol: textCol),
            _KeypadButton(
              text: 'C',
              onTap: onClear,
              bg: isDark ? AppColors.darkSurface : const Color(0xFFFEE2E2),
              border: isDark ? AppColors.darkBorder : const Color(0xFFFECACA),
              textCol: AppColors.danger,
              isBold: true,
            ),
            _KeypadButton(text: '0', onTap: () => onDigitPress('0'), bg: btnBg, border: btnBorder, textCol: textCol),
            _KeypadButton(
              text: '⌫',
              onTap: onBackspace,
              bg: btnBg,
              border: btnBorder,
              textCol: textCol,
              isBold: true,
            ),
          ],
        ),
      ],
    );
  }
}

class _QuickAddChip extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final bool isHighlight;

  const _QuickAddChip({
    required this.label,
    required this.onTap,
    this.isHighlight = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: isHighlight
          ? AppColors.primary
          : (isDark ? AppColors.darkSurface : AppColors.lightSurface),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(
          color: isHighlight
              ? AppColors.primary
              : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: isHighlight
                    ? Colors.white
                    : (isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _KeypadButton extends StatelessWidget {
  final String text;
  final VoidCallback onTap;
  final Color bg;
  final Color border;
  final Color textCol;
  final bool isBold;

  const _KeypadButton({
    required this.text,
    required this.onTap,
    required this.bg,
    required this.border,
    required this.textCol,
    this.isBold = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: bg,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: border, width: 1),
      ),
      elevation: 0,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Center(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 18,
              fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
              color: textCol,
              fontFamily: 'monospace',
            ),
          ),
        ),
      ),
    );
  }
}
