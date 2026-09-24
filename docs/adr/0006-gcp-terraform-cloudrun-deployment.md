# ADR-0006: Serverless Google Cloud Run & Terraform IaC

> **Status:** Accepted  
> **Date:** 2026-09-23  
> **Deciders:** DevOps & Infrastructure Guild  

---

## Context

HireWise needed a cloud deployment strategy that optimizes for:
- Low operational overhead (minimal virtual machine maintenance and patch management).
- Dynamic autoscaling to handle bursty hiring seasons (scale to zero during idle hours, scale out under peak load).
- Native integration with Google Cloud Vertex AI (Gemini LLMs) via Application Default Credentials (ADC).
- Immutable, reproducible infrastructure defined as code.
- Secure CI/CD deployment without storing permanent cloud service account keys in GitHub repository secrets.

## Decision

We selected **Google Cloud Platform (GCP)** provisioned via **Terraform** using **Google Cloud Run v2**:

1. **Serverless Compute**:
   - Containerized services (`hirewise-api`, `hirewise-ai-service`, `hirewise-web`) run on Cloud Run v2.
   - Autoscaling bounds configured per service (e.g., 0–10 instances) to optimize compute spend.
2. **Private Managed Services**:
   - Cloud SQL PostgreSQL 16 provisioned on a private VPC network accessible via a Serverless VPC Access connector.
   - Cloud Memorystore Redis 7 cache on private IP.
   - Google Cloud Storage for resume uploads with uniform bucket-level access.
3. **Passwordless GitHub Actions CI/CD**:
   - Continuous deployment authenticates using **Workload Identity Federation (WIF)**, eliminating the security vulnerability of static service account JSON keys.
4. **Declarative IaC**:
   - All networking, IAM bindings, secrets, storage buckets, and compute definitions are maintained in `infrastructure/terraform/`.

## Consequences

### Positive
- **Cost Efficiency**: Services scale to zero when not in use, eliminating idle server expenses.
- **Enterprise Security**: Private VPC networking shields databases from the public internet. WIF eliminates credential leakage risks.
- **Native AI Integration**: Direct Vertex AI SDK access without API keys, secured by GCP IAM service accounts.

### Negative / Trade-offs
- Cold starts may introduce slight initial latency (1–2 seconds) when scaling from zero, mitigated by setting minimum instances to 1 for high-traffic services.
- Requires proficiency with GCP Cloud Console and Terraform state management.
