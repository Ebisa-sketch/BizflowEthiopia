import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/formatters.dart';
import '../../providers/shift_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/status_badge.dart';

class ShiftScreen extends StatefulWidget {
  const ShiftScreen({super.key});

  @override
  State<ShiftScreen> createState() => _ShiftScreenState();
}

class _ShiftScreenState extends State<ShiftScreen> {
  final _floatController = TextEditingController(text: '500');
  final _closingCashController = TextEditingController();
  final _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ShiftProvider>().fetchCurrentShift();
    });
  }

  @override
  void dispose() {
    _floatController.dispose();
    _closingCashController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _handleOpenShift() async {
    final float = double.tryParse(_floatController.text) ?? 0.0;
    final shift = context.read<ShiftProvider>();
    final success = await shift.openShift(float);

    if (!mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Shift opened successfully! Happy selling.'),
          backgroundColor: AppColors.primary,
        ),
      );
    } else if (shift.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(shift.errorMessage!), backgroundColor: AppColors.danger),
      );
    }
  }

  Future<void> _handleCloseShift() async {
    final actual = double.tryParse(_closingCashController.text);
    if (actual == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please count and enter actual closing cash in drawer')),
      );
      return;
    }

    final shift = context.read<ShiftProvider>();
    final success = await shift.closeShift(actual, notes: _notesController.text.trim());

    if (!mounted) return;
    if (success) {
      _closingCashController.clear();
      _notesController.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Shift closed & reconciled successfully.'),
          backgroundColor: AppColors.primary,
        ),
      );
    } else if (shift.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(shift.errorMessage!), backgroundColor: AppColors.danger),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final shiftProv = context.watch<ShiftProvider>();
    final shift = shiftProv.currentShift;
    final isOpen = shiftProv.hasActiveShift;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Register Shift'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: shiftProv.fetchCurrentShift,
          ),
        ],
      ),
      body: shiftProv.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Status Header Card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Register Shift Status',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                ),
                              ),
                              StatusBadge.shift(isOpen: isOpen),
                            ],
                          ),
                          const SizedBox(height: 12),
                          if (isOpen && shift != null) ...[
                            Text(
                              'Started: ${Formatters.formatDateTime(shift.startTime)}',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Opening Cash Float: ${Formatters.formatMoney(shift.openingFloat)}',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primary,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ] else ...[
                            Text(
                              'No active shift currently open. Open a shift before taking cash sales.',
                              style: TextStyle(
                                fontSize: 13,
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Open Shift Form (if closed)
                  if (!isOpen) ...[
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Text(
                              'Open New Shift',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Enter the starting cash amount in your register drawer.',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Opening Float Amount (ETB)',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 6),
                            TextField(
                              controller: _floatController,
                              keyboardType: TextInputType.number,
                              style: const TextStyle(
                                fontFamily: 'monospace',
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                              decoration: const InputDecoration(
                                prefixIcon: Icon(Icons.money_rounded),
                              ),
                            ),
                            const SizedBox(height: 18),
                            ElevatedButton(
                              onPressed: shiftProv.isLoading ? null : _handleOpenShift,
                              child: const Text('Open Shift & Start Selling'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ] else ...[
                    // Close Shift Form (if open)
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Text(
                              'End & Reconcile Shift',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Count all physical cash in your drawer at end of day and record below.',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Actual Counted Cash (ETB) *',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 6),
                            TextField(
                              controller: _closingCashController,
                              keyboardType: TextInputType.number,
                              style: const TextStyle(
                                fontFamily: 'monospace',
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                              decoration: const InputDecoration(
                                prefixIcon: Icon(Icons.point_of_sale_rounded),
                                hintText: '0.00',
                              ),
                            ),
                            const SizedBox(height: 14),
                            const Text(
                              'Closing Notes / Discrepancy Reason (Optional)',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 6),
                            TextField(
                              controller: _notesController,
                              maxLines: 2,
                              decoration: const InputDecoration(
                                hintText: 'e.g. Returned 20 ETB change to customer Ato Solomon...',
                              ),
                            ),
                            const SizedBox(height: 18),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.danger,
                              ),
                              onPressed: shiftProv.isLoading ? null : _handleCloseShift,
                              child: const Text('Close Shift & Submit Reconciliation'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }
}

