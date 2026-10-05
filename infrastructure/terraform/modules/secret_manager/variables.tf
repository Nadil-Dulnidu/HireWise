variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "project_name" {
  description = "Application project prefix"
  type        = string
  default     = "hirewise"
}

variable "environment" {
  description = "Deployment environment (staging/production)"
  type        = string
}

variable "clerk_secret_key" {
  description = "Clerk Backend Secret Key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "clerk_webhook_signing_secret" {
  description = "Clerk Webhook Signing Secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "resend_api_key" {
  description = "Resend Transactional Email API Key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "ai_service_api_key" {
  description = "Secret API key for ASP.NET to FastAPI AI Service authentication"
  type        = string
  default     = ""
  sensitive   = true
}

variable "google_calendar_credentials_json" {
  description = "Google Service Account JSON key for Calendar integration"
  type        = string
  default     = ""
  sensitive   = true
}

variable "database_url" {
  description = "PostgreSQL Database Connection String"
  type        = string
  default     = ""
  sensitive   = true
}
