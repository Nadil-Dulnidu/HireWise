import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../utils/currency_formatter.dart';

class SalaryRangeWidget extends StatelessWidget {
  final num? minSalary;
  final num? maxSalary;
  final TextStyle? style;

  const SalaryRangeWidget({
    super.key,
    this.minSalary,
    this.maxSalary,
    this.style,
  });

  @override
  Widget build(BuildContext context) {
    final text = CurrencyFormatter.formatRange(minSalary, maxSalary);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(
          Icons.payments_outlined,
          size: 16,
          color: AppColors.slate500,
        ),
        const SizedBox(width: 4),
        Text(
          text,
          style: style ??
              const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppColors.slate700,
              ),
        ),
      ],
    );
  }
}
