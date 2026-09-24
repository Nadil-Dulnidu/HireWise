# HireWise — Deployment & DevOps Operations Guide

> **Version:** 1.0.0  
> **Platforms:** Local Docker Compose / Google Cloud Platform (GCP) via Terraform  
> **Target Audience:** DevOps Engineers, SREs, Platform Architects

---

## 1. Architecture Topology

HireWise supports two deployment paradigms:
1. **Local Monorepo Orchestration**: A single `docker-compose.yml` spinning up PostgreSQL 16, Redis 7, ASP.NET Core API, FastAPI AI Service, and Vite/Nginx Web Client.
2. **Production Cloud-Native (GCP)**: A fully automated Terraform deployment using serverless **Google Cloud Run v2**, private **Cloud SQL PostgreSQL**, **Memorystore Redis**, and **Cloud Storage**.

---

## 2. Local Containerized Deployment

Run the complete HireWise server stack locally with Docker Compose:

### 2.1 Starting Services
```bash
# From repository root
docker compose up -d --build
```

### 2.2 Verifying Service Health
```bash
docker compose ps
```

| Service | Container Name | Local Port | Health Check |
|---|---|---|---|
| PostgreSQL 16 | `hirewise-postgres` | `5432` | `pg_isready -U hirewise_user` |
| Redis 7 | `hirewise-redis` | `6379` | `redis-cli ping` |
| ASP.NET Core API | `hirewise-api` | `5101` | `http://localhost:5101/api/health` |
| FastAPI AI Service | `hirewise-ai-service`| `8000` | `http://localhost:8000/health` |
| React Web Client | `hirewise-web` | `3000` | Nginx HTTP response |

### 2.3 Running the Candidate Mobile App
The mobile client (`apps/mobile`) connects to the local API:
- **Android Emulator**: Uses `http://10.0.2.2:5101/api`.
- **iOS Simulator**: Uses `http://localhost:5101/api`.
- Run command:
  ```bash
  cd apps/mobile
  flutter run --dart-define-from-file=env.development.json
  ```

---

## 3. Production Deployment on Google Cloud Platform (GCP)

Production infrastructure is declared in `infrastructure/terraform/`:

```
infrastructure/terraform/
├── main.tf                    # Root coordinator for VPC, Cloud SQL, Cloud Run
├── variables.tf               # Environment inputs and project definitions
├── outputs.tf                 # Generated URLs and database connection strings
├── versions.tf                # Provider pins (google, random)
├── environments/
│   ├── dev.tfvars             # Development environment overrides
│   └── prod.tfvars            # Production environment overrides
└── modules/
    ├── networking/            # VPC, Serverless VPC Access connector, Cloud NAT
    ├── database/              # Cloud SQL PostgreSQL 16 (Private IP)
    ├── redis/                 # Memorystore Redis 7 cache
    ├── storage/               # Google Cloud Storage bucket for resumes
    ├── secrets/               # Secret Manager credentials
    ├── compute/               # Cloud Run v2 services for API, AI, and Web
    └── iam/                   # Workload Identity Federation & service accounts
```

### 3.1 Initializing & Applying Terraform
```bash
cd infrastructure/terraform
terraform init
terraform plan -var-file=environments/prod.tfvars -out=tfplan
terraform apply tfplan
```

### 3.2 Production Cloud Run Services

| Service Name | Port | Ingress | Scaling Bounds | Authentication |
|---|---|---|---|---|
| `hirewise-api` | 8080 | All / Public | 0 to 10 instances | Public with Clerk JWT validation |
| `hirewise-ai-service` | 8000 | Internal + VPC | 0 to 5 instances | Protected by `X-Api-Key` header |
| `hirewise-web` | 80 | All / Public | 1 to 10 instances | Public Nginx reverse proxy |

---

## 4. Continuous Integration & Deployment (CI/CD)

The `.github/workflows/` directory contains automated GitHub Actions workflows:

### 4.1 CI Workflow (`.github/workflows/ci.yml`)
Runs on every Pull Request to `main`:
- **Backend**: `dotnet build` + `dotnet test`
- **AI Service**: `pytest tests/` + `ruff check`
- **Web Portal**: `npm run lint` + `npm run build`

### 4.2 Flutter Mobile CI (`.github/workflows/flutter.yml`)
Triggered on changes within `apps/mobile/`:
- `flutter pub get`
- `flutter analyze`
- `flutter test`

### 4.3 CD Workflow (`.github/workflows/cd.yml`)
Triggered on push/merge to `main`:
1. Authenticates to GCP using **Workload Identity Federation** (no service account keys stored in GitHub).
2. Builds Docker images for API, AI Service, and Web Client using `docker/` build contexts.
3. Pushes tagged images to Google Artifact Registry:
   `us-central1-docker.pkg.dev/<PROJECT_ID>/hirewise/<SERVICE>:<SHA>`
4. Deploys updated revisions to Cloud Run v2 with zero downtime.

---

## 5. Environment Variables & Secret Configuration

### 5.1 ASP.NET Core API (`apps/api`)
| Variable | Description |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Production` or `Development` |
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string |
| `Clerk__SecretKey` | Clerk backend API private key |
| `Clerk__JwksUrl` | JWKS endpoint URL for RS256 token verification |
| `AiService__BaseUrl` | URL of FastAPI AI service (`http://ai-service:8000` or Cloud Run URL) |
| `AiService__ApiKey` | Shared secret header (`X-Api-Key`) |
| `Storage__Provider` | `GcpCloudStorage` (prod) or `LocalStorage` (dev) |
| `Storage__Gcp__BucketName` | Cloud Storage bucket name for resumes |
| `GoogleCalendar__Enabled` | `true` or `false` |
| `Resend__ApiKey` | Resend transactional email API key |

### 5.2 FastAPI AI Service (`apps/ai-service`)
| Variable | Description |
|---|---|
| `ENVIRONMENT` | `production` or `development` |
| `DATABASE_URL` | PostgreSQL connection string for LangGraph persistence |
| `DOTNET_API_BASE_URL` | URL of ASP.NET Core API for status callbacks |
| `AI_SERVICE_API_KEY` | Shared secret key for incoming requests |
| `AI_SERVICE_INTERNAL_KEY` | Shared secret key for outgoing callbacks to API |
| `VERTEX_PROJECT_ID` | GCP Project ID for Gemini LLM calls |
| `VERTEX_LOCATION` | Region (e.g. `us-central1`) |

### 5.3 Web Client (`apps/web`)
| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL for REST API (e.g. `https://api.hirewise.app` or `http://localhost:5101`) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable public key |

### 5.4 Candidate Mobile Client (`apps/mobile`)
| Variable | Description |
|---|---|
| `API_BASE_URL` | Target API URL (`http://10.0.2.2:5101/api` on emulator, Cloud Run URL in release) |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
