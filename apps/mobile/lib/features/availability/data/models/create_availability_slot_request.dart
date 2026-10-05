class CreateAvailabilitySlotRequest {
  final int dayOfWeek;
  final String startTime;
  final String endTime;
  final String timezone;
  final bool isRecurring;
  final String? specificDate;

  const CreateAvailabilitySlotRequest({
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    this.timezone = 'UTC',
    this.isRecurring = true,
    this.specificDate,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'dayOfWeek': dayOfWeek,
      'startTime': startTime,
      'endTime': endTime,
      'timezone': timezone,
      'isRecurring': isRecurring,
    };
    if (specificDate != null) {
      map['specificDate'] = specificDate;
    }
    return map;
  }
}
