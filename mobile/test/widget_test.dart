import 'package:flutter_test/flutter_test.dart';
import 'package:bizflow_mobile/main.dart';

void main() {
  testWidgets('App initializes correctly with providers', (WidgetTester tester) async {
    await tester.pumpWidget(const BizFlowRoot());
    expect(find.byType(BizFlowRoot), findsOneWidget);
  });
}
