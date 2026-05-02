# KIRA-DevOps

> End-to-end DevOps + AIOps platform — Docker → Kubernetes → AWS EKS → AI-powered monitoring

## Tech Stack
| Layer | Technology |
|---|---|
| Application | Node.js, Express, React |
| Database | PostgreSQL |
| Containers | Docker, Docker Compose |
| Orchestration | Kubernetes (AWS EKS) |
| Infrastructure | Terraform |
| CI/CD | GitHub Actions |
| GitOps | ArgoCD + Kustomize |
| Monitoring | Prometheus + Grafana |
| Log Forwarding | Fluent Bit → CloudWatch |
| AIOps | AWS Bedrock Agent (Kira) |

## Services
| Service | Port |
|---|---|
| gateway | 3001 |
| auth | 3002 |
| product-service | 3003 |
| order-service | 3004 |
| orders | 3005 |
| user-service | 3006 |
| frontend | 3000 |
