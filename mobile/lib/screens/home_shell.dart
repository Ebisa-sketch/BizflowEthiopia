import 'package:flutter/material.dart';
import 'dashboard/dashboard_screen.dart';
import 'pos/pos_screen.dart';
import 'products/products_screen.dart';
import 'settings/settings_screen.dart';
import 'shifts/shift_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _currentIndex = 0;

  void _onTabSelected(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      const PosScreen(),
      const ProductsScreen(),
      const ShiftScreen(),
      DashboardScreen(onNavigateTab: _onTabSelected),
      const SettingsScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: _onTabSelected,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.point_of_sale_rounded),
            label: 'POS',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_outlined),
            activeIcon: Icon(Icons.inventory_2_rounded),
            label: 'Stock',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.punch_clock_outlined),
            activeIcon: Icon(Icons.punch_clock_rounded),
            label: 'Shift',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.analytics_outlined),
            activeIcon: Icon(Icons.analytics_rounded),
            label: 'Overview',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.tune_outlined),
            activeIcon: Icon(Icons.tune_rounded),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}

