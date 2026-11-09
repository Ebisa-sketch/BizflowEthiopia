import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/inventory_provider.dart';
import '../../providers/products_provider.dart';
import '../../theme/app_colors.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  String _selectedType = 'ALL';

  final List<String> _types = [
    'ALL',
    'INTAKE',
    'SALE',
    'DAMAGE',
    'RETURN',
    'ADJUSTMENT',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<InventoryProvider>().fetchMovements();
      context.read<ProductsProvider>().fetchProducts();
    });
  }

  void _showRecordAdjustmentDialog() {
    final productsProvider = context.read<ProductsProvider>();
    final products = productsProvider.products;
    if (products.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No products available to adjust.')),
      );
      return;
    }

    String selectedProductId = products.first.id;
    String selectedType = 'INTAKE';
    final qtyCtrl = TextEditingController(text: '1');
    final noteCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Record Stock Movement'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(labelText: 'Select Product *'),
                  initialValue: selectedProductId,
                  isExpanded: true,
                  items: products.map((p) {
                    return DropdownMenuItem(
                      value: p.id,
                      child: Text(
                        '${p.name} (Stock: ${p.stock})',
                        overflow: TextOverflow.ellipsis,
                      ),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setDialogState(() => selectedProductId = val);
                  },
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(labelText: 'Movement Type *'),
                  initialValue: selectedType,
                  items: const [
                    DropdownMenuItem(value: 'INTAKE', child: Text('INTAKE (Add Stock)')),
                    DropdownMenuItem(value: 'DAMAGE', child: Text('DAMAGE (Broken / Expired)')),
                    DropdownMenuItem(value: 'RETURN', child: Text('RETURN (Customer Return)')),
                    DropdownMenuItem(value: 'ADJUSTMENT', child: Text('ADJUSTMENT (Audit Correction)')),
                  ],
                  onChanged: (val) {
                    if (val != null) setDialogState(() => selectedType = val);
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: qtyCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Quantity *',
                    hintText: 'e.g. 10',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: noteCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Reason / Note',
                    hintText: 'e.g. Weekly supplier batch, broken bottle',
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                final qty = int.tryParse(qtyCtrl.text.trim()) ?? 0;
                if (qty <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please enter a valid quantity greater than 0')),
                  );
                  return;
                }
                Navigator.pop(ctx);
                final success = await context.read<InventoryProvider>().recordMovement(
                      productId: selectedProductId,
                      type: selectedType,
                      quantity: qty,
                      note: noteCtrl.text.trim(),
                    );
                if (mounted) {
                  // Refresh products too
                  context.read<ProductsProvider>().fetchProducts();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(success ? 'Stock adjustment recorded!' : 'Failed to record movement'),
                      backgroundColor: success ? AppColors.primary : AppColors.danger,
                    ),
                  );
                }
              },
              child: const Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }

  Color _getTypeColor(String type) {
    switch (type.toUpperCase()) {
      case 'INTAKE':
        return AppColors.success;
      case 'SALE':
        return AppColors.secondary;
      case 'DAMAGE':
        return AppColors.danger;
      case 'RETURN':
        return AppColors.warning;
      case 'ADJUSTMENT':
      default:
        return const Color(0xFF8B5CF6);
    }
  }

  @override
  Widget build(BuildContext context) {
    final invProvider = context.watch<InventoryProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final filtered = invProvider.movements.where((m) {
      if (_selectedType == 'ALL') return true;
      return m.type.toUpperCase() == _selectedType;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory & Stock Movements'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => invProvider.fetchMovements(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showRecordAdjustmentDialog,
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.tune_rounded, color: Colors.white),
        label: const Text('Adjust Stock', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: _types.map((type) {
                final isSelected = _selectedType == type;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(
                      type,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected ? Colors.white : null,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: _getTypeColor(type),
                    checkmarkColor: Colors.white,
                    onSelected: (_) => setState(() => _selectedType = type),
                  ),
                );
              }).toList(),
            ),
          ),

          // Header summary
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${filtered.length} stock log entries',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                ),
                Text(
                  'Live Inventory Audit',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),

          // Movements Timeline
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => invProvider.fetchMovements(),
              child: invProvider.isLoading && invProvider.movements.isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : filtered.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.history_rounded,
                                size: 56,
                                color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'No stock movements recorded',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Tap "Adjust Stock" to record intakes or damages',
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
                          itemCount: filtered.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final m = filtered[index];
                            final color = _getTypeColor(m.type);
                            final isPositive = m.type == 'INTAKE' || m.type == 'RETURN';
                            final dateStr = DateFormat('MMM dd, yyyy • hh:mm a').format(m.createdAt);

                            return Card(
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: color.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Icon(
                                        isPositive ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
                                        color: color,
                                        size: 20,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  m.productName,
                                                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                                                ),
                                              ),
                                              Text(
                                                '${isPositive ? '+' : '-'}${m.quantity}',
                                                style: TextStyle(
                                                  fontWeight: FontWeight.w800,
                                                  fontSize: 16,
                                                  color: color,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Row(
                                            children: [
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: color.withValues(alpha: 0.15),
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: Text(
                                                  m.type,
                                                  style: TextStyle(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.w700,
                                                    color: color,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              Text(
                                                dateStr,
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                                ),
                                              ),
                                            ],
                                          ),
                                          if (m.reason != null && m.reason!.isNotEmpty) ...[
                                            const SizedBox(height: 6),
                                            Text(
                                              'Note: ${m.reason}',
                                              style: TextStyle(
                                                fontSize: 11,
                                                fontStyle: FontStyle.italic,
                                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                              ),
                                            ),
                                          ],
                                          if (m.userName != null) ...[
                                            const SizedBox(height: 2),
                                            Text(
                                              'Recorded by: ${m.userName}',
                                              style: TextStyle(
                                                fontSize: 11,
                                                color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ),
        ],
      ),
    );
  }
}
