import 'package:flutter/foundation.dart';

class EnvConfig {
  EnvConfig._();

  static const String _definedBaseUrl = String.fromEnvironment('API_BASE_URL');
  static String? _customBaseUrl;

  static String get apiBaseUrl {
    if (_customBaseUrl != null && _customBaseUrl!.isNotEmpty) {
      return _customBaseUrl!;
    }
    if (_definedBaseUrl.isNotEmpty) return _definedBaseUrl;
    if (kIsWeb) return 'http://localhost:5101';
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5101';
    }
    return 'http://localhost:5101';
  }

  static set apiBaseUrl(String url) {
    _customBaseUrl = url.trim().replaceAll(RegExp(r'/+$'), '');
  }

  static const String clerkPublishableKey = String.fromEnvironment(
    'CLERK_PUBLISHABLE_KEY',
    defaultValue:
        'pk_test_aGVscGluZy1hbmVtb25lLTQ3MzAuY2xlcmsuYWNjb3VudHMuZGV2JA',
  );

  static bool get isConfigured => clerkPublishableKey.isNotEmpty;
}
