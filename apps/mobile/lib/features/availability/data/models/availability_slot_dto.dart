class AvailabilitySlotDto {
  final String id;
  final String userId;
  final String userName;
  final int dayOfWeek; // 0=Sunday, 1=Monday, ..., 6=Saturday
  final String startTime;
  final String endTime;
  final String timezone;
  final bool isRecurring;
  final String? specificDate;
  final DateTime createdAt;

  const AvailabilitySlotDto({
    required this.id,
    required this.userId,
    required this.userName,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    required this.timezone,
    required this.isRecurring,
    this.specificDate,
    required this.createdAt,
  });

  static int parseDayOfWeek(dynamic value) {
    if (value is int) return value;
    if (value is String) {
      switch (value.toLowerCase()) {
        case 'sunday':
          return 0;
        case 'monday':
          return 1;
        case 'tuesday':
          return 2;
        case 'wednesday':
          return 3;
        case 'thursday':
          return 4;
        case 'friday':
          return 5;
        case 'saturday':
          return 6;
      }
    }
    return 1;
  }

  factory AvailabilitySlotDto.fromJson(Map<String, dynamic> json) {
    return AvailabilitySlotDto(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      userName: json['userName'] as String? ?? '',
      dayOfWeek: parseDayOfWeek(json['dayOfWeek']),
      startTime: json['startTime'] as String? ?? '09:00:00',
      endTime: json['endTime'] as String? ?? '17:00:00',
      timezone: json['timezone'] as String? ?? 'UTC',
      isRecurring: json['isRecurring'] as bool? ?? true,
      specificDate: json['specificDate'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  String get dayName {
    switch (dayOfWeek) {
      case 0:
        return 'Sunday';
      case 1:
        return 'Monday';
      case 2:
        return 'Tuesday';
      case 3:
        return 'Wednesday';
      case 4:
        return 'Thursday';
      case 5:
        return 'Friday';
      case 6:
        return 'Saturday';
      default:
        return 'Day $dayOfWeek';
    }
  }

  String get dayShortName {
    switch (dayOfWeek) {
      case 0:
        return 'Sun';
      case 1:
        return 'Mon';
      case 2:
        return 'Tue';
      case 3:
        return 'Wed';
      case 4:
        return 'Thu';
      case 5:
        return 'Fri';
      case 6:
        return 'Sat';
      default:
        return 'Day';
    }
  }

  static String formatTimeString(String time) {
    try {
      final parts = time.split(':');
      if (parts.length >= 2) {
        final hour = int.parse(parts[0]);
        final minute = int.parse(parts[1]);
        final period = hour >= 12 ? 'PM' : 'AM';
        final h12 = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
        final mStr = minute.toString().padLeft(2, '0');
        return '$h12:$mStr $period';
      }
    } catch (_) {}
    return time;
  }

  String get formattedStartTime => formatTimeString(startTime);
  String get formattedEndTime => formatTimeString(endTime);
  String get formattedTimeRange => '$formattedStartTime – $formattedEndTime';
}
