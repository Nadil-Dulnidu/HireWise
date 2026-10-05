output "api_endpoint" {
  description = "ASP.NET Core API Cloud Run URI"
  value       = module.cloud_run.api_uri
}

output "ai_service_endpoint" {
  description = "FastAPI AI Service Cloud Run URI"
  value       = module.cloud_run.ai_service_uri
}

output "web_endpoint" {
  description = "React / Vite Web Client Cloud Run URI"
  value       = module.cloud_run.web_uri
}

output "resumes_bucket_name" {
  description = "GCS Resumes Bucket Name"
  value       = module.storage.bucket_name
}

output "artifact_registry_docker_url" {
  description = "Artifact Registry Docker URL"
  value       = module.artifact_registry.docker_url
}

output "workload_identity_provider" {
  description = "GitHub Actions Workload Identity Provider"
  value       = module.iam.workload_identity_provider
}

output "github_cd_sa_email" {
  description = "GitHub Actions Service Account Email"
  value       = module.iam.github_cd_sa_email
}

output "database_password" {
  description = "Cloud SQL application user password"
  value       = module.cloud_sql.db_password
  sensitive   = true
}

output "database_url" {
  description = "Cloud SQL database connection string"
  value       = module.cloud_sql.database_url
  sensitive   = true
}
