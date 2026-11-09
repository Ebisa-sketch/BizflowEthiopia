class StaffMember {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String role; // OWNER, MANAGER, CASHIER
  final String status; // ACTIVE, INVITED, SUSPENDED
  final DateTime createdAt;

  StaffMember({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.role,
    this.status = 'ACTIVE',
    required this.createdAt,
  });

  factory StaffMember.fromJson(Map<String, dynamic> json) {
    return StaffMember(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Staff',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString(),
      role: json['role']?.toString() ?? 'CASHIER',
      status: json['status']?.toString() ?? 'ACTIVE',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? json['joinedDate']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'phone': phone,
    'role': role,
    'status': status,
  };
}
