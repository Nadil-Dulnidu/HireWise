import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../providers/resume_provider.dart';

// Modal bottom sheet widget for picking and uploading candidate resume files
class UploadResumeSheet extends ConsumerStatefulWidget {
  const UploadResumeSheet({super.key});

  @override
  ConsumerState<UploadResumeSheet> createState() => _UploadResumeSheetState();
}

class _UploadResumeSheetState extends ConsumerState<UploadResumeSheet> {
  PlatformFile? _selectedFile;
  String? _validationError;

  // Open system file picker to select and validate resume document
  Future<void> _pickFile() async {
    setState(() {
      _validationError = null;
    });

    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx'],
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;

        // Validation: Max 10MB (10 * 1024 * 1024 bytes)
        if (file.size > 10 * 1024 * 1024) {
          setState(() {
            _validationError = 'File size exceeds 10MB limit.';
            _selectedFile = null;
          });
          return;
        }

        if (file.path == null) {
          setState(() {
            _validationError = 'Could not access the selected file.';
            _selectedFile = null;
          });
          return;
        }

        setState(() {
          _selectedFile = file;
          _validationError = null;
        });
      }
    } catch (e) {
      setState(() {
        _validationError = 'Failed to select file: $e';
      });
    }
  }

  // Upload selected resume file to server and show feedback
  Future<void> _upload() async {
    if (_selectedFile == null || _selectedFile!.path == null) return;

    final success = await ref.read(resumeProvider.notifier).uploadResume(
          _selectedFile!.path!,
          _selectedFile!.name,
        );

    if (mounted) {
      if (success) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Resume uploaded successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        final error = ref.read(resumeProvider).errorMessage;
        setState(() {
          _validationError = error ?? 'Failed to upload resume.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final resumeState = ref.watch(resumeProvider);
    final isUploading = resumeState.isUploading;

    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 28,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
          const Text(
            'Upload Resume',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.slate900,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Supported formats: PDF, DOC, DOCX (Max 10MB)',
            style: TextStyle(fontSize: 13, color: AppColors.slate500),
          ),
          const SizedBox(height: 20),

          // File selection box
          InkWell(
            onTap: isUploading ? null : _pickFile,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.slate50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _selectedFile != null
                      ? AppColors.primary
                      : AppColors.slate300,
                  style: BorderStyle.solid,
                ),
              ),
              child: Column(
                children: [
                  Icon(
                    _selectedFile != null
                        ? Icons.check_circle_rounded
                        : Icons.cloud_upload_outlined,
                    size: 36,
                    color: _selectedFile != null
                        ? AppColors.primary
                        : AppColors.slate400,
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _selectedFile != null
                        ? _selectedFile!.name
                        : 'Tap to browse files',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: _selectedFile != null
                          ? AppColors.slate900
                          : AppColors.primary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (_selectedFile != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      '${(_selectedFile!.size / 1024).toStringAsFixed(1)} KB',
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.slate500),
                    ),
                  ],
                ],
              ),
            ),
          ),

          if (_validationError != null) ...[
            const SizedBox(height: 12),
            Text(
              _validationError!,
              style: const TextStyle(fontSize: 13, color: AppColors.error),
            ),
          ],

          if (isUploading) ...[
            const SizedBox(height: 16),
            LinearProgressIndicator(
              value: resumeState.uploadProgress > 0
                  ? resumeState.uploadProgress
                  : null,
              color: AppColors.primary,
              backgroundColor: AppColors.slate200,
            ),
            const SizedBox(height: 8),
            Center(
              child: Text(
                'Uploading... ${(resumeState.uploadProgress * 100).toInt()}%',
                style: const TextStyle(fontSize: 12, color: AppColors.slate600),
              ),
            ),
          ],

          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _selectedFile == null || isUploading ? null : _upload,
              child: isUploading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Upload & Set Active'),
            ),
          ),
        ],
      ),
    );
  }
}
