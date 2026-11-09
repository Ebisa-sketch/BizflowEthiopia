import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/shift_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_colors.dart';
import '../widgets/status_badge.dart';
import 'categories/categories_screen.dart';
import 'customers/customers_screen.dart';
import 'dashboard/dashboard_screen.dart';
import 'expenses/expenses_screen.dart';
import 'inventory/inventory_screen.dart';
import 'inventory/stock_movements_screen.dart';
import 'payments/payments_screen.dart';
import 'pos/pos_screen.dart';
import 'products/products_screen.dart';
import 'profile/profile_screen.dart';
import 'reports/reports_screen.dart';
import 'sales/sales_history_screen.dart';
import 'settings/settings_screen.dart';
import 'shifts/shift_screen.dart';
import 'subscription/subscription_screen.dart';
import 'staff/staff_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  String _activeRoute = 'pos';

  void _navigateTo(String route) {
    setState(() => _activeRoute = route);
    if (_scaffoldKey.currentState?.isDrawerOpen ?? false) {
      Navigator.pop(context); // close drawer
    }
  }

  Widget _buildCurrentScreen() {
    switch (_activeRoute) {
      case 'dashboard':
        return DashboardScreen(onNavigateRoute: _navigateTo);
      case 'pos':
        return const PosScreen();
      case 'sales':
        return const SalesHistoryScreen();
      case 'customers':
        return const CustomersScreen();
      case 'products':
        return const ProductsScreen();
      case 'categories':
        return const CategoriesScreen();
      case 'inventory':
        return const InventoryScreen();
      case 'stock_movements':
        return const StockMovementsScreen();
      case 'expenses':
        return const ExpensesScreen();
      case 'reports':
        return const ReportsScreen();
      case 'payments':
        return const PaymentsScreen();
      case 'shifts':
        return const ShiftScreen();
      case 'staff':
        return const StaffScreen();
      case 'settings':
        return const SettingsScreen();
      case 'subscription':
        return const SubscriptionScreen();
      case 'profile':
        return const ProfileScreen();
      default:
        return const PosScreen();
    }
  }

  int _getBottomNavIndex() {
    switch (_activeRoute) {
      case 'pos':
        return 0;
      case 'dashboard':
        return 1;
      case 'sales':
        return 2;
      case 'products':
        return 3;
      default:
        return 4; // 'more'
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final shift = context.watch<ShiftProvider>();
    final theme = context.watch<ThemeProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final user = auth.user;

    return Scaffold(
      key: _scaffoldKey,
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [
              // User & Store Drawer Header (Matching Web App Sidebar)
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                  border: Border(
                    bottom: BorderSide(
                      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: AppColors.primary,
                      child: Text(
                        (user?.name.isNotEmpty ?? false) ? user!.name[0].toUpperCase() : 'B',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.business?.name ?? 'BizFlow Ethiopia',
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            user?.name ?? 'Staff User',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  user?.role ?? 'CASHIER',
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.primary),
                                ),
                              ),
                              const SizedBox(width: 6),
                              StatusBadge.shift(isOpen: shift.hasActiveShift),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Navigation Links (4 Groups matching Web App)
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  children: [
                    // GROUP 1: WORKSPACE
                    _NavGroupHeader(title: 'WORKSPACE'),
                    _DrawerItem(
                      icon: Icons.dashboard_rounded,
                      title: 'Dashboard',
                      isSelected: _activeRoute == 'dashboard',
                      onTap: () => _navigateTo('dashboard'),
                    ),
                    _DrawerItem(
                      icon: Icons.point_of_sale_rounded,
                      title: 'POS Checkout',
                      badge: 'POS',
                      badgeColor: AppColors.primary,
                      isSelected: _activeRoute == 'pos',
                      onTap: () => _navigateTo('pos'),
                    ),
                    _DrawerItem(
                      icon: Icons.receipt_long_rounded,
                      title: 'Sales History',
                      isSelected: _activeRoute == 'sales',
                      onTap: () => _navigateTo('sales'),
                    ),
                    _DrawerItem(
                      icon: Icons.people_alt_rounded,
                      title: 'Customers & Credit',
                      badge: 'IDDA',
                      badgeColor: AppColors.warning,
                      isSelected: _activeRoute == 'customers',
                      onTap: () => _navigateTo('customers'),
                    ),

                    // GROUP 2: CATALOG & STOCK
                    const Divider(height: 24),
                    _NavGroupHeader(title: 'CATALOG & STOCK'),
                    _DrawerItem(
                      icon: Icons.inventory_2_rounded,
                      title: 'Products',
                      isSelected: _activeRoute == 'products',
                      onTap: () => _navigateTo('products'),
                    ),
                    _DrawerItem(
                      icon: Icons.tag_rounded,
                      title: 'Categories',
                      isSelected: _activeRoute == 'categories',
                      onTap: () => _navigateTo('categories'),
                    ),
                    _DrawerItem(
                      icon: Icons.layers_rounded,
                      title: 'Inventory Audit',
                      isSelected: _activeRoute == 'inventory',
                      onTap: () => _navigateTo('inventory'),
                    ),
                    _DrawerItem(
                      icon: Icons.history_rounded,
                      title: 'Stock Movements',
                      isSelected: _activeRoute == 'stock_movements',
                      onTap: () => _navigateTo('stock_movements'),
                    ),

                    // GROUP 3: FINANCE
                    const Divider(height: 24),
                    _NavGroupHeader(title: 'FINANCE'),
                    _DrawerItem(
                      icon: Icons.credit_card_off_rounded,
                      title: 'Expenses',
                      isSelected: _activeRoute == 'expenses',
                      onTap: () => _navigateTo('expenses'),
                    ),
                    _DrawerItem(
                      icon: Icons.bar_chart_rounded,
                      title: 'Reports & P&L',
                      isSelected: _activeRoute == 'reports',
                      onTap: () => _navigateTo('reports'),
                    ),
                    _DrawerItem(
                      icon: Icons.payments_rounded,
                      title: 'Payments & Till',
                      isSelected: _activeRoute == 'payments',
                      onTap: () => _navigateTo('payments'),
                    ),
                    _DrawerItem(
                      icon: Icons.punch_clock_rounded,
                      title: 'Register Shifts',
                      isSelected: _activeRoute == 'shifts',
                      onTap: () => _navigateTo('shifts'),
                    ),

                    // GROUP 4: MANAGEMENT
                    const Divider(height: 24),
                    _NavGroupHeader(title: 'MANAGEMENT'),
                    _DrawerItem(
                      icon: Icons.badge_rounded,
                      title: 'Staff & Roles',
                      isSelected: _activeRoute == 'staff',
                      onTap: () => _navigateTo('staff'),
                    ),
                    _DrawerItem(
                      icon: Icons.settings_rounded,
                      title: 'Business Settings',
                      isSelected: _activeRoute == 'settings',
                      onTap: () => _navigateTo('settings'),
                    ),
                    _DrawerItem(
                      icon: Icons.workspace_premium_rounded,
                      title: 'Subscription',
                      isSelected: _activeRoute == 'subscription',
                      onTap: () => _navigateTo('subscription'),
                    ),
                    _DrawerItem(
                      icon: Icons.account_circle_rounded,
                      title: 'My Profile',
                      isSelected: _activeRoute == 'profile',
                      onTap: () => _navigateTo('profile'),
                    ),
                  ],
                ),
              ),

              // Drawer Footer with Theme & Sign Out
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                  border: Border(
                    top: BorderSide(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        IconButton(
                          icon: Icon(theme.isDarkMode ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
                          tooltip: 'Toggle Theme',
                          onPressed: () => theme.toggleTheme(!theme.isDarkMode),
                        ),
                        Text(
                          theme.isDarkMode ? 'Dark' : 'Light',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    TextButton.icon(
                      onPressed: () async {
                        final confirm = await showDialog<bool>(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            title: const Text('Sign Out'),
                            content: const Text('Are you sure you want to sign out?'),
                            actions: [
                              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
                                onPressed: () => Navigator.pop(ctx, true),
                                child: const Text('Sign Out'),
                              ),
                            ],
                          ),
                        );
                        if (confirm == true) {
                          await auth.logout();
                        }
                      },
                      icon: const Icon(Icons.logout_rounded, size: 16, color: AppColors.danger),
                      label: const Text('Sign Out', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      body: _buildCurrentScreen(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _getBottomNavIndex(),
        onTap: (index) {
          switch (index) {
            case 0:
              _navigateTo('pos');
              break;
            case 1:
              _navigateTo('dashboard');
              break;
            case 2:
              _navigateTo('sales');
              break;
            case 3:
              _navigateTo('products');
              break;
            case 4:
              _scaffoldKey.currentState?.openDrawer();
              break;
          }
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.point_of_sale_rounded),
            label: 'POS',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard_rounded),
            label: 'Overview',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long_rounded),
            label: 'Sales',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_outlined),
            activeIcon: Icon(Icons.inventory_2_rounded),
            label: 'Stock',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.menu_rounded),
            label: 'All Features',
          ),
        ],
      ),
    );
  }
}

class _NavGroupHeader extends StatelessWidget {
  final String title;

  const _NavGroupHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.1,
          color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
        ),
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? badge;
  final Color? badgeColor;
  final bool isSelected;
  final VoidCallback onTap;

  const _DrawerItem({
    required this.icon,
    required this.title,
    this.badge,
    this.badgeColor,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      child: ListTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        selected: isSelected,
        selectedTileColor: AppColors.primary.withValues(alpha: 0.12),
        leading: Icon(
          icon,
          color: isSelected ? AppColors.primary : null,
          size: 22,
        ),
        title: Text(
          title,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            color: isSelected ? AppColors.primary : null,
          ),
        ),
        trailing: badge != null
            ? Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: (badgeColor ?? AppColors.primary).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  badge!,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: badgeColor ?? AppColors.primary,
                  ),
                ),
              )
            : null,
        onTap: onTap,
      ),
    );
  }
}
