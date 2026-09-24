provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

locals {
  gcp_services = [
    "compute.googleapis.com",
    "vpcaccess.googleapis.com",
    "servicenetworking.googleapis.com",
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "secretmanager.googleapis.com",
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "aiplatform.googleapis.com",
    "storage.googleapis.com",
    "calendar-json.googleapis.com",
  ]
}

resource "google_project_service" "services" {
  for_each           = toset(local.gcp_services)
  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}

# 1. VPC & Networking
module "vpc" {
  source         = "./modules/vpc"
  project_id     = var.project_id
  project_name   = var.project_name
  environment    = var.environment
  region         = var.region
  subnet_cidr    = "10.0.0.0/20"
  connector_cidr = "10.20.0.0/28"

  depends_on = [google_project_service.services]
}

# 2. Cloud SQL PostgreSQL 16
module "cloud_sql" {
  source              = "./modules/cloud_sql"
  project_id          = var.project_id
  project_name        = var.project_name
  environment         = var.environment
  region              = var.region
  network_id          = module.vpc.network_id
  psa_connection      = module.vpc.psa_connection
  tier                = var.db_tier
  availability_type   = "ZONAL"
  disk_size           = 20
  deletion_protection = var.deletion_protection

  depends_on = [google_project_service.services, module.vpc]
}

# 3. Memorystore Redis 7
module "memorystore" {
  source         = "./modules/memorystore"
  project_id     = var.project_id
  project_name   = var.project_name
  environment    = var.environment
  region         = var.region
  network_id     = module.vpc.network_id
  psa_connection = module.vpc.psa_connection
  tier           = "BASIC"
  memory_size_gb = 1

  depends_on = [google_project_service.services, module.vpc]
}

# 4. Artifact Registry
module "artifact_registry" {
  source       = "./modules/artifact_registry"
  project_id   = var.project_id
  project_name = var.project_name
  environment  = var.environment
  region       = var.region

  depends_on = [google_project_service.services]
}

# 5. IAM & Workload Identity
module "iam" {
  source                   = "./modules/iam"
  project_id               = var.project_id
  project_name             = var.project_name
  environment              = var.environment
  enable_workload_identity = true
  github_repo              = var.github_repo

  depends_on = [google_project_service.services]
}

# 6. Cloud Storage (Resumes Bucket)
module "storage" {
  source           = "./modules/storage"
  project_id       = var.project_id
  project_name     = var.project_name
  environment      = var.environment
  region           = var.region
  backend_sa_email = module.iam.backend_sa_email

  depends_on = [google_project_service.services, module.iam]
}

# 7. Secret Manager
module "secret_manager" {
  source                           = "./modules/secret_manager"
  project_id                       = var.project_id
  project_name                     = var.project_name
  environment                      = var.environment
  clerk_secret_key                 = var.clerk_secret_key
  clerk_webhook_signing_secret     = var.clerk_webhook_signing_secret
  resend_api_key                   = var.resend_api_key
  ai_service_api_key               = var.ai_service_api_key
  google_calendar_credentials_json = var.google_calendar_credentials_json
  database_url                     = module.cloud_sql.database_url

  depends_on = [google_project_service.services]
}

# 8. Cloud Run Services (API, AI Service, Web Client)
module "cloud_run" {
  source                = "./modules/cloud_run"
  project_id            = var.project_id
  project_name          = var.project_name
  environment           = var.environment
  region                = var.region
  backend_sa_email      = module.iam.backend_sa_email
  frontend_sa_email     = module.iam.frontend_sa_email
  vpc_connector_id      = module.vpc.connector_id
  api_image             = var.api_image
  ai_service_image      = var.ai_service_image
  web_image             = var.web_image
  database_url          = module.cloud_sql.database_url
  redis_url             = module.memorystore.redis_url
  resume_bucket_name    = module.storage.bucket_name
  clerk_publishable_key = var.clerk_publishable_key
  secret_names          = module.secret_manager.secret_names
  api_min_instances     = var.api_min_instances

  depends_on = [google_project_service.services, module.storage, module.secret_manager]
}
