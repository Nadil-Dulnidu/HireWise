terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 6.0"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Production remote state bucket
  # backend "gcs" {
  #   bucket = "triagen-production-tf-state"
  #   prefix = "terraform/state"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# 1. VPC & Networking
module "vpc" {
  source                 = "../../modules/vpc"
  project_id             = var.project_id
  project_name           = var.project_name
  environment            = "production"
  region                 = var.region
  subnet_cidr            = "10.20.0.0/20"
  connector_cidr         = "10.28.0.0/28"
  connector_min_instances = 2
  connector_max_instances = 5
}

# 2. Cloud SQL PostgreSQL 16 (HA Regional Cluster)
module "cloud_sql" {
  source              = "../../modules/cloud_sql"
  project_id          = var.project_id
  project_name        = var.project_name
  environment         = "production"
  region              = var.region
  network_id          = module.vpc.network_id
  psa_connection      = module.vpc.network_id
  tier                = "db-custom-4-15360" # 4 vCPU, 15GB RAM
  availability_type   = "REGIONAL"          # Multi-zone High Availability
  disk_size           = 50
  deletion_protection = true
}

# 3. Memorystore Redis 7 (High Availability)
module "memorystore" {
  source         = "../../modules/memorystore"
  project_id     = var.project_id
  project_name   = var.project_name
  environment    = "production"
  region         = var.region
  network_id     = module.vpc.network_id
  psa_connection = module.vpc.network_id
  tier           = "STANDARD_HA"
  memory_size_gb = 4
}

# 4. Artifact Registry
module "artifact_registry" {
  source       = "../../modules/artifact_registry"
  project_id   = var.project_id
  project_name = var.project_name
  environment  = "production"
  region       = var.region
}

# 5. Secret Manager
module "secret_manager" {
  source                       = "../../modules/secret_manager"
  project_id                   = var.project_id
  project_name                 = var.project_name
  environment                  = "production"
  github_app_private_key       = var.github_app_private_key
  github_webhook_secret        = var.github_webhook_secret
  clerk_secret_key             = var.clerk_secret_key
  clerk_webhook_signing_secret = var.clerk_webhook_signing_secret
  pinecone_api_key             = var.pinecone_api_key
  database_url                 = module.cloud_sql.database_url
}

# 6. IAM & Workload Identity
module "iam" {
  source                   = "../../modules/iam"
  project_id               = var.project_id
  project_name             = var.project_name
  environment              = "production"
  enable_workload_identity = true
  github_repo              = var.github_repo
}

# 7. Cloud Run Services (Production auto-scaling & min instances)
module "cloud_run" {
  source                = "../../modules/cloud_run"
  project_id            = var.project_id
  project_name          = var.project_name
  environment           = "production"
  region                = var.region
  backend_sa_email      = module.iam.backend_sa_email
  frontend_sa_email     = module.iam.frontend_sa_email
  vpc_connector_id      = module.vpc.connector_id
  api_image             = var.api_image
  client_image          = var.client_image
  database_url          = module.cloud_sql.database_url
  redis_url             = module.memorystore.redis_url
  github_app_id         = var.github_app_id
  clerk_publishable_key = var.clerk_publishable_key
  secret_names          = module.secret_manager.secret_names
  api_min_instances     = 2  # Zero cold-start for API
  api_max_instances     = 20
  worker_min_instances  = 2  # Constant concurrency for review workers
  worker_max_instances  = 10
  client_min_instances  = 1
  client_max_instances  = 10
}
