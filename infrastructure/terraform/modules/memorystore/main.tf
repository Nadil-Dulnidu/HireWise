resource "google_redis_instance" "cache" {
  name           = "${lower(var.project_name)}-${lower(var.environment)}-redis"
  tier           = var.tier
  memory_size_gb = var.memory_size_gb
  region         = var.region
  project        = var.project_id

  authorized_network = var.network_id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"
  redis_version      = "REDIS_7_0"
  display_name       = "${var.project_name} ${var.environment} Redis Broker & Cache"

  redis_configs = {
    maxmemory-policy = "allkeys-lru"
  }

  depends_on = [var.psa_connection]
}
