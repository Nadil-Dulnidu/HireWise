class ApplyJobRequest {
  final String? coverLetter;

  const ApplyJobRequest({this.coverLetter});

  Map<String, dynamic> toJson() {
    return {
      if (coverLetter != null && coverLetter!.trim().isNotEmpty)
        'coverLetter': coverLetter!.trim(),
    };
  }
}
