import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../theme/app_colors.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _tokenController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _isLoading = false;
  String? _maskedEmail;

  @override
  void dispose() {
    _tokenController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _resetPassword() async {
    final token = _tokenController.text.trim();
    final password = _passwordController.text;
    if (token.isEmpty || password.isEmpty || _confirmController.text.isEmpty) {
      _showError('Enter your reset token and complete all password fields.');
      return;
    }
    if (password.length < 8 ||
        !RegExp(r'[A-Z]').hasMatch(password) ||
        !RegExp(r'[a-z]').hasMatch(password) ||
        !RegExp(r'[0-9]').hasMatch(password)) {
      _showError(
        'Use at least 8 characters with uppercase, lowercase, and a number.',
      );
      return;
    }
    if (password != _confirmController.text) {
      _showError('The passwords do not match.');
      return;
    }

    setState(() => _isLoading = true);
    try {
      final validation = await ApiClient().get(
        '/api/auth/reset-password',
        queryParams: {'token': token},
      );
      if (validation is! Map || validation['valid'] != true) {
        throw AppException(
          validation is Map
              ? validation['error']?.toString() ??
                    'Reset link is invalid or expired.'
              : 'Unable to validate the reset link.',
        );
      }
      _maskedEmail = validation['maskedEmail']?.toString();
      await ApiClient().post(
        '/api/auth/reset-password',
        body: {'token': token, 'password': password},
      );
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Password updated'),
          content: Text(
            _maskedEmail == null
                ? 'You can now sign in with your new password.'
                : 'Password updated for $_maskedEmail. You can now sign in.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Continue'),
            ),
          ],
        ),
      );
      if (mounted) {
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } catch (error) {
      if (mounted) _showError(error.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: AppColors.danger),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Choose a New Password')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'Enter the token from your password reset email.',
                        style: TextStyle(fontSize: 13),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _tokenController,
                        keyboardType: TextInputType.visiblePassword,
                        decoration: const InputDecoration(
                          labelText: 'Reset token',
                          prefixIcon: Icon(Icons.key_rounded),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'New password',
                          prefixIcon: Icon(Icons.lock_outline_rounded),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _confirmController,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Confirm new password',
                          prefixIcon: Icon(Icons.lock_reset_rounded),
                        ),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _resetPassword,
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text('Reset Password'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
