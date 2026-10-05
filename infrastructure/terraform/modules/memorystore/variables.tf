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

variable "network_id" {
  description = "VPC network ID for Private Service Access"
  type        = string
}

variable "psa_connection" {
  description = "Private Service Access peering resource"
  type        = any
}

variable "tier" {
  description = "BASIC or STANDARD_HA"
  type        = string
  default     = "BASIC"
}

variable "memory_size_gb" {
  description = "Redis memory capacity in GiB"
  type        = number
  default     = 1
}
