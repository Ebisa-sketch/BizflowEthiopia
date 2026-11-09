import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api_client.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../theme/app_colors.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _businessNameController = TextEditingController();
  final _ownerNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _businessNameController.dispose();
    _ownerNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    final businessName = _businessNameController.text.trim();
    final ownerName = _ownerNameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmPasswordController.text;

    if (businessName.isEmpty || ownerName.isEmpty || email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields')),
      );
      return;
    }

    if (password.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password must be at least 6 characters')),
      );
      return;
    }

    if (password != confirm) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Passwords do not match')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      await ApiClient().post('/api/auth/register', body: {
        'businessName': businessName,
        'name': ownerName,
        'email': email,
        'password': password,
        if (_phoneController.text.trim().isNotEmpty) 'phone': _phoneController.text.trim(),
      });

      if (!mounted) return;

      // Automatically sign in with new account
      final auth = context.read<AuthProvider>();
      final loginSuccess = await auth.login(email, password);

      if (mounted) {
        if (loginSuccess) {
          Navigator.of(context).popUntil((route) => route.isFirst);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Account registered! Please sign in with your credentials.'),
              backgroundColor: AppColors.primary,
            ),
          );
          Navigator.pop(context);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Registration failed: $e'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final themeProvider = context.watch<ThemeProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Register Store'),
        actions: [
          IconButton(
            icon: Icon(
              themeProvider.isDarkMode ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
            ),
            onPressed: () => themeProvider.toggleTheme(!themeProvider.isDarkMode),
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(22),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            'Create Store & Owner Account',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Get started with BizFlow Ethiopia multi-tenant POS',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Business Name
                          TextField(
                            controller: _businessNameController,
                            decoration: const InputDecoration(
                              labelText: 'Business / Store Name *',
                              hintText: 'e.g. Addis Supermarket & Bakery',
                              prefixIcon: Icon(Icons.storefront_rounded, size: 20),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Owner Name
                          TextField(
                            controller: _ownerNameController,
                            decoration: const InputDecoration(
                              labelText: 'Owner Full Name *',
                              hintText: 'e.g. Abebe Bikila',
                              prefixIcon: Icon(Icons.badge_rounded, size: 20),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Email
                          TextField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            decoration: const InputDecoration(
                              labelText: 'Email Address *',
                              hintText: 'store@example.et',
                              prefixIcon: Icon(Icons.email_outlined, size: 20),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Phone
                          TextField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            decoration: const InputDecoration(
                              labelText: 'Phone Number (optional)',
                              hintText: '+251 9...',
                              prefixIcon: Icon(Icons.phone_outlined, size: 20),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Password
                          TextField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            decoration: InputDecoration(
                              labelText: 'Password (min 6 chars) *',
                              prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                                  size: 20,
                                ),
                                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Confirm Password
                          TextField(
                            controller: _confirmPasswordController,
                            obscureText: _obscurePassword,
                            decoration: const InputDecoration(
                              labelText: 'Confirm Password *',
                              prefixIcon: Icon(Icons.lock_clock_rounded, size: 20),
                            ),
                          ),
                          const SizedBox(height: 24),

                          ElevatedButton(
                            onPressed: _isLoading ? null : _handleRegister,
                            child: _isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                                  )
                                : const Text('Register Business'),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Already have an account? ',
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Sign In', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
