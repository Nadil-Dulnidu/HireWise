output "api_uri" {
  description = "ASP.NET Core Web API Cloud Run URI"
  value       = google_cloud_run_v2_service.api.uri
}

output "ai_service_uri" {
  description = "FastAPI AI Service Cloud Run URI"
  value       = google_cloud_run_v2_service.ai_service.uri
}

output "web_uri" {
  description = "React/Vite Web Client Cloud Run URI"
  value       = google_cloud_run_v2_service.web.uri
}
