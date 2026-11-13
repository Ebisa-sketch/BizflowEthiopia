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

class AvailableBusiness {
  final String id;
  final String name;
  final String role;

  const AvailableBusiness({
    required this.id,
    required this.name,
    required this.role,
  });

  factory AvailableBusiness.fromJson(Map<String, dynamic> json) {
    return AvailableBusiness(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'My Business',
      role: json['role']?.toString() ?? 'CASHIER',
    );
  }

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'role': role};
}

class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? businessId;
  final Business? business;
  final String? globalRole;
  final List<AvailableBusiness> availableBusinesses;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.businessId,
    this.business,
    this.globalRole,
    this.availableBusinesses = const [],
  });

  factory User.fromJson(Map<String, dynamic> json) {
    final businessId = json['businessId']?.toString();
    final rawBusiness = json['business'];
    final business = rawBusiness is Map
        ? Business.fromJson(Map<String, dynamic>.from(rawBusiness))
        : businessId != null || json['businessName'] != null
        ? Business(
            id: businessId ?? '',
            name: json['businessName']?.toString() ?? 'My Business',
            currency: json['currency']?.toString() ?? 'ETB',
          )
        : null;
    final availableBusinesses = json['availableBusinesses'] is List
        ? (json['availableBusinesses'] as List)
              .whereType<Map>()
              .map(
                (item) =>
                    AvailableBusiness.fromJson(Map<String, dynamic>.from(item)),
              )
              .toList()
        : <AvailableBusiness>[];
    return User(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'CASHIER',
      businessId: businessId,
      business: business,
      globalRole: json['globalRole']?.toString(),
      availableBusinesses: availableBusinesses,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'role': role,
    'businessId': businessId,
    'business': business?.toJson(),
    'globalRole': globalRole,
    'availableBusinesses': availableBusinesses
        .map((business) => business.toJson())
        .toList(),
  };
}
