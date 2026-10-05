import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/enums.dart';
import '../../data/models/job_filter_request.dart';

class JobFilterSheet extends StatefulWidget {
  final JobFilterRequest initialFilter;
  final ValueChanged<JobFilterRequest> onApply;

  const JobFilterSheet({
    super.key,
    required this.initialFilter,
    required this.onApply,
  });

  @override
  State<JobFilterSheet> createState() => _JobFilterSheetState();
}

class _JobFilterSheetState extends State<JobFilterSheet> {
  late EmploymentType? _employmentType;
  late ExperienceLevel? _experienceLevel;
  late final TextEditingController _minSalaryController;

  @override
  void initState() {
    super.initState();
    _employmentType = widget.initialFilter.employmentType;
    _experienceLevel = widget.initialFilter.experienceLevel;
    _minSalaryController = TextEditingController(
      text: widget.initialFilter.minSalary?.toString() ?? '',
    );
  }

  @override
  void dispose() {
    _minSalaryController.dispose();
    super.dispose();
  }

  void _reset() {
    setState(() {
      _employmentType = null;
      _experienceLevel = null;
      _minSalaryController.clear();
    });
  }

  void _apply() {
    final minSalary = num.tryParse(_minSalaryController.text.trim());
    final newFilter = widget.initialFilter.copyWith(
      employmentType: _employmentType,
      experienceLevel: _experienceLevel,
      minSalary: minSalary,
      clearEmploymentType: _employmentType == null,
      clearExperienceLevel: _experienceLevel == null,
    );
    widget.onApply(newFilter);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.slate300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Filter Jobs',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.slate900,
                  ),
                ),
                TextButton(
                  onPressed: _reset,
                  child: const Text('Reset'),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Employment Type
            const Text(
              'Employment Type',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.slate800,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: EmploymentType.values.map((type) {
                final isSelected = _employmentType == type;
                return ChoiceChip(
                  label: Text(type.displayName),
                  selected: isSelected,
                  selectedColor: AppColors.primaryContainer,
                  labelStyle: TextStyle(
                    color:
                        isSelected ? AppColors.primaryDark : AppColors.slate700,
                    fontWeight:
                        isSelected ? FontWeight.w600 : FontWeight.normal,
                    fontSize: 13,
                  ),
                  onSelected: (selected) {
                    setState(() {
                      _employmentType = selected ? type : null;
                    });
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            // Experience Level
            const Text(
              'Experience Level',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.slate800,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ExperienceLevel.values.map((level) {
                final isSelected = _experienceLevel == level;
                return ChoiceChip(
                  label: Text(level.displayName),
                  selected: isSelected,
                  selectedColor: AppColors.primaryContainer,
                  labelStyle: TextStyle(
                    color:
                        isSelected ? AppColors.primaryDark : AppColors.slate700,
                    fontWeight:
                        isSelected ? FontWeight.w600 : FontWeight.normal,
                    fontSize: 13,
                  ),
                  onSelected: (selected) {
                    setState(() {
                      _experienceLevel = selected ? level : null;
                    });
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            // Min Salary
            const Text(
              'Minimum Salary (USD)',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.slate800,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _minSalaryController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                hintText: 'e.g. 80000',
                prefixText: '\$ ',
              ),
            ),
            const SizedBox(height: 28),

            // Apply Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _apply,
                child: const Text('Apply Filters'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
