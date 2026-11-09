import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/staff_member.dart';
import '../../providers/staff_provider.dart';
import '../../theme/app_colors.dart';

class StaffScreen extends StatefulWidget {
  const StaffScreen({super.key});

  @override
  State<StaffScreen> createState() => _StaffScreenState();
}

class _StaffScreenState extends State<StaffScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<StaffProvider>().fetchStaff();
    });
  }

  void _showAddStaffDialog() {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final passCtrl = TextEditingController();
    String selectedRole = 'CASHIER';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Add Staff Member'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(labelText: 'Full Name *', hintText: 'e.g. Abebe Kebede'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email Address *', hintText: 'abebe@example.com'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Phone (optional)', hintText: '+2519...'),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(labelText: 'Store Role *'),
                  initialValue: selectedRole,
                  items: const [
                    DropdownMenuItem(value: 'CASHIER', child: Text('CASHIER (POS Register only)')),
                    DropdownMenuItem(value: 'MANAGER', child: Text('MANAGER (Inventory, Sales & Staff)')),
                    DropdownMenuItem(value: 'OWNER', child: Text('OWNER (Full Store Admin)')),
                  ],
                  onChanged: (val) {
                    if (val != null) setDialogState(() => selectedRole = val);
                  },
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: passCtrl,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Initial Password *',
                    hintText: 'Min 6 characters',
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
                final email = emailCtrl.text.trim();
                final pass = passCtrl.text.trim();

                if (name.isEmpty || email.isEmpty || pass.length < 6) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please fill all required fields (password min 6 chars)')),
                  );
                  return;
                }

                Navigator.pop(ctx);
                final success = await context.read<StaffProvider>().addStaff(
                      name: name,
                      email: email,
                      role: selectedRole,
                      phone: phoneCtrl.text.trim(),
                      password: pass,
                    );
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(success ? 'Staff member "$name" added!' : 'Failed to add staff member'),
                      backgroundColor: success ? AppColors.primary : AppColors.danger,
                    ),
                  );
                }
              },
              child: const Text('Add Member'),
            ),
          ],
        ),
      ),
    );
  }

  void _showEditRoleDialog(StaffMember member) {
    String role = member.role;
    String status = member.status;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text('Manage ${member.name}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(labelText: 'Role'),
                initialValue: role,
                items: const [
                  DropdownMenuItem(value: 'CASHIER', child: Text('CASHIER')),
                  DropdownMenuItem(value: 'MANAGER', child: Text('MANAGER')),
                  DropdownMenuItem(value: 'OWNER', child: Text('OWNER')),
                ],
                onChanged: (val) {
                  if (val != null) setDialogState(() => role = val);
                },
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(labelText: 'Account Status'),
                initialValue: status,
                items: const [
                  DropdownMenuItem(value: 'ACTIVE', child: Text('ACTIVE')),
                  DropdownMenuItem(value: 'SUSPENDED', child: Text('SUSPENDED')),
                ],
                onChanged: (val) {
                  if (val != null) setDialogState(() => status = val);
                },
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
                Navigator.pop(ctx);
                final success = await context.read<StaffProvider>().updateStaff(
                      id: member.id,
                      role: role,
                      status: status,
                    );
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(success ? 'Staff permissions updated!' : 'Failed to update staff'),
                      backgroundColor: success ? AppColors.primary : AppColors.danger,
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

  void _confirmDeleteStaff(StaffMember member) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove Staff Member'),
        content: Text('Are you sure you want to revoke store access for "${member.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await context.read<StaffProvider>().deleteStaff(member.id);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success ? 'Staff member removed!' : 'Failed to remove staff member'),
                    backgroundColor: success ? AppColors.primary : AppColors.danger,
                  ),
                );
              }
            },
            child: const Text('Remove'),
          ),
        ],
      ),
    );
  }

  Color _getRoleColor(String role) {
    switch (role.toUpperCase()) {
      case 'OWNER':
        return const Color(0xFF8B5CF6);
      case 'MANAGER':
        return AppColors.secondary;
      case 'CASHIER':
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final staffProvider = context.watch<StaffProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final staff = staffProvider.staff;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Staff & Role Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_rounded),
            onPressed: _showAddStaffDialog,
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => staffProvider.fetchStaff(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddStaffDialog,
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.person_add_rounded, color: Colors.white),
        label: const Text('Invite Staff', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          // Header summary card
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Total Team Members',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${staff.length}',
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.primary),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF8B5CF6).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFF8B5CF6).withValues(alpha: 0.2)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Cashier Registers',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${staff.where((s) => s.role == "CASHIER").length}',
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF8B5CF6)),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => staffProvider.fetchStaff(),
              child: staffProvider.isLoading && staff.isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : staff.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.people_outline_rounded, size: 56, color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted),
                              const SizedBox(height: 12),
                              const Text('No staff members registered', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                            ],
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: staff.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final member = staff[index];
                            final roleColor = _getRoleColor(member.role);
                            final isSuspended = member.status == 'SUSPENDED';

                            return Card(
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: roleColor.withValues(alpha: 0.15),
                                  child: Text(
                                    member.name.isNotEmpty ? member.name[0].toUpperCase() : 'S',
                                    style: TextStyle(fontWeight: FontWeight.bold, color: roleColor),
                                  ),
                                ),
                                title: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        member.name,
                                        style: TextStyle(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 15,
                                          decoration: isSuspended ? TextDecoration.lineThrough : null,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: roleColor.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        member.role,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w800,
                                          color: roleColor,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 2),
                                    Text(
                                      member.email,
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                      ),
                                    ),
                                    if (member.phone != null && member.phone!.isNotEmpty) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        member.phone!,
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                trailing: PopupMenuButton<String>(
                                  onSelected: (val) {
                                    if (val == 'edit') _showEditRoleDialog(member);
                                    if (val == 'delete') _confirmDeleteStaff(member);
                                  },
                                  itemBuilder: (_) => [
                                    const PopupMenuItem(
                                      value: 'edit',
                                      child: Row(
                                        children: [
                                          Icon(Icons.tune_rounded, size: 18),
                                          SizedBox(width: 8),
                                          Text('Edit Role & Status'),
                                        ],
                                      ),
                                    ),
                                    const PopupMenuItem(
                                      value: 'delete',
                                      child: Row(
                                        children: [
                                          Icon(Icons.person_remove_rounded, size: 18, color: AppColors.danger),
                                          SizedBox(width: 8),
                                          Text('Revoke Access', style: TextStyle(color: AppColors.danger)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ),
        ],
      ),
    );
  }
}
