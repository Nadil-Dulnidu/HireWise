import 'package:intl/intl.dart';

class CurrencyFormatter {
  CurrencyFormatter._();

  static final NumberFormat _fullCurrencyFormat =
      NumberFormat.simpleCurrency(decimalDigits: 0);

  static String formatRange(num? min, num? max, {String currency = 'USD'}) {
    if (min == null && max == null) return 'Salary undisclosed';
    if (min != null && max != null) {
      if (min == max) return _format(min);
      return '${_format(min)} - ${_format(max)}';
    }
    if (min != null) return 'From ${_format(min)}';
    return 'Up to ${_format(max!)}';
  }

  static String _format(num amount) {
    if (amount >= 1000) {
      return '\$${(amount / 1000).toStringAsFixed(amount % 1000 == 0 ? 0 : 1)}k';
    }
    return _fullCurrencyFormat.format(amount);
  }
}
