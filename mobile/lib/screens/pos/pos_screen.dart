import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/formatters.dart';
import '../../models/product.dart';
import '../../providers/customers_provider.dart';
import '../../providers/pos_provider.dart';
import '../../providers/products_provider.dart';
import '../../providers/shift_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/status_badge.dart';
import 'checkout_modal.dart';

class PosScreen extends StatefulWidget {
  const PosScreen({super.key});

  @override
  State<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends State<PosScreen> {
  final _searchController = TextEditingController();
  bool _showCart = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductsProvider>().fetchProductsAndCategories();
      context.read<CustomersProvider>().fetchCustomers();
      context.read<ShiftProvider>().fetchCurrentShift();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showCartSheet() {
    setState(() => _showCart = true);
  }

  void _addScannedProduct(String value) {
    final code = value.trim().toLowerCase();
    if (code.isEmpty) return;

    final products = context.read<ProductsProvider>().products;
    Product? match;
    for (final product in products) {
      if (product.barcode?.trim().toLowerCase() == code ||
          product.sku?.trim().toLowerCase() == code) {
        match = product;
        break;
      }
    }

    if (match == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No product matches that barcode or SKU.'),
        ),
      );
      return;
    }

    if (match.isOutOfStock) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('${match.name} is out of stock.')));
      return;
    }

    context.read<PosProvider>().addToCart(match);
    _searchController.clear();
    context.read<ProductsProvider>().setSearchQuery('');
  }

  void _openCheckout() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const CheckoutModal(),
    );
  }

  void _showHeldDraftsModal() {
    final pos = context.read<PosProvider>();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Parked / Held Orders'),
        content: pos.heldDrafts.isEmpty
            ? const Text(
                'No orders currently held. You can park active orders using "Hold Cart".',
              )
            : SizedBox(
                width: double.maxFinite,
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: pos.heldDrafts.length,
                  separatorBuilder: (_, _) => const Divider(height: 1),
                  itemBuilder: (_, index) {
                    final d = pos.heldDrafts[index];
                    return ListTile(
                      title: Text(
                        d.note,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                      subtitle: Text(
                        '${d.items.length} items • Total: ${Formatters.formatMoney(d.total)}',
                        style: const TextStyle(fontSize: 11),
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                            ),
                            onPressed: () {
                              pos.resumeDraft(d);
                              Navigator.pop(ctx);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Parked cart resumed!'),
                                  backgroundColor: AppColors.primary,
                                ),
                              );
                            },
                            child: const Text(
                              'Resume',
                              style: TextStyle(fontSize: 12),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(
                              Icons.delete_outline_rounded,
                              size: 18,
                              color: AppColors.danger,
                            ),
                            onPressed: () => pos.deleteDraft(d.id),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final productsProv = context.watch<ProductsProvider>();
    final pos = context.watch<PosProvider>();
    final shift = context.watch<ShiftProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Point of Sale'),
        actions: [
          if (pos.heldDrafts.isNotEmpty)
            Stack(
              alignment: Alignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.pause_circle_outline_rounded),
                  tooltip: 'View Held Carts',
                  onPressed: _showHeldDraftsModal,
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppColors.warning,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      '${pos.heldDrafts.length}',
                      style: const TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          if (shift.currentShift != null)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Center(
                child: StatusBadge.shift(isOpen: shift.currentShift!.isOpen),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              productsProv.fetchProductsAndCategories();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkBg : AppColors.lightBg,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                ),
              ),
              child: Row(
                children: [
                  _PosTab(
                    label: 'Product Catalog (${productsProv.products.length})',
                    selected: !_showCart,
                    onTap: () => setState(() => _showCart = false),
                  ),
                  _PosTab(
                    label:
                        'Cart (${pos.cart.length}) · ${Formatters.formatMoney(pos.grandTotal)}',
                    selected: _showCart,
                    onTap: () => setState(() => _showCart = true),
                  ),
                ],
              ),
            ),
          ),

          if (!_showCart) ...[
            // Search & Category Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: TextField(
                controller: _searchController,
                onChanged: productsProv.setSearchQuery,
                onSubmitted: _addScannedProduct,
                decoration: InputDecoration(
                  hintText: 'Search products or scan SKU/barcode...',
                  prefixIcon: const Icon(Icons.search_rounded, size: 20),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, size: 18),
                          onPressed: () {
                            _searchController.clear();
                            productsProv.setSearchQuery('');
                          },
                        )
                      : const Icon(Icons.qr_code_scanner_rounded, size: 20),
                ),
              ),
            ),

            // Categories Horizontal List
            SizedBox(
              height: 38,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _CategoryChip(
                    label: 'All Items',
                    isSelected: productsProv.selectedCategoryId == null,
                    onTap: () => productsProv.setSelectedCategory(null),
                  ),
                  ...productsProv.categories.map(
                    (c) => _CategoryChip(
                      label: c.name,
                      isSelected: productsProv.selectedCategoryId == c.id,
                      onTap: () => productsProv.setSelectedCategory(c.id),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
          ],

          // Product Grid
          Expanded(
            child: _showCart
                ? _CartPanel(onCheckout: _openCheckout)
                : productsProv.isLoading
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
                          'No products found',
                          style: TextStyle(
                            fontSize: 14,
                            color: isDark
                                ? AppColors.darkTextSecondary
                                : AppColors.lightTextSecondary,
                          ),
                        ),
                      ],
                    ),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.88,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                    itemCount: productsProv.filteredProducts.length,
                    itemBuilder: (context, index) {
                      final product = productsProv.filteredProducts[index];
                      return _ProductCard(
                        product: product,
                        onTap: () => pos.addToCart(product),
                      );
                    },
                  ),
          ),

          // Bottom Floating Cart Bar
          if (pos.cart.isNotEmpty && !_showCart)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                border: Border(
                  top: BorderSide(
                    color: isDark
                        ? AppColors.darkBorder
                        : AppColors.lightBorder,
                  ),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 10,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    // Cart count pill
                    InkWell(
                      onTap: _showCartSheet,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.darkBg : AppColors.lightBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isDark
                                ? AppColors.darkBorder
                                : AppColors.lightBorder,
                          ),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.shopping_bag_outlined, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              '${pos.totalItemCount}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Total
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Subtotal',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                            ),
                          ),
                          Text(
                            Formatters.formatMoney(pos.subtotal),
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                              fontFamily: 'monospace',
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Checkout Button
                    ElevatedButton.icon(
                      onPressed: _showCartSheet,
                      icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                      label: const Text('Review Cart'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Material(
        color: isSelected
            ? AppColors.primary
            : (isDark ? AppColors.darkSurface : AppColors.lightSurface),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(
            color: isSelected
                ? AppColors.primary
                : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
          ),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            child: Center(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected
                      ? Colors.white
                      : (isDark
                            ? AppColors.darkTextPrimary
                            : AppColors.lightTextPrimary),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback onTap;

  const _ProductCard({required this.product, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isOutOfStock = product.isOutOfStock;

    return Card(
      child: InkWell(
        onTap: isOutOfStock ? null : onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Bar: SKU/Barcode & Stock
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    product.sku ?? 'ITEM',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: isDark
                          ? AppColors.darkTextMuted
                          : AppColors.lightTextMuted,
                      fontFamily: 'monospace',
                    ),
                  ),
                  StatusBadge.stock(
                    stock: product.stock,
                    reorderLevel: product.reorderLevel,
                  ),
                ],
              ),
              const Spacer(),

              // Product Name
              Text(
                product.name,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: isDark
                      ? AppColors.darkTextPrimary
                      : AppColors.lightTextPrimary,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 6),

              // Price & Quick Add Button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    Formatters.formatMoney(product.price),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: AppColors.primary,
                      fontFamily: 'monospace',
                    ),
                  ),
                  Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: isOutOfStock
                          ? (isDark
                                ? AppColors.darkBorder
                                : AppColors.lightBorder)
                          : AppColors.primary,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Icon(
                        isOutOfStock ? Icons.block : Icons.add_rounded,
                        size: 18,
                        color: Colors.white,
                      ),
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

class _PosTab extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _PosTab({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Material(
        color: selected
            ? (Theme.of(context).brightness == Brightness.dark
                  ? AppColors.darkSurface
                  : AppColors.lightSurface)
            : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: selected
                    ? AppColors.primary
                    : (Theme.of(context).brightness == Brightness.dark
                          ? AppColors.darkTextSecondary
                          : AppColors.lightTextSecondary),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CartPanel extends StatefulWidget {
  final VoidCallback onCheckout;

  const _CartPanel({required this.onCheckout});

  @override
  State<_CartPanel> createState() => _CartPanelState();
}

class _CartPanelState extends State<_CartPanel> {
  final _discountController = TextEditingController();
  bool _discountInitialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_discountInitialized) {
      final pos = context.read<PosProvider>();
      _discountController.text = pos.discountIsPercent
          ? pos.discountPercent.toStringAsFixed(2)
          : pos.discount.toStringAsFixed(2);
      _discountInitialized = true;
    }
  }

  @override
  void dispose() {
    _discountController.dispose();
    super.dispose();
  }

  void _selectDiscountMode(PosProvider pos, bool asPercent) {
    if (pos.discountIsPercent == asPercent) return;
    if (asPercent) {
      final percent = pos.subtotal == 0.0
          ? 0.0
          : pos.discount / pos.subtotal * 100;
      pos.setDiscountPercent(percent);
      _discountController.text = percent.toStringAsFixed(2);
    } else {
      pos.setDiscount(pos.discount);
      _discountController.text = pos.discount.toStringAsFixed(2);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pos = context.watch<PosProvider>();
    final customers = context.watch<CustomersProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark
        ? AppColors.darkTextPrimary
        : AppColors.lightTextPrimary;
    final secondaryColor = isDark
        ? AppColors.darkTextSecondary
        : AppColors.lightTextSecondary;

    if (pos.cart.isEmpty &&
        pos.discount == 0 &&
        _discountController.text != '0.00') {
      _discountController.text = '0.00';
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Current Cart',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                        color: textColor,
                      ),
                    ),
                    Text(
                      '${pos.cart.length} products · ${pos.totalItemCount} units',
                      style: TextStyle(fontSize: 11, color: secondaryColor),
                    ),
                  ],
                ),
              ),
              IconButton(
                tooltip: 'Clear cart',
                onPressed: pos.cart.isEmpty ? null : pos.clearCart,
                icon: const Icon(
                  Icons.delete_sweep_outlined,
                  color: AppColors.danger,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          DropdownButtonFormField<String>(
            initialValue: pos.selectedCustomer?.id ?? '',
            isExpanded: true,
            decoration: const InputDecoration(
              labelText: 'Customer',
              prefixIcon: Icon(Icons.person_outline_rounded, size: 20),
              isDense: true,
            ),
            items: [
              const DropdownMenuItem(
                value: '',
                child: Text('Walk-in Customer'),
              ),
              ...customers.customers.map(
                (customer) => DropdownMenuItem(
                  value: customer.id,
                  child: Text(
                    customer.phone == null || customer.phone!.isEmpty
                        ? customer.name
                        : '${customer.name} · ${customer.phone}',
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ],
            onChanged: (id) {
              pos.setSelectedCustomer(
                id == null || id.isEmpty
                    ? null
                    : customers.customers.firstWhere(
                        (customer) => customer.id == id,
                      ),
              );
            },
          ),
          if (customers.errorMessage != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                'Customers could not be loaded. Retry from the customer list.',
                style: TextStyle(fontSize: 10, color: secondaryColor),
              ),
            ),
          const SizedBox(height: 8),
          Expanded(
            child: pos.cart.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.shopping_cart_outlined,
                          size: 42,
                          color: secondaryColor,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Cart is empty',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: textColor,
                          ),
                        ),
                        Text(
                          'Add products from the catalog or scan a barcode.',
                          style: TextStyle(fontSize: 11, color: secondaryColor),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    itemCount: pos.cart.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final item = pos.cart[index];
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 7),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.product.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: textColor,
                                    ),
                                  ),
                                  Text(
                                    '${Formatters.formatMoney(item.unitPrice)} × ${item.quantity} = ${Formatters.formatMoney(item.total)}',
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: secondaryColor,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              icon: const Icon(
                                Icons.remove_circle_outline,
                                size: 20,
                              ),
                              onPressed: () =>
                                  pos.updateQuantity(item.product.id, -1),
                            ),
                            Text(
                              '${item.quantity}',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: textColor,
                              ),
                            ),
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              icon: const Icon(
                                Icons.add_circle_outline,
                                size: 20,
                              ),
                              onPressed: item.quantity >= item.product.stock
                                  ? null
                                  : () =>
                                        pos.updateQuantity(item.product.id, 1),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          if (pos.cart.isNotEmpty) ...[
            const Divider(height: 12),
            Row(
              children: [
                Text(
                  'Discount',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                  ),
                ),
                const SizedBox(width: 8),
                SegmentedButton<bool>(
                  segments: const [
                    ButtonSegment(value: false, label: Text('ETB')),
                    ButtonSegment(value: true, label: Text('%')),
                  ],
                  selected: {pos.discountIsPercent},
                  showSelectedIcon: false,
                  onSelectionChanged: (selection) =>
                      _selectDiscountMode(pos, selection.first),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _discountController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    textAlign: TextAlign.end,
                    decoration: InputDecoration(
                      isDense: true,
                      hintText: '0.00',
                      suffixText: pos.discountIsPercent ? '%' : null,
                    ),
                    onChanged: (value) {
                      final discount = double.tryParse(value.trim()) ?? 0;
                      if (pos.discountIsPercent) {
                        pos.setDiscountPercent(discount);
                      } else {
                        pos.setDiscount(discount);
                      }
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Apply 15% VAT',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: textColor,
                  ),
                ),
                Switch(
                  value: pos.applyVat,
                  activeThumbColor: AppColors.primary,
                  onChanged: pos.toggleVat,
                ),
              ],
            ),
            _CartTotalRow(label: 'Subtotal', amount: pos.subtotal),
            if (pos.discount > 0)
              _CartTotalRow(
                label: 'Discount',
                amount: -pos.discount,
                color: AppColors.primary,
              ),
            if (pos.applyVat)
              _CartTotalRow(label: 'VAT (15%)', amount: pos.vatAmount),
            const Divider(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Grand Total',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    color: textColor,
                  ),
                ),
                Text(
                  Formatters.formatMoney(pos.grandTotal),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: AppColors.primary,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                OutlinedButton.icon(
                  onPressed: () {
                    pos.holdCurrentCart();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Order held. Resume it from the top bar.',
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.pause_circle_outline_rounded),
                  label: const Text('Hold'),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: widget.onCheckout,
                    icon: const Icon(Icons.check_circle_outline_rounded),
                    label: const Text('Review & Pay'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _CartTotalRow extends StatelessWidget {
  final String label;
  final double amount;
  final Color? color;

  const _CartTotalRow({required this.label, required this.amount, this.color});

  @override
  Widget build(BuildContext context) {
    final defaultColor = Theme.of(context).brightness == Brightness.dark
        ? AppColors.darkTextSecondary
        : AppColors.lightTextSecondary;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 11, color: color ?? defaultColor),
          ),
          Text(
            Formatters.formatMoney(amount),
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
