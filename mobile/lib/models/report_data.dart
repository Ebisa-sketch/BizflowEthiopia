class TopProductReport {
  final String id;
  final String name;
  final int unitsSold;
  final double revenue;
  final double profitMargin;

  TopProductReport({
    required this.id,
    required this.name,
    required this.unitsSold,
    required this.revenue,
    required this.profitMargin,
  });

  factory TopProductReport.fromJson(Map<String, dynamic> json) {
    return TopProductReport(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Product',
      unitsSold: (json['unitsSold'] ?? json['units']) is num
          ? ((json['unitsSold'] ?? json['units']) as num).toInt()
          : int.tryParse(
                  (json['unitsSold'] ?? json['units'])?.toString() ?? '0',
                ) ??
                0,
      revenue: (json['revenue'] is num)
          ? (json['revenue'] as num).toDouble()
          : double.tryParse(json['revenue']?.toString() ?? '0') ?? 0.0,
      profitMargin: (json['profitMargin'] ?? json['margin']) is num
          ? ((json['profitMargin'] ?? json['margin']) as num).toDouble()
          : double.tryParse(
                  (json['profitMargin'] ?? json['margin'])
                          ?.toString()
                          .replaceAll('%', '') ??
                      '0',
                ) ??
                0.0,
    );
  }
}

class ReportData {
  final double totalRevenue;
  final double totalCogs;
  final double grossProfit;
  final double totalExpenses;
  final double netProfit;
  final Map<String, double> paymentBreakdown;
  final List<TopProductReport> topProducts;

  ReportData({
    this.totalRevenue = 0.0,
    this.totalCogs = 0.0,
    this.grossProfit = 0.0,
    this.totalExpenses = 0.0,
    this.netProfit = 0.0,
    this.paymentBreakdown = const {},
    this.topProducts = const [],
  });

  factory ReportData.fromJson(Map<String, dynamic> json) {
    final rawPayments = json['paymentBreakdown'] ?? json['paymentSplit'] ?? {};
    final Map<String, double> paymentsMap = {};
    if (rawPayments is Map) {
      rawPayments.forEach((key, val) {
        paymentsMap[key.toString()] = (val is num)
            ? val.toDouble()
            : double.tryParse(val.toString()) ?? 0.0;
      });
    } else if (rawPayments is List) {
      for (final item in rawPayments.whereType<Map>()) {
        final method = item['method']?.toString() ?? 'OTHER';
        final amount = item['amount'];
        paymentsMap[method] = amount is num
            ? amount.toDouble()
            : double.tryParse(amount?.toString() ?? '0') ?? 0.0;
      }
    }

    final rawTop = json['topProducts'] ?? [];
    List<TopProductReport> topList = [];
    if (rawTop is List) {
      topList = rawTop.map((p) => TopProductReport.fromJson(p)).toList();
    }

    final rev = (json['revenue'] ?? json['totalRevenue'] ?? 0.0);
    final cogs = (json['cogs'] ?? json['totalCogs'] ?? 0.0);
    final gross = json['grossProfit'];
    final exp = (json['expenses'] ?? json['totalExpenses'] ?? 0.0);
    final net = json['netProfit'];

    final revenue = rev is num
        ? rev.toDouble()
        : double.tryParse(rev.toString()) ?? 0.0;
    final cost = cogs is num
        ? cogs.toDouble()
        : double.tryParse(cogs.toString()) ?? 0.0;
    final expenses = exp is num
        ? exp.toDouble()
        : double.tryParse(exp.toString()) ?? 0.0;
    final grossProfit = gross is num
        ? gross.toDouble()
        : double.tryParse(gross?.toString() ?? '') ?? revenue - cost;
    final netProfit = net is num
        ? net.toDouble()
        : double.tryParse(net?.toString() ?? '') ?? grossProfit - expenses;

    final normalizedPayments = <String, double>{};
    for (final entry in paymentsMap.entries) {
      final method = switch (entry.key.toLowerCase()) {
        'cash' => 'CASH',
        'telebirr' => 'TELEBIRR',
        'cbe birr' => 'CBE_BIRR',
        'bank transfer' => 'BANK_TRANSFER',
        _ => entry.key,
      };
      normalizedPayments[method] = entry.value;
    }

    return ReportData(
      totalRevenue: revenue,
      totalCogs: cost,
      grossProfit: grossProfit,
      totalExpenses: expenses,
      netProfit: netProfit,
      paymentBreakdown: normalizedPayments,
      topProducts: topList,
    );
  }
}
