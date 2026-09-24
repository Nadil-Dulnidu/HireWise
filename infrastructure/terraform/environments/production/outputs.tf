output "api_endpoint" {
  description = "FastAPI Production Cloud Run URI"
  value       = module.cloud_run.api_uri
}

output "client_endpoint" {
  description = "Next.js Production Frontend Cloud Run URI"
  value       = module.cloud_run.client_uri
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
