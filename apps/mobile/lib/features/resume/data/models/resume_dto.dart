class ResumeDto {
  final String id;
  final String candidateId;
  final String fileUrl;
  final String fileName;
  final String fileType;
  final int fileSize;
  final DateTime uploadedAt;
  final bool isActive;

  const ResumeDto({
    required this.id,
    required this.candidateId,
    required this.fileUrl,
    required this.fileName,
    required this.fileType,
    required this.fileSize,
    required this.uploadedAt,
    required this.isActive,
  });

  factory ResumeDto.fromJson(Map<String, dynamic> json) {
    return ResumeDto(
      id: json['id'] as String? ?? '',
      candidateId: json['candidateId'] as String? ?? '',
      fileUrl: json['fileUrl'] as String? ?? '',
      fileName: json['fileName'] as String? ?? '',
      fileType: json['fileType'] as String? ?? '',
      fileSize: json['fileSize'] as int? ?? 0,
      uploadedAt: json['uploadedAt'] != null
          ? DateTime.tryParse(json['uploadedAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      isActive: json['isActive'] as bool? ?? false,
    );
  }

  String get formattedFileSize {
    if (fileSize <= 0) return '0 KB';
    if (fileSize < 1024 * 1024) {
      return '${(fileSize / 1024).toStringAsFixed(1)} KB';
    }
    return '${(fileSize / (1024 * 1024)).toStringAsFixed(2)} MB';
  }
}
