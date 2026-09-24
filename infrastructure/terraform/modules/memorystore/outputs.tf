output "host" {
  description = "Redis host IP"
  value       = google_redis_instance.cache.host
}

output "port" {
  description = "Redis port"
  value       = google_redis_instance.cache.port
}

output "redis_url" {
  description = "Redis connection string"
  value       = "redis://${google_redis_instance.cache.host}:${google_redis_instance.cache.port}/0"
}
