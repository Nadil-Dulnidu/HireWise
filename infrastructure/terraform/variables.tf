variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "HireWise"
}

variable "environment" {
  description = "Environment tag (e.g. dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "region" {
  description = "Default GCP Region"
  type        = string
  default     = "us-central1"
}

variable "github_repo" {
  description = "GitHub repository for Workload Identity Federation"
  type        = string
  default     = "Nadil-Dulnidu/HireWise"
}

variable "clerk_publishable_key" {
  description = "Clerk Frontend Publishable Key"
  type        = string
  default     = ""
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
  description = "Resend API Key for Transactional Emails"
  type        = string
  default     = ""
  sensitive   = true
}

variable "ai_service_api_key" {
  description = "Secret API Key for inter-service communication between ASP.NET API and FastAPI AI Service"
  type        = string
  default     = "hw_ai_service_secret_key"
  sensitive   = true
}

variable "google_calendar_credentials_json" {
  description = "Google Service Account JSON key for Calendar Integration"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_tier" {
  description = "Cloud SQL machine tier (e.g. db-f1-micro for low-cost demo, db-custom-2-7680 for production)"
  type        = string
  default     = "db-f1-micro"
}

variable "db_activation_policy" {
  description = "Cloud SQL activation policy (ALWAYS to run, NEVER to stop instance and save 100% compute credits)"
  type        = string
  default     = "ALWAYS"
}

variable "deletion_protection" {
  description = "Prevent accidental destruction of DB instance"
  type        = bool
  default     = false
}

variable "api_min_instances" {
  description = "Minimum API instances (0 allows scaling to zero when idle to save cost)"
  type        = number
  default     = 0
}

variable "api_image" {
  description = "Docker image for ASP.NET Core API Service"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "ai_service_image" {
  description = "Docker image for FastAPI AI Service"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "web_image" {
  description = "Docker image for React / Vite Web Client"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "gemini_model" {
  description = "Primary Gemini LLM model name for AI Service"
  type        = string
  default     = "gemini-2.5-flash"
}

variable "gemini_flash_model" {
  description = "Fast lightweight Gemini model name"
  type        = string
  default     = "gemini-2.5-flash"
}

variable "gemini_pro_model" {
  description = "Deep reasoning Gemini Pro model name"
  type        = string
  default     = "gemini-2.5-pro"
}

variable "gemini_embedding_model" {
  description = "Embedding model name for vector matching"
  type        = string
  default     = "text-embedding-004"
}

