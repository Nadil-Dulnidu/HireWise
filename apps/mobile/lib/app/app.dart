import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/config/env_config.dart';
import '../core/network/api_client.dart';
import '../core/routing/app_router.dart';
import '../core/theme/app_theme.dart';
import '../features/auth/providers/auth_state_provider.dart';
import '../features/notifications/presentation/widgets/notification_banner_overlay.dart';
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
  bool _initialized = false;
  String? _lastSessionId;
  ClerkAuthState? _clerkAuth;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final auth = ClerkAuth.of(context, listen: false);
    if (_clerkAuth != auth) {
      _clerkAuth?.removeListener(_onClerkAuthChanged);
      _clerkAuth = auth;
      _clerkAuth?.addListener(_onClerkAuthChanged);
    }
    _syncAuth();
  }

  void _onClerkAuthChanged() {
    _syncAuth();
  }

  @override
  void dispose() {
    _clerkAuth?.removeListener(_onClerkAuthChanged);
    super.dispose();
  }

  void _syncAuth() {
    final clerkAuth = _clerkAuth ?? ClerkAuth.of(context, listen: false);
    final session = clerkAuth.session;
    final currentSessionId = session?.id;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;

      // Register token getter in Riverpod for API requests (set once)
      if (ref.read(tokenGetterProvider) == null) {
        ref.read(tokenGetterProvider.notifier).state = () async {
          try {
            if (!mounted) return null;
            final auth = ClerkAuth.of(context, listen: false);
            final tokenObj = await auth.sessionToken();
            return tokenObj.jwt;
          } catch (_) {
            return null;
          }
        };
      }

      if (!_initialized || currentSessionId != _lastSessionId) {
        _initialized = true;
        _lastSessionId = currentSessionId;

        if (session != null) {
          // User is signed in via Clerk; sync backend candidate profile
          ref.read(authStateProvider.notifier).syncWithBackend();

          // Connect SignalR for real-time notifications
          () async {
            try {
              final tokenObj = await clerkAuth.sessionToken();
              if (tokenObj.jwt.isNotEmpty && mounted) {
                final clerkUser = clerkAuth.user;
                ref.read(signalRServiceProvider).connect(
                      tokenObj.jwt,
                      clerkUserId: clerkUser?.id,
                    );
              }
            } catch (_) {}
          }();
        } else {
          // User is signed out
          ref.read(authStateProvider.notifier).setUnauthenticated();
          ref.read(signalRServiceProvider).disconnect();
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'HireWise',
      theme: AppTheme.lightTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      builder: (context, child) => NotificationBannerOverlay(
        child: child ?? const SizedBox.shrink(),
      ),
    );
  }
}
