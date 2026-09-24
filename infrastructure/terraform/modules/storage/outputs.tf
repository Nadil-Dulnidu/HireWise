output "bucket_name" {
  description = "Name of the GCS resumes bucket"
  value       = google_storage_bucket.resumes.name
}

output "bucket_url" {
  description = "Base URL of the GCS resumes bucket"
  value       = google_storage_bucket.resumes.url
}
