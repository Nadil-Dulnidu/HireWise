import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/config/env_config.dart';
import '../core/network/api_client.dart';
import '../core/routing/app_router.dart';
import '../core/theme/app_theme.dart';
import '../features/auth/providers/auth_state_provider.dart';
import '../features/notifications/providers/notifications_provider.dart';

class HireWiseApp extends ConsumerWidget {
  const HireWiseApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ClerkAuth(
      config: ClerkAuthConfig(
        publishableKey: EnvConfig.clerkPublishableKey,
      ),
      child: const _ClerkAuthBridge(),
    );
  }
}

class _ClerkAuthBridge extends ConsumerStatefulWidget {
  const _ClerkAuthBridge();

  @override
  ConsumerState<_ClerkAuthBridge> createState() => _ClerkAuthBridgeState();
}

class _ClerkAuthBridgeState extends ConsumerState<_ClerkAuthBridge> {
  String? _lastSessionId;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _syncAuth();
  }

  void _syncAuth() {
    final clerkAuth = ClerkAuth.of(context);
    final session = clerkAuth.session;
    final currentSessionId = session?.id;

    // Register token getter in Riverpod for API requests
    ref.read(tokenGetterProvider.notifier).state = () async {
      try {
        final auth = ClerkAuth.of(context, listen: false);
        final tokenObj = await auth.sessionToken();
        return tokenObj.jwt;
      } catch (_) {
        return null;
      }
    };

    if (currentSessionId != _lastSessionId) {
      _lastSessionId = currentSessionId;

      if (session != null) {
        // User is signed in via Clerk; sync backend candidate profile
        Future.microtask(() async {
          await ref.read(authStateProvider.notifier).syncWithBackend();

          // Connect SignalR for real-time notifications
          try {
            final tokenObj = await clerkAuth.sessionToken();
            if (tokenObj.jwt.isNotEmpty) {
              ref.read(signalRServiceProvider).connect(tokenObj.jwt);
            }
          } catch (_) {}
        });
      } else {
        // User is signed out
        Future.microtask(() {
          ref.read(authStateProvider.notifier).setUnauthenticated();
          ref.read(signalRServiceProvider).disconnect();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'HireWise',
      theme: AppTheme.lightTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
