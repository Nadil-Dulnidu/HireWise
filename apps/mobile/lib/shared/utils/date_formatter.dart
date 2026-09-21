import 'package:intl/intl.dart';

class DateFormatter {
  DateFormatter._();

  static final DateFormat _dateFormat = DateFormat('MMM d, yyyy');
  static final DateFormat _timeFormat = DateFormat('h:mm a');
  static final DateFormat _dateTimeFormat = DateFormat('MMM d, yyyy • h:mm a');
  static final DateFormat _shortDate = DateFormat('MMM d');

  static String formatDate(DateTime? date) {
    if (date == null) return 'N/A';
    return _dateFormat.format(date.toLocal());
  }

  static String formatTime(DateTime? date) {
    if (date == null) return '';
    return _timeFormat.format(date.toLocal());
  }

  static String formatDateTime(DateTime? date) {
    if (date == null) return 'N/A';
    return _dateTimeFormat.format(date.toLocal());
  }

  static String formatShortDate(DateTime? date) {
    if (date == null) return '';
    return _shortDate.format(date.toLocal());
  }

  static String timeAgo(DateTime? date) {
    if (date == null) return '';
    final now = DateTime.now();
    final difference = now.difference(date.toLocal());

    if (difference.inDays > 365) {
      final years = (difference.inDays / 365).floor();
      return '$years year${years > 1 ? 's' : ''} ago';
    }
    if (difference.inDays > 30) {
      final months = (difference.inDays / 30).floor();
      return '$months month${months > 1 ? 's' : ''} ago';
    }
    if (difference.inDays > 0) {
      return '${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago';
    }
    if (difference.inHours > 0) {
      return '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago';
    }
    if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minute${difference.inMinutes > 1 ? 's' : ''} ago';
    }
    return 'Just now';
  }
}
