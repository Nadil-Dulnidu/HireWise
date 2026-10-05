variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "project_name" {
  description = "Application project prefix"
  type        = string
  default     = "triagen"
}

variable "environment" {
  description = "Deployment environment (staging/production)"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}
