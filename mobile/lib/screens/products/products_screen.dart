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

  void _showAddProductDialog() {
    final nameCtrl = TextEditingController();
    final priceCtrl = TextEditingController();
    final costCtrl = TextEditingController();
    final stockCtrl = TextEditingController(text: '10');
    final minStockCtrl = TextEditingController(text: '5');
    final skuCtrl = TextEditingController();
    final barcodeCtrl = TextEditingController();
    final productsProv = context.read<ProductsProvider>();
    String? selectedCat = productsProv.categories.isNotEmpty
        ? productsProv.categories.first.id
        : null;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Add New Product'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Product Name *',
                    hintText: 'e.g. Injera Standard Pack',
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: priceCtrl,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                        ),
                        decoration: const InputDecoration(
                          labelText: 'Selling Price *',
                          prefixText: 'ETB ',
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: costCtrl,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                        ),
                        decoration: const InputDecoration(
                          labelText: 'Cost Price',
                          prefixText: 'ETB ',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: stockCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Initial Stock *',
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: minStockCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Min Alert Level',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                if (productsProv.categories.isNotEmpty)
                  DropdownButtonFormField<String>(
                    decoration: const InputDecoration(labelText: 'Category'),
                    initialValue: selectedCat,
                    items: productsProv.categories.map((c) {
                      return DropdownMenuItem(value: c.id, child: Text(c.name));
                    }).toList(),
                    onChanged: (val) => setDialogState(() => selectedCat = val),
                  ),
                const SizedBox(height: 10),
                TextField(
                  controller: skuCtrl,
                  decoration: const InputDecoration(
                    labelText: 'SKU Code (optional)',
                    hintText: 'e.g. INJ-001',
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: barcodeCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Barcode (optional)',
                    hintText: 'e.g. 600100200',
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
                final name = nameCtrl.text.trim();
                final price = double.tryParse(priceCtrl.text.trim()) ?? 0.0;
                final cost = double.tryParse(costCtrl.text.trim()) ?? 0.0;
                final stock = int.tryParse(stockCtrl.text.trim()) ?? 0;
                final minStock = int.tryParse(minStockCtrl.text.trim()) ?? 5;

                if (name.isEmpty || price <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Please enter valid product name and price',
                      ),
                    ),
                  );
                  return;
                }

                Navigator.pop(ctx);
                final success = await productsProv.createProduct(
                  name: name,
                  price: price,
                  cost: cost,
                  stock: stock,
                  minStock: minStock,
                  categoryId: selectedCat,
                  sku: skuCtrl.text.trim(),
                  barcode: barcodeCtrl.text.trim(),
                );

                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        success
                            ? 'Product "$name" added to catalog!'
                            : 'Failed to add product',
                      ),
                      backgroundColor: success
                          ? AppColors.primary
                          : AppColors.danger,
                    ),
                  );
                }
              },
              child: const Text('Add Product'),
            ),
          ],
        ),
      ),
    );
  }

  void _showEditProductDialog(Product p) {
    final nameCtrl = TextEditingController(text: p.name);
    final priceCtrl = TextEditingController(text: p.price.toStringAsFixed(2));
    final costCtrl = TextEditingController(text: p.cost.toStringAsFixed(2));
    final stockCtrl = TextEditingController(text: p.stock.toString());
    final minStockCtrl = TextEditingController(text: p.minStock.toString());
    final skuCtrl = TextEditingController(text: p.sku ?? '');
    final barcodeCtrl = TextEditingController(text: p.barcode ?? '');
    final productsProv = context.read<ProductsProvider>();
    String? selectedCat =
        p.categoryId ??
        (productsProv.categories.isNotEmpty
            ? productsProv.categories.first.id
            : null);

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text('Edit ${p.name}'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Product Name *',
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: priceCtrl,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                        ),
                        decoration: const InputDecoration(
                          labelText: 'Selling Price *',
                          prefixText: 'ETB ',
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: costCtrl,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                        ),
                        decoration: const InputDecoration(
                          labelText: 'Cost Price',
                          prefixText: 'ETB ',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: stockCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Stock Units',
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: minStockCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Min Alert',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                if (productsProv.categories.isNotEmpty)
                  DropdownButtonFormField<String>(
                    decoration: const InputDecoration(labelText: 'Category'),
                    initialValue: selectedCat,
                    items: productsProv.categories.map((c) {
                      return DropdownMenuItem(value: c.id, child: Text(c.name));
                    }).toList(),
                    onChanged: (val) => setDialogState(() => selectedCat = val),
                  ),
                const SizedBox(height: 10),
                TextField(
                  controller: skuCtrl,
                  decoration: const InputDecoration(labelText: 'SKU Code'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: barcodeCtrl,
                  decoration: const InputDecoration(labelText: 'Barcode'),
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
                final name = nameCtrl.text.trim();
                final price = double.tryParse(priceCtrl.text.trim()) ?? p.price;
                final cost = double.tryParse(costCtrl.text.trim()) ?? p.cost;
                final stock = int.tryParse(stockCtrl.text.trim()) ?? p.stock;
                final minStock =
                    int.tryParse(minStockCtrl.text.trim()) ?? p.minStock;

                Navigator.pop(ctx);
                final success = await productsProv.updateProduct(
                  id: p.id,
                  name: name,
                  price: price,
                  cost: cost,
                  stock: stock,
                  minStock: minStock,
                  categoryId: selectedCat,
                  sku: skuCtrl.text.trim(),
                  barcode: barcodeCtrl.text.trim(),
                );

                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        success
                            ? 'Product updated successfully!'
                            : 'Failed to update product',
                      ),
                      backgroundColor: success
                          ? AppColors.primary
                          : AppColors.danger,
                    ),
                  );
                }
              },
              child: const Text('Save Changes'),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDeleteProduct(Product p) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Product'),
        content: Text(
          'Are you sure you want to delete "${p.name}"? This removes it from POS sales and inventory.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await context
                  .read<ProductsProvider>()
                  .deleteProduct(p.id);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      success ? 'Product removed!' : 'Failed to delete product',
                    ),
                    backgroundColor: success
                        ? AppColors.primary
                        : AppColors.danger,
                  ),
                );
              }
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _openRestockModal(Product product) {
    final qtyController = TextEditingController(text: '10');
    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              title: const Row(
                children: [
                  Icon(Icons.local_shipping_rounded, color: AppColors.primary),
                  SizedBox(width: 8),
                  Text('Quick Restock', style: TextStyle(fontSize: 16)),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Current Stock: ${product.stock} units',
                    style: const TextStyle(
                      fontSize: 12,
                      fontFamily: 'monospace',
                    ),
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
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
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
                    Navigator.pop(ctx);
                    final prov = context.read<ProductsProvider>();
                    final messenger = ScaffoldMessenger.of(context);
                    final success = await prov.quickRestock(product.id, qty);
                    if (mounted) {
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text(
                            success
                                ? 'Restocked +$qty units!'
                                : 'Failed to restock',
                          ),
                          backgroundColor: success
                              ? AppColors.primary
                              : AppColors.danger,
                        ),
                      );
                    }
                  },
                  child: const Text('Confirm Restock'),
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
        title: const Text('Products & Stock Catalog'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_box_rounded),
            tooltip: 'Add Product',
            onPressed: _showAddProductDialog,
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: productsProv.fetchProductsAndCategories,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddProductDialog,
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add_rounded, color: Color(0xFF071924)),
        label: const Text(
          'New Product',
          style: TextStyle(
            color: Color(0xFF071924),
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      body: Column(
        children: [
          // Search Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              controller: _searchController,
              onChanged: productsProv.setSearchQuery,
              decoration: const InputDecoration(
                hintText: 'Search products by name, SKU, or barcode...',
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
                  label: 'All Items (${productsProv.products.length})',
                  isSelected: productsProv.stockFilter == 'ALL',
                  onTap: () => productsProv.setStockFilter('ALL'),
                ),
                const SizedBox(width: 8),
                _FilterPill(
                  label:
                      'Low Stock (${productsProv.products.where((p) => p.isLowStock).length})',
                  isSelected: productsProv.stockFilter == 'LOW',
                  onTap: () => productsProv.setStockFilter('LOW'),
                  color: AppColors.warning,
                ),
                const SizedBox(width: 8),
                _FilterPill(
                  label:
                      'Out (${productsProv.products.where((p) => p.isOutOfStock).length})',
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
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.inventory_2_outlined,
                          size: 48,
                          color: isDark
                              ? AppColors.darkTextMuted
                              : AppColors.lightTextMuted,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'No products match your filter',
                          style: TextStyle(
                            color: isDark
                                ? AppColors.darkTextSecondary
                                : AppColors.lightTextSecondary,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 6,
                    ),
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
                                          Formatters.formatMoney(p.price),
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w800,
                                            color: AppColors.primary,
                                            fontFamily: 'monospace',
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        if (p.category != null)
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 6,
                                              vertical: 2,
                                            ),
                                            decoration: BoxDecoration(
                                              color: isDark
                                                  ? AppColors.brandNavyBorder
                                                  : AppColors.lightBorder,
                                              borderRadius:
                                                  BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              p.category!.name,
                                              style: const TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ),
                                      ],
                                    ),
                                    if (p.sku != null && p.sku!.isNotEmpty) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        'SKU: ${p.sku}',
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: isDark
                                              ? AppColors.darkTextMuted
                                              : AppColors.lightTextMuted,
                                          fontFamily: 'monospace',
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  StatusBadge.stock(
                                    stock: p.stock,
                                    reorderLevel: p.reorderLevel,
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      InkWell(
                                        onTap: () => _openRestockModal(p),
                                        borderRadius: BorderRadius.circular(8),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 4,
                                          ),
                                          decoration: BoxDecoration(
                                            color: AppColors.primary.withValues(
                                              alpha: 0.15,
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              8,
                                            ),
                                          ),
                                          child: const Row(
                                            children: [
                                              Icon(
                                                Icons.add_rounded,
                                                size: 14,
                                                color: AppColors.primary,
                                              ),
                                              SizedBox(width: 2),
                                              Text(
                                                'Restock',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.bold,
                                                  color: AppColors.primary,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                      PopupMenuButton<String>(
                                        onSelected: (val) {
                                          if (val == 'edit') {
                                            _showEditProductDialog(p);
                                          }
                                          if (val == 'delete') {
                                            _confirmDeleteProduct(p);
                                          }
                                        },
                                        itemBuilder: (_) => [
                                          const PopupMenuItem(
                                            value: 'edit',
                                            child: Row(
                                              children: [
                                                Icon(
                                                  Icons.edit_outlined,
                                                  size: 18,
                                                ),
                                                SizedBox(width: 8),
                                                Text('Edit Details'),
                                              ],
                                            ),
                                          ),
                                          const PopupMenuItem(
                                            value: 'delete',
                                            child: Row(
                                              children: [
                                                Icon(
                                                  Icons.delete_outline,
                                                  size: 18,
                                                  color: AppColors.danger,
                                                ),
                                                SizedBox(width: 8),
                                                Text(
                                                  'Delete Product',
                                                  style: TextStyle(
                                                    color: AppColors.danger,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ],
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
    final activeColor = color ?? AppColors.primary;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? activeColor.withValues(alpha: 0.2)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? activeColor : Theme.of(context).dividerColor,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
            color: isSelected ? activeColor : null,
          ),
        ),
      ),
    );
  }
}
