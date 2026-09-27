# 1. FastAPI + LangGraph AI Service
resource "google_cloud_run_v2_service" "ai_service" {
  name                = "${lower(var.project_name)}-${lower(var.environment)}-ai-service"
  location            = var.region
  project             = var.project_id
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      client,
      client_version,
    ]
  }

  template {
    service_account = var.backend_sa_email

    scaling {
      min_instance_count = var.ai_min_instances
      max_instance_count = var.ai_max_instances
    }

    vpc_access {
      connector = var.vpc_connector_id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = var.ai_service_image

      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
      }

      ports {
        container_port = 8000
      }

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }
      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "GCP_REGION"
        value = var.region
      }
      env {
        name  = "GEMINI_FLASH_MODEL"
        value = "gemini-2.5-flash"
      }
      env {
        name  = "GEMINI_PRO_MODEL"
        value = "gemini-2.5-pro"
      }

      # Secrets from Secret Manager
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = var.secret_names["database_url"]
            version = "latest"
          }
        }
      }
      env {
        name = "AI_SERVICE_API_KEY"
        value_source {
          secret_key_ref {
            secret  = var.secret_names["ai_service_api_key"]
            version = "latest"
          }
        }
      }
    }
  }
}

# 2. ASP.NET Core 8 Web API Service
resource "google_cloud_run_v2_service" "api" {
  name                = "${lower(var.project_name)}-${lower(var.environment)}-api"
  location            = var.region
  project             = var.project_id
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      client,
      client_version,
    ]
  }

  template {
    service_account = var.backend_sa_email

    scaling {
      min_instance_count = var.api_min_instances
      max_instance_count = var.api_max_instances
    }

    vpc_access {
      connector = var.vpc_connector_id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = var.api_image

      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
      }

      ports {
        container_port = 8080
      }

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = var.environment == "prod" ? "Production" : "Development"
      }
      env {
        name  = "AiService__BaseUrl"
        value = google_cloud_run_v2_service.ai_service.uri
      }
      env {
        name  = "Storage__Provider"
        value = "GoogleCloudStorage"
      }
      env {
        name  = "Storage__Gcp__BucketName"
        value = var.resume_bucket_name
      }
      env {
        name  = "GoogleCalendar__Enabled"
        value = "true"
      }
      env {
        name  = "Resend__Enabled"
        value = "true"
      }
      env {
        name  = "Clerk__Authority"
        value = var.clerk_issuer
      }

      # Secrets from Secret Manager
      env {
        name = "ConnectionStrings__DefaultConnection"
        value_source {
          secret_key_ref {
            secret  = var.secret_names["database_url"]
            version = "latest"
          }
        }
      }
      env {
        name = "AiService__ApiKey"
        value_source {
          secret_key_ref {
            secret  = var.secret_names["ai_service_api_key"]
            version = "latest"
          }
        }
      }
      env {
        name = "RESEND_API_KEY"
        value_source {
          secret_key_ref {
            secret  = var.secret_names["resend_api_key"]
            version = "latest"
          }
        }
      }
      env {
        name = "Clerk__WebhookSecret"
        value_source {
          secret_key_ref {
            secret  = var.secret_names["clerk_webhook_signing_secret"]
            version = "latest"
          }
        }
      }
      env {
        name = "GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON"
        value_source {
          secret_key_ref {
            secret  = var.secret_names["google_calendar_credentials_json"]
            version = "latest"
          }
        }
      }
    }
  }
}

# 3. React / Vite Web Client (Nginx)
resource "google_cloud_run_v2_service" "web" {
  name                = "${lower(var.project_name)}-${lower(var.environment)}-web"
  location            = var.region
  project             = var.project_id
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      client,
      client_version,
    ]
  }

  template {
    service_account = var.frontend_sa_email

    scaling {
      min_instance_count = var.web_min_instances
      max_instance_count = var.web_max_instances
    }

    containers {
      image = var.web_image

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      ports {
        container_port = 80
      }

      env {
        name  = "VITE_API_BASE_URL"
        value = google_cloud_run_v2_service.api.uri
      }
      env {
        name  = "VITE_CLERK_PUBLISHABLE_KEY"
        value = var.clerk_publishable_key
      }
    }
  }
}

# Public Invocation IAM Policy Bindings
resource "google_cloud_run_v2_service_iam_member" "api_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "ai_service_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.ai_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "web_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.web.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
