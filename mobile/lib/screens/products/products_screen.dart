import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/formatters.dart';
import '../../models/product.dart';
import '../../providers/products_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/status_badge.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductsProvider>().fetchProductsAndCategories();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _openRestockModal(Product product) {
    final qtyController = TextEditingController(text: '10');
    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Row(
                children: [
                  const Icon(Icons.local_shipping_rounded, color: AppColors.primary),
                  const SizedBox(width: 8),
                  const Text('Quick Restock', style: TextStyle(fontSize: 16)),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Current Stock: ${product.stock} units',
                    style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Units Received to Add',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: qtyController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(fontFamily: 'monospace', fontSize: 16, fontWeight: FontWeight.bold),
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.add_box_outlined),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [10, 25, 50].map((inc) {
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ActionChip(
                          label: Text('+$inc'),
                          onPressed: () {
                            setDialogState(() {
                              qtyController.text = '$inc';
                            });
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    final qty = int.tryParse(qtyController.text) ?? 0;
                    if (qty <= 0) return;
                    final productsProv = context.read<ProductsProvider>();
                    final messenger = ScaffoldMessenger.of(context);
                    Navigator.pop(ctx);
                    final success = await productsProv.quickRestock(product.id, qty);
                    if (!mounted) return;
                    if (success) {
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text('Restocked +$qty units for ${product.name}'),
                          backgroundColor: AppColors.primary,
                        ),
                      );
                    }
                  },
                  child: const Text('Receive Stock'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final productsProv = context.watch<ProductsProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory & Stock'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: productsProv.fetchProductsAndCategories,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              controller: _searchController,
              onChanged: productsProv.setSearchQuery,
              decoration: const InputDecoration(
                hintText: 'Search inventory...',
                prefixIcon: Icon(Icons.search_rounded, size: 20),
              ),
            ),
          ),

          // Stock Filter Chips
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: [
                _FilterPill(
                  label: 'All Items',
                  isSelected: productsProv.stockFilter == 'ALL',
                  onTap: () => productsProv.setStockFilter('ALL'),
                ),
                const SizedBox(width: 8),
                _FilterPill(
                  label: 'Low Stock',
                  isSelected: productsProv.stockFilter == 'LOW',
                  onTap: () => productsProv.setStockFilter('LOW'),
                  color: AppColors.warning,
                ),
                const SizedBox(width: 8),
                _FilterPill(
                  label: 'Out of Stock',
                  isSelected: productsProv.stockFilter == 'OUT',
                  onTap: () => productsProv.setStockFilter('OUT'),
                  color: AppColors.danger,
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Product List
          Expanded(
            child: productsProv.isLoading
                ? const Center(child: CircularProgressIndicator())
                : productsProv.filteredProducts.isEmpty
                    ? Center(
                        child: Text(
                          'No products match your filter',
                          style: TextStyle(
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        itemCount: productsProv.filteredProducts.length,
                        itemBuilder: (context, index) {
                          final p = productsProv.filteredProducts[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 10),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          p.name,
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            Text(
                                              p.sku ?? 'NO-SKU',
                                              style: TextStyle(
                                                fontSize: 11,
                                                fontFamily: 'monospace',
                                                color: isDark
                                                    ? AppColors.darkTextMuted
                                                    : AppColors.lightTextMuted,
                                              ),
                                            ),
                                            const SizedBox(width: 10),
                                            StatusBadge.stock(
                                              stock: p.stock,
                                              reorderLevel: p.reorderLevel,
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          Formatters.formatMoney(p.price),
                                          style: const TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w900,
                                            color: AppColors.primary,
                                            fontFamily: 'monospace',
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  IconButton.filledTonal(
                                    icon: const Icon(Icons.add_shopping_cart_rounded, size: 18),
                                    onPressed: () => _openRestockModal(p),
                                    tooltip: 'Quick Restock',
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
    );
  }
}

class _FilterPill extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final Color? color;

  const _FilterPill({
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final activeCol = color ?? AppColors.primary;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => onTap(),
      selectedColor: activeCol.withValues(alpha: 0.2),
      labelStyle: TextStyle(
        fontSize: 11,
        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
        color: isSelected ? activeCol : null,
      ),
    );
  }
}
