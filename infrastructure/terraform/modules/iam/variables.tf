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

variable "enable_workload_identity" {
  description = "Enable GitHub Actions OIDC Workload Identity Federation"
  type        = bool
  default     = true
}

variable "github_repo" {
  description = "GitHub repository (e.g. Nadil-Dulnidu/HireWise)"
  type        = string
  default     = "Nadil-Dulnidu/HireWise"
}
