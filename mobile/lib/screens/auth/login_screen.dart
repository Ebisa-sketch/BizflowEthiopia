import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api_client.dart';
import '../../core/constants.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../theme/app_colors.dart';
import 'forgot_password_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _serverUrlController = TextEditingController();
  bool _obscurePassword = true;
  bool _showServerConfig = false;

  @override
  void initState() {
    super.initState();
    _serverUrlController.text = ApiClient().baseUrl;
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _serverUrlController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter email and password')),
      );
      return;
    }

    if (_showServerConfig) {
      await ApiClient().updateBaseUrl(_serverUrlController.text.trim());
    }

    if (!mounted) return;
    final auth = context.read<AuthProvider>();
    final success = await auth.login(email, password);

    if (!mounted) return;
    if (!success && auth.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(auth.errorMessage!),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final themeProvider = context.watch<ThemeProvider>();
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Top bar with theme toggle
                  Align(
                    alignment: Alignment.topRight,
                    child: IconButton(
                      icon: Icon(
                        themeProvider.isDarkMode
                            ? Icons.light_mode_outlined
                            : Icons.dark_mode_outlined,
                      ),
                      onPressed: () {
                        themeProvider.toggleTheme(!themeProvider.isDarkMode);
                      },
                    ),
                  ),

                  // Brand Logo & Heading
                  Center(
                    child: Container(
                      width: 68,
                      height: 68,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.3),
                            blurRadius: 16,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.point_of_sale_rounded,
                          size: 36,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'BizFlow Ethiopia',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Multi-tenant Cloud POS & Retail System',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Card Container
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(22),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            'Cashier / Store Sign In',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                            ),
                          ),
                          const SizedBox(height: 18),

                          // Email
                          const Text(
                            'Email Address',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            decoration: const InputDecoration(
                              hintText: 'e.g. cashier@addismart.et',
                              prefixIcon: Icon(Icons.email_outlined, size: 20),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Password
                          const Text(
                            'Password',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            decoration: InputDecoration(
                              hintText: 'Enter your password',
                              prefixIcon: const Icon(Icons.lock_outline, size: 20),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword
                                      ? Icons.visibility_outlined
                                      : Icons.visibility_off_outlined,
                                  size: 20,
                                ),
                                onPressed: () {
                                  setState(() => _obscurePassword = !_obscurePassword);
                                },
                              ),
                            ),
                          ),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const ForgotPasswordScreen()),
                                );
                              },
                              child: const Text('Forgot password?', style: TextStyle(fontSize: 12)),
                            ),
                          ),
                          const SizedBox(height: 8),

                          // Sign In Button
                          ElevatedButton(
                            onPressed: auth.isLoading ? null : _handleLogin,
                            child: auth.isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Text('Sign In to Register'),
                          ),
                          const SizedBox(height: 12),

                          // Register link
                          OutlinedButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const RegisterScreen()),
                              );
                            },
                            child: const Text('Register New Store / Business'),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Server URL Config Expansion
                  TextButton.icon(
                    onPressed: () {
                      setState(() => _showServerConfig = !_showServerConfig);
                    },
                    icon: Icon(
                      _showServerConfig ? Icons.expand_less : Icons.settings_ethernet_rounded,
                      size: 16,
                    ),
                    label: Text(
                      _showServerConfig ? 'Hide Server Configuration' : 'Configure Server Endpoint',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),

                  if (_showServerConfig) ...[
                    const SizedBox(height: 8),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Backend Server URL',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 6),
                            TextField(
                              controller: _serverUrlController,
                              style: const TextStyle(fontFamily: 'monospace', fontSize: 13),
                              decoration: InputDecoration(
                                hintText: AppConstants.defaultApiUrl,
                                prefixIcon: const Icon(Icons.link_rounded, size: 20),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Use 10.0.2.2:3000 for Android emulator, or your LAN IP (e.g. 192.168.1.15:3000) for physical phone testing.',
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

