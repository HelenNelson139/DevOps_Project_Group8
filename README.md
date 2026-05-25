# UIT Course Registration Platform
A microservices-based course registration system deployed with Docker, Kubernetes, AKS, GitHub Actions, Argo CD, monitoring, and AI-assisted canary rollout.
## Architecture
```text
User
  -> NGINX Ingress / Public IP
  -> API Gateway
  -> Auth / Course / Registration / Notification services
  -> Azure PostgreSQL, Redis, RabbitMQ
```
DevOps flow:
```text
GitHub Actions -> ACR -> Argo CD -> AKS -> Argo Rollouts
```
## Public Demo
```text
http://20.44.237.162
```
Demo accounts:
```text
admin / password
23521023 / password
23520425 / password
23520291 / password
23520718 / password
```
## Local Quick Start
Copy the environment file:
```bash
cp .env.example .env
```
Start infrastructure first:
```bash
docker compose up -d postgres redis rabbitmq
```
Run database migrations:
```powershell
docker cp database\migrations\001_users.sql uit-dkhp-postgres-helen:/tmp/001_users.sql
docker cp database\migrations\002_courses_classes.sql uit-dkhp-postgres-helen:/tmp/002_courses_classes.sql
docker cp database\migrations\003_enrollments.sql uit-dkhp-postgres-helen:/tmp/003_enrollments.sql
docker cp database\seed.sql uit-dkhp-postgres-helen:/tmp/seed.sql

docker exec -i uit-dkhp-postgres-helen psql -U uit -d uit_dkhp -f /tmp/001_users.sql
docker exec -i uit-dkhp-postgres-helen psql -U uit -d uit_dkhp -f /tmp/002_courses_classes.sql
docker exec -i uit-dkhp-postgres-helen psql -U uit -d uit_dkhp -f /tmp/003_enrollments.sql
docker exec -i uit-dkhp-postgres-helen psql -U uit -d uit_dkhp -f /tmp/seed.sql
```
Start all services:
```bash
docker compose up -d
```
Open:
```text
http://localhost:8081
```
## Local Ports
```text
Gateway: http://localhost:8081
PostgreSQL: localhost:5433
Redis: localhost:6380
RabbitMQ: localhost:5673
RabbitMQ UI: http://localhost:15673
```

## Local Development Without Docker For Backend
Start local infrastructure:
```bash
docker compose up -d postgres redis rabbitmq
```
Run database migrations from the **Local Quick Start** section.
Run each backend service in dev mode:
```bash
cd services/auth
npm install
npm run start:dev
```
Do the same for:
```text
services/course
services/registration
services/notification
```
Run frontend:
```bash
cd frontend
npm install
npm run dev
```

## Project Structure
```text
api-gateway/           NGINX gateway config
frontend/              React frontend
services/auth/         Auth service
services/course/       Course service
services/registration/ Registration service
services/notification/ Notification service
database/              PostgreSQL migrations and seed
k8s/                   Kubernetes manifests
terraform/             Azure infrastructure
argocd/                GitOps configuration
monitoring/            Prometheus and Grafana
ai-agent/              AI canary decision service
```
## DevOps Components
- Terraform provisions Azure infrastructure.
- GitHub Actions builds and pushes Docker images to ACR.
- Argo CD syncs Kubernetes manifests from GitHub to AKS.
- NGINX Ingress exposes the app through a public IP.
- Prometheus and Grafana provide monitoring.
- Argo Rollouts manages canary rollout for `api-gateway`.
- AI agent supports canary rollout decisions using Prometheus metrics.
## Documentation
```text
terraform/README.md
database/README.md
argocd/README.md
monitoring/README.md
k8s/ingress/README.md
k8s/rollouts/README.md
```
## Useful Checks
```bash
kubectl get pods
kubectl get svc
kubectl get ingress
kubectl get rollout
kubectl get hpa
kubectl get applications -n argocd
```

## Pause And Resume Azure Resources
To reduce Azure cost when the project is not in use, stop the main paid resources.
### Stop Resources
Stop AKS:
```powershell
az aks stop `
  --resource-group uit-dkhp-rg `
  --name devops-aks
```
Stop Azure PostgreSQL:
```powershell
az postgres flexible-server stop `
  --resource-group uit-dkhp-rg `
  --name uit-dkhp-pg-server
```
Check status:
```powershell
az aks show `
  --resource-group uit-dkhp-rg `
  --name devops-aks `
  --query powerState.code `
  -o tsv
```
```powershell
az postgres flexible-server show `
  --resource-group uit-dkhp-rg `
  --name uit-dkhp-pg-server `
  --query state `
  -o tsv
```
### Start Resources Again
Start Azure PostgreSQL first:
```powershell
az postgres flexible-server start `
  --resource-group uit-dkhp-rg `
  --name uit-dkhp-pg-server
```
Start AKS:
```powershell
az aks start `
  --resource-group uit-dkhp-rg `
  --name devops-aks
```
Get AKS credentials again:
```powershell
az aks get-credentials `
  --resource-group uit-dkhp-rg `
  --name devops-aks `
  --overwrite-existing
```
Get kubeconfig
az aks get-credentials `
  --resource-group uit-dkhp-rg `
  --name devops-aks `
  --overwrite-existing

Check after starting:
```powershell
kubectl get nodes
kubectl get pods
kubectl get applications -n argocd

kubectl get ingress
kubectl get rollout
kubectl get hpa

```
