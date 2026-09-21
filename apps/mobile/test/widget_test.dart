import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hirewise_mobile/shared/models/enums.dart';
import 'package:hirewise_mobile/shared/widgets/empty_state.dart';
import 'package:hirewise_mobile/shared/widgets/error_view.dart';
import 'package:hirewise_mobile/shared/widgets/loading_indicator.dart';
import 'package:hirewise_mobile/shared/widgets/status_badge.dart';

void main() {
  group('Shared Widgets Tests', () {
    testWidgets('StatusBadge renders application status badge', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatusBadge.forApplication(
                ApplicationStatus.interviewScheduled),
          ),
        ),
      );

      expect(find.text('Interview Scheduled'), findsOneWidget);
    });

    testWidgets('StatusBadge renders interview status badge', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatusBadge.forInterview(InterviewStatus.completed),
          ),
        ),
      );

      expect(find.text('Completed'), findsOneWidget);
    });

    testWidgets('LoadingIndicator renders message', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingIndicator(message: 'Searching jobs...'),
          ),
        ),
      );

      expect(find.text('Searching jobs...'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('ErrorView renders error message and handles retry tap',
        (tester) async {
      bool retried = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ErrorView(
              title: 'Connection Failed',
              error: 'Server is currently unreachable',
              onRetry: () {
                retried = true;
              },
            ),
          ),
        ),
      );

      expect(find.text('Connection Failed'), findsOneWidget);
      expect(find.text('Server is currently unreachable'), findsOneWidget);

      await tester.tap(find.text('Try Again'));
      await tester.pump();

      expect(retried, true);
    });

    testWidgets('EmptyState renders title, message and triggers action',
        (tester) async {
      bool actionTriggered = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyState(
              title: 'No Jobs',
              message: 'Check back later for new openings',
              actionLabel: 'Refresh',
              onAction: () {
                actionTriggered = true;
              },
            ),
          ),
        ),
      );

      expect(find.text('No Jobs'), findsOneWidget);
      expect(find.text('Check back later for new openings'), findsOneWidget);

      await tester.tap(find.text('Refresh'));
      await tester.pump();

      expect(actionTriggered, true);
    });
  });
}
