import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../providers/availability_provider.dart';
import 'add_availability_slot_sheet.dart';
import 'availability_slot_card.dart';

class AvailabilityView extends ConsumerStatefulWidget {
  const AvailabilityView({super.key});

  @override
  ConsumerState<AvailabilityView> createState() => _AvailabilityViewState();
}

class _AvailabilityViewState extends ConsumerState<AvailabilityView> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(availabilityProvider.notifier).loadAvailability();
    });
  }

  void _openAddSlotModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => const AddAvailabilitySlotSheet(),
    );
  }

  Future<void> _addStandardSchedule() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Standard Schedule'),
        content: const Text(
          'This will add Monday through Friday availability slots from 9:00 AM to 5:00 PM. Continue?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Add Schedule'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      final success = await ref
          .read(availabilityProvider.notifier)
          .addStandardWeekdaySchedule();
      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Standard weekday schedule added!'),
              backgroundColor: AppColors.success,
              behavior: SnackBarBehavior.floating,
            ),
          );
        } else {
          final err = ref.read(availabilityProvider).errorMessage ??
              'Failed to add schedule.';
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(err),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(availabilityProvider);

    if (state.isLoading && state.slots.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (state.errorMessage != null && state.slots.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline_rounded,
                size: 56,
                color: AppColors.error,
              ),
              const SizedBox(height: 16),
              const Text(
                'Could not load availability',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.slate900,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                state.errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.slate500,
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () =>
                    ref.read(availabilityProvider.notifier).loadAvailability(),
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () =>
          ref.read(availabilityProvider.notifier).loadAvailability(),
      child: CustomScrollView(
        slivers: [
          // Info & Quick Action Banner
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary.withOpacity(0.08),
                      AppColors.primaryContainer.withOpacity(0.3),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppColors.primary.withOpacity(0.2),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.calendar_month_rounded,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Manage Your Interview Hours',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.slate900,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Recruiters can only book interviews in your set slots.',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.slate600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: state.isSubmitting
                                ? null
                                : _addStandardSchedule,
                            icon: const Icon(Icons.flash_on_rounded, size: 16),
                            label: const Text('Fill Weekdays (9–5)'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.primaryDark,
                              backgroundColor: Colors.white,
                              side: BorderSide(
                                color: AppColors.primary.withOpacity(0.4),
                              ),
                              padding: const EdgeInsets.symmetric(
                                  vertical: 10, horizontal: 12),
                              textStyle: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton.icon(
                          onPressed: _openAddSlotModal,
                          icon: const Icon(Icons.add_rounded, size: 18),
                          label: const Text('Add Slot'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                                vertical: 10, horizontal: 16),
                            textStyle: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Header for Slots List
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(18, 12, 18, 6),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Active Slots (${state.slots.length})',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.slate800,
                    ),
                  ),
                  if (state.slots.isNotEmpty)
                    TextButton.icon(
                      onPressed: _openAddSlotModal,
                      icon: const Icon(Icons.add_circle_outline_rounded,
                          size: 16),
                      label: const Text('Add Slot'),
                      style: TextButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                        padding: EdgeInsets.zero,
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Empty state
          if (state.slots.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.06),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.event_available_rounded,
                          size: 54,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 20),
                      const Text(
                        'No Availability Slots Set',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.slate900,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Add recurring weekly times or specific dates so recruiters can easily schedule interviews with you.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.slate500,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: _addStandardSchedule,
                        icon: const Icon(Icons.auto_awesome_rounded, size: 18),
                        label: const Text('Quick Setup: Mon–Fri 9am–5pm'),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: _openAddSlotModal,
                        icon: const Icon(Icons.add_rounded, size: 18),
                        label: const Text('Add Custom Slot'),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else
            // Slots List
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final slot = state.slots[index];
                  return AvailabilitySlotCard(
                    slot: slot,
                    onDelete: () => ref
                        .read(availabilityProvider.notifier)
                        .deleteSlot(slot.id),
                  );
                },
                childCount: state.slots.length,
              ),
            ),

          const SliverToBoxAdapter(
            child: SizedBox(height: 32),
          ),
        ],
      ),
    );
  }
}
