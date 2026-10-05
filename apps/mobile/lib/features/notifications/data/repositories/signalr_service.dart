import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:signalr_netcore/signalr_client.dart';
import '../../../../core/config/env_config.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../models/notification_dto.dart';

typedef NotificationCallback = void Function(NotificationDto notification);

class SignalRService {
  HubConnection? _hubConnection;
  final List<NotificationCallback> _listeners = [];
  bool _isConnected = false;
  String? _clerkUserId;

  bool get isConnected => _isConnected;

  void addListener(NotificationCallback callback) {
    _listeners.add(callback);
  }

  void removeListener(NotificationCallback callback) {
    _listeners.remove(callback);
  }

  Future<void> connect(String accessToken, {String? clerkUserId}) async {
    _clerkUserId = clerkUserId;
    if (_isConnected && _hubConnection != null) {
      if (clerkUserId != null) {
        _joinUserGroup(clerkUserId);
      }
      return;
    }

    final hubUrl = '${EnvConfig.apiBaseUrl}${ApiEndpoints.notificationHub}';

    try {
      _hubConnection = HubConnectionBuilder()
          .withUrl(
            hubUrl,
            options: HttpConnectionOptions(
              accessTokenFactory: () => Future.value(accessToken),
            ),
          )
          .withAutomaticReconnect()
          .build();

      _hubConnection!.on('ReceiveNotification', _handleReceiveNotification);

      _hubConnection!.onclose(({error}) {
        debugPrint('[SignalR] Disconnected: $error');
        _isConnected = false;
      });

      _hubConnection!.onreconnected(({connectionId}) {
        debugPrint('[SignalR] Reconnected: $connectionId');
        _isConnected = true;
        if (_clerkUserId != null) {
          _joinUserGroup(_clerkUserId!);
        }
      });

      await _hubConnection!.start();
      _isConnected = true;
      debugPrint('[SignalR] Connected successfully to $hubUrl');
      if (_clerkUserId != null) {
        _joinUserGroup(_clerkUserId!);
      }
    } catch (e) {
      _isConnected = false;
      debugPrint('[SignalR] Connection failed: $e');
    }
  }

  void _joinUserGroup(String userId) {
    try {
      _hubConnection?.invoke('JoinUserGroup', args: [userId]);
      debugPrint('[SignalR] Joined user group: user_$userId');
    } catch (e) {
      debugPrint('[SignalR] JoinUserGroup error: $e');
    }
  }

  void _handleReceiveNotification(List<Object?>? parameters) {
    debugPrint('[SignalR] _handleReceiveNotification received: $parameters');
    if (parameters != null && parameters.isNotEmpty) {
      final first = parameters.first;
      if (first is Map) {
        try {
          final map = Map<String, dynamic>.from(first);
          final notification = NotificationDto.fromJson(map);
          debugPrint('[SignalR] Notification parsed: ${notification.title}');
          for (final listener in List<NotificationCallback>.from(_listeners)) {
            listener(notification);
          }
        } catch (e) {
          debugPrint('[SignalR] Error parsing notification: $e');
        }
      }
    }
  }

  Future<void> disconnect() async {
    if (_hubConnection != null) {
      try {
        await _hubConnection!.stop();
      } catch (_) {}
      _hubConnection = null;
      _isConnected = false;
    }
  }
}
