class Business {
  final String id;
  final String name;
  final String? phone;
  final String? address;
  final String? currency;

  Business({
    required this.id,
    required this.name,
    this.phone,
    this.address,
    this.currency,
  });

  factory Business.fromJson(Map<String, dynamic> json) {
    return Business(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'My Business',
      phone: json['phone']?.toString(),
      address: json['address']?.toString(),
      currency: json['currency']?.toString() ?? 'ETB',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'phone': phone,
    'address': address,
    'currency': currency,
  };
}

class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? businessId;
  final Business? business;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.businessId,
    this.business,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'CASHIER',
      businessId: json['businessId']?.toString(),
      business: json['business'] != null ? Business.fromJson(json['business']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'role': role,
    'businessId': businessId,
    'business': business?.toJson(),
  };
}
