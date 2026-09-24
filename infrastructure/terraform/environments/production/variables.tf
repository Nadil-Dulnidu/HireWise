variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "triagen"
}

variable "region" {
  description = "Default GCP Region"
  type        = string
  default     = "us-central1"
}

variable "github_repo" {
  description = "GitHub repository for Workload Identity"
  type        = string
  default     = "Nadil-Dulnidu/Triagen"
}

variable "github_app_id" {
  description = "GitHub App ID"
  type        = string
}

variable "github_app_private_key" {
  description = "GitHub App Private Key (PEM)"
  type        = string
  sensitive   = true
}

variable "github_webhook_secret" {
  description = "GitHub Webhook Secret"
  type        = string
  sensitive   = true
}

variable "clerk_publishable_key" {
  description = "Clerk Frontend Publishable Key"
  type        = string
}

variable "clerk_secret_key" {
  description = "Clerk Backend Secret Key"
  type        = string
  sensitive   = true
}

variable "clerk_webhook_signing_secret" {
  description = "Clerk Svix Webhook Signing Secret"
  type        = string
  sensitive   = true
}

variable "pinecone_api_key" {
  description = "Pinecone API Key"
  type        = string
  sensitive   = true
}

variable "api_image" {
  description = "Initial Docker image for API/Worker"
  type        = string
  default     = "us-central1-docker.pkg.dev/triagen-production/triagen-production-repo/triagen-api:latest"
}

variable "client_image" {
  description = "Initial Docker image for Next.js Client"
  type        = string
  default     = "us-central1-docker.pkg.dev/triagen-production/triagen-production-repo/triagen-client:latest"
}
