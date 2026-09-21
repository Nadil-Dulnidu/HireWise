import '../../../../shared/models/enums.dart';

class NotificationDto {
  final String id;
  final String userId;
  final String title;
  final String message;
  final NotificationType type;
  final String? referenceType;
  final String? referenceId;
  final bool isRead;
  final DateTime? readAt;
  final DateTime createdAt;

  const NotificationDto({
    required this.id,
    required this.userId,
    required this.title,
    required this.message,
    required this.type,
    this.referenceType,
    this.referenceId,
    required this.isRead,
    this.readAt,
    required this.createdAt,
  });

  factory NotificationDto.fromJson(Map<String, dynamic> json) {
    final typeStr = json['type'] as String? ?? 'GENERAL';

    final type = NotificationType.values.firstWhere(
      (t) => t.name.toUpperCase() == typeStr.replaceAll('_', '').toUpperCase(),
      orElse: () => NotificationType.values.firstWhere(
        (t) => t.name.toUpperCase() == typeStr.toUpperCase(),
        orElse: () => NotificationType.general,
      ),
    );

    return NotificationDto(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      message: json['message'] as String? ?? '',
      type: type,
      referenceType: json['referenceType'] as String?,
      referenceId: json['referenceId'] as String?,
      isRead: json['isRead'] as bool? ?? false,
      readAt: json['readAt'] != null
          ? DateTime.tryParse(json['readAt'] as String)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  NotificationDto copyWith({bool? isRead, DateTime? readAt}) {
    return NotificationDto(
      id: id,
      userId: userId,
      title: title,
      message: message,
      type: type,
      referenceType: referenceType,
      referenceId: referenceId,
      isRead: isRead ?? this.isRead,
      readAt: readAt ?? this.readAt,
      createdAt: createdAt,
    );
  }
}
