import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/api_client.dart';
import 'providers/auth_provider.dart';
import 'providers/categories_provider.dart';
import 'providers/customers_provider.dart';
import 'providers/dashboard_provider.dart';
import 'providers/expenses_provider.dart';
import 'providers/inventory_provider.dart';
import 'providers/pos_provider.dart';
import 'providers/products_provider.dart';
import 'providers/reports_provider.dart';
import 'providers/sales_provider.dart';
import 'providers/shift_provider.dart';
import 'providers/staff_provider.dart';
import 'providers/theme_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home_shell.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize API client from persistent preferences
  await ApiClient().init();

  // Prefer portrait up for phones, allow landscape for POS tablets
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  runApp(const BizFlowRoot());
}

class BizFlowRoot extends StatelessWidget {
  const BizFlowRoot({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()..checkAuthStatus()),
        ChangeNotifierProvider(create: (_) => ProductsProvider()),
        ChangeNotifierProvider(create: (_) => PosProvider()),
        ChangeNotifierProvider(create: (_) => DashboardProvider()),
        ChangeNotifierProvider(create: (_) => ShiftProvider()),
        ChangeNotifierProvider(create: (_) => CustomersProvider()),
        ChangeNotifierProvider(create: (_) => SalesProvider()),
        ChangeNotifierProvider(create: (_) => ExpensesProvider()),
        ChangeNotifierProvider(create: (_) => InventoryProvider()),
        ChangeNotifierProvider(create: (_) => ReportsProvider()),
        ChangeNotifierProvider(create: (_) => StaffProvider()),
        ChangeNotifierProvider(create: (_) => CategoriesProvider()),
      ],
      child: const BizFlowApp(),
    );
  }
}

class BizFlowApp extends StatelessWidget {
  const BizFlowApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final authProvider = context.watch<AuthProvider>();

    return MaterialApp(
      title: 'BizFlow Ethiopia',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeProvider.themeMode,
      home: authProvider.isLoading
          ? const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            )
          : (authProvider.isAuthenticated
              ? const HomeShell()
              : const LoginScreen()),
    );
  }
}
