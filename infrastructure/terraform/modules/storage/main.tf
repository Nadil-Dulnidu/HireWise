resource "google_storage_bucket" "resumes" {
  name                        = "${lower(var.project_name)}-${lower(var.environment)}-resumes"
  location                    = var.region
  project                     = var.project_id
  force_destroy               = false
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition {
      num_newer_versions = 3
      with_state        = "ARCHIVED"
    }
    action {
      type = "Delete"
    }
  }

  lifecycle_rule {
    action {
      type = "AbortIncompleteMultipartUpload"
    }
    condition {
      age = 7
    }
  }
}

# Grant backend service account read/write access to the bucket
resource "google_storage_bucket_iam_member" "backend_storage_admin" {
  bucket = google_storage_bucket.resumes.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${var.backend_sa_email}"
}

# Grant public read access to resume objects if public URL sharing is enabled
# Alternatively, private access with signed URLs can be used.
resource "google_storage_bucket_iam_member" "public_resume_viewer" {
  bucket = google_storage_bucket.resumes.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
