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
  default     = "prod"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "backend_sa_email" {
  description = "Backend Service Account Email"
  type        = string
}

variable "frontend_sa_email" {
  description = "Frontend Service Account Email"
  type        = string
}

variable "vpc_connector_id" {
  description = "Serverless VPC Access Connector ID"
  type        = string
}

variable "api_image" {
  description = "Docker image URI for ASP.NET Core API service"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "ai_service_image" {
  description = "Docker image URI for FastAPI AI Service"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "web_image" {
  description = "Docker image URI for React Web Client (Nginx)"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "database_url" {
  description = "PostgreSQL database connection string"
  type        = string
  sensitive   = true
}

variable "redis_url" {
  description = "Memorystore Redis URL"
  type        = string
  default     = ""
}

variable "resume_bucket_name" {
  description = "GCS bucket name for candidate resumes"
  type        = string
}

variable "clerk_issuer" {
  description = "Clerk JWT Issuer authority"
  type        = string
  default     = "https://helping-anemone-4730.clerk.accounts.dev"
}

variable "clerk_publishable_key" {
  description = "Clerk Frontend Publishable Key"
  type        = string
  default     = ""
}

variable "secret_names" {
  description = "Map of Secret Manager secret names"
  type        = map(string)
}

variable "api_min_instances" {
  description = "Min API instances (0 for scale-to-zero when idle, 1+ for prod)"
  type        = number
  default     = 0
}

variable "api_max_instances" {
  description = "Max API instances"
  type        = number
  default     = 3
}

variable "ai_min_instances" {
  description = "Min AI Service instances"
  type        = number
  default     = 0
}

variable "ai_max_instances" {
  description = "Max AI Service instances"
  type        = number
  default     = 2
}

variable "web_min_instances" {
  description = "Min Web Client instances"
  type        = number
  default     = 0
}

variable "web_max_instances" {
  description = "Max Web Client instances"
  type        = number
  default     = 2
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

