class UpdateProfileRequest {
  final String firstName;
  final String lastName;
  final String? phone;
  final String? profileImageUrl;

  const UpdateProfileRequest({
    required this.firstName,
    required this.lastName,
    this.phone,
    this.profileImageUrl,
  });

  Map<String, dynamic> toJson() {
    return {
      'firstName': firstName,
      'lastName': lastName,
      if (phone != null) 'phone': phone,
      if (profileImageUrl != null) 'profileImageUrl': profileImageUrl,
    };
  }
}
