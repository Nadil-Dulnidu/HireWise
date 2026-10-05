import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/availability_slot_dto.dart';

class AvailabilitySlotCard extends StatelessWidget {
  final AvailabilitySlotDto slot;
  final VoidCallback onDelete;

  const AvailabilitySlotCard({
    super.key,
    required this.slot,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.slate200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Day Badge Container
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: slot.isRecurring
                    ? AppColors.primary.withOpacity(0.08)
                    : AppColors.slate600.withOpacity(0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: slot.isRecurring
                      ? AppColors.primary.withOpacity(0.2)
                      : AppColors.slate600.withOpacity(0.2),
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    slot.isRecurring ? slot.dayShortName : 'Date',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: slot.isRecurring
                          ? AppColors.primary
                          : AppColors.slate600,
                    ),
                  ),
                  if (slot.isRecurring)
                    const Text(
                      'Day',
                      style: TextStyle(
                        fontSize: 9,
                        color: AppColors.slate500,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 14),

            // Slot Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        slot.isRecurring
                            ? slot.dayName
                            : (slot.specificDate ?? 'Specific Date'),
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.slate900,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: slot.isRecurring
                              ? AppColors.successContainer
                              : AppColors.infoContainer,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          slot.isRecurring ? 'Recurring' : 'One-time',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: slot.isRecurring
                                ? AppColors.success
                                : AppColors.info,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(
                        Icons.access_time_rounded,
                        size: 14,
                        color: AppColors.slate500,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        slot.formattedTimeRange,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.slate700,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '(${slot.timezone})',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.slate400,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Delete action button
            IconButton(
              icon: const Icon(
                Icons.delete_outline_rounded,
                color: AppColors.error,
                size: 20,
              ),
              tooltip: 'Remove slot',
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Delete Time Slot'),
                    content: Text(
                      'Are you sure you want to remove your ${slot.dayName} slot (${slot.formattedTimeRange})?',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.of(ctx).pop(false),
                        child: const Text('Cancel'),
                      ),
                      ElevatedButton(
                        onPressed: () => Navigator.of(ctx).pop(true),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.error,
                        ),
                        child: const Text('Delete'),
                      ),
                    ],
                  ),
                );
                if (confirm == true) {
                  onDelete();
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
