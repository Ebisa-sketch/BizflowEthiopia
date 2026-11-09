import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api_client.dart';
import '../../core/constants.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../theme/app_colors.dart';
import '../profile/profile_screen.dart';
import '../staff/staff_screen.dart';
import '../subscription/subscription_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _serverUrlController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _serverUrlController.text = ApiClient().baseUrl;
  }

  @override
  void dispose() {
    _serverUrlController.dispose();
    super.dispose();
  }

  Future<void> _saveServerUrl() async {
    final url = _serverUrlController.text.trim();
    if (url.isNotEmpty) {
      await ApiClient().updateBaseUrl(url);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Server URL updated!'),
          backgroundColor: AppColors.primary,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final theme = context.watch<ThemeProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Store & App Settings'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // User & Business Profile Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 26,
                      backgroundColor: AppColors.primary,
                      child: Text(
                        (user?.name.isNotEmpty ?? false) ? user!.name[0].toUpperCase() : 'U',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.name ?? 'Signed In User',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            user?.email ?? '',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Business: ${user?.business?.name ?? "Default"} • Role: ${user?.role ?? "CASHIER"}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 18),

            // Store Management Links
            const Text(
              'Store Administration',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.account_circle_rounded, color: AppColors.primary),
                    title: const Text('My Profile & Security', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: const Text('Manage full name, phone number, and change password', style: TextStyle(fontSize: 11)),
                    trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen()));
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.people_alt_rounded, color: AppColors.secondary),
                    title: const Text('Staff & Role Management', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: const Text('Invite cashiers, managers, and manage permissions', style: TextStyle(fontSize: 11)),
                    trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const StaffScreen()));
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.workspace_premium_rounded, color: AppColors.warning),
                    title: const Text('Store Subscription & Plan', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: const Text('Active plan features, quotas, and licensing', style: TextStyle(fontSize: 11)),
                    trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const SubscriptionScreen()));
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Appearance Section
            const Text(
              'Appearance',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Card(
              child: Column(
                children: [
                  SwitchListTile(
                    title: const Text('Dark Mode', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    subtitle: Text(
                      'Optimized high-contrast dark theme for POS registers',
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                    value: theme.isDarkMode,
                    activeThumbColor: AppColors.primary,
                    onChanged: (val) => theme.toggleTheme(val),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Server & Network Section
            const Text(
              'Backend API Server',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'API Host URL',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _serverUrlController,
                      style: const TextStyle(fontFamily: 'monospace', fontSize: 13),
                      decoration: InputDecoration(
                        hintText: AppConstants.defaultApiUrl,
                        prefixIcon: const Icon(Icons.dns_rounded, size: 20),
                      ),
                    ),
                    const SizedBox(height: 10),
                    ElevatedButton.icon(
                      onPressed: _saveServerUrl,
                      icon: const Icon(Icons.save_rounded, size: 16),
                      label: const Text('Save Server URL'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Logout Button
            OutlinedButton.icon(
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Confirm Sign Out'),
                    content: const Text('Are you sure you want to sign out of this register?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        child: const Text('Cancel'),
                      ),
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
              icon: const Icon(Icons.logout_rounded, color: AppColors.danger, size: 18),
              label: const Text(
                'Sign Out of Store',
                style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.bold),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.danger),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
