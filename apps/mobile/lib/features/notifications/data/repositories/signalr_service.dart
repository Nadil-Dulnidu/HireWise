import 'dart:async';
import 'package:signalr_netcore/signalr_client.dart';
import '../../../../core/config/env_config.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../models/notification_dto.dart';

typedef NotificationCallback = void Function(NotificationDto notification);

class SignalRService {
  HubConnection? _hubConnection;
  final List<NotificationCallback> _listeners = [];
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  void addListener(NotificationCallback callback) {
    _listeners.add(callback);
  }

  void removeListener(NotificationCallback callback) {
    _listeners.remove(callback);
  }

  Future<void> connect(String accessToken) async {
    if (_isConnected && _hubConnection != null) return;

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
        _isConnected = false;
      });

      _hubConnection!.onreconnected(({connectionId}) {
        _isConnected = true;
      });

      await _hubConnection!.start();
      _isConnected = true;
    } catch (e) {
      _isConnected = false;
      // SignalR connection failure is handled gracefully without crashing the app
    }
  }

  void _handleReceiveNotification(List<Object?>? parameters) {
    if (parameters != null && parameters.isNotEmpty) {
      final first = parameters.first;
      if (first is Map<String, dynamic>) {
        final notification = NotificationDto.fromJson(first);
        for (final listener in _listeners) {
          listener(notification);
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
