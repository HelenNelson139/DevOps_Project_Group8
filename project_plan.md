# Ke hoach du an: UIT Course Registration Platform
## Kien truc hien tai

```text
User
  -> NGINX Ingress
  -> API Gateway
  -> Auth Service
  -> Course Service
  -> Registration Service
  -> Notification Service
  -> Azure PostgreSQL / Redis / RabbitMQ
```
Luong DevOps:
```text
Developer push code
  -> GitHub Actions validate/build/push image
  -> Update Kubernetes image tags in Git
  -> Argo CD sync manifests to AKS
  -> Argo Rollouts canary deploy API Gateway
  -> Prometheus/Grafana monitor services
```
## Thanh phan ung dung
### Frontend
- React + Vite.
- Cung cap cac man hinh login, dashboard, upload du lieu, xem lop, dang ky hoc phan.
- Build bang GitHub Actions.
### API Gateway
- NGINX gateway.
- Dinh tuyen request:
  - `/api/auth/` -> Auth Service
  - `/api/courses/` -> Course Service
  - `/api/registrations/` -> Registration Service
  - `/api/notifications/` -> Notification Service
- Co endpoint `/health`.
- Duoc trien khai bang Argo Rollouts de canary deploy.
### Auth Service
- NestJS.
- Dang nhap bang `studentId` va password.
- Password duoc hash bang bcrypt.
- Phat JWT token.
- Co unit test cho login thanh cong, sai password va unauthorized.
- Co `/metrics` de Prometheus scrape.
### Course Service
- NestJS.
- Upload va parse file Excel thoi khoa bieu.
- Luu mon hoc va lop hoc vao PostgreSQL.
- Cung cap API danh sach lop va thong ke si so.
- Co unit test cho thong ke va xoa du lieu.
- Co `/metrics`.
### Registration Service
- NestJS.
- Dang ky lop hoc.
- Kiem tra:
  - lop ton tai
  - da dang ky hay chua
  - lop day
  - trung lich hoc
- Huy dang ky.
- Publish event sang RabbitMQ cho Notification Service.
- Co unit test cho dang ky va validate request rong.
- Co `/metrics`.
### Notification Service

- NestJS.
- Consume event tu RabbitMQ.
- Xu ly event dang ky, huy dang ky, loi dang ky.
- Co cau hinh gui mail qua Mailtrap.
- Co `/metrics`.
### AI Agent
- FastAPI + PyTorch.
- Load DRQN model.
- Cung cap endpoint:
  - `/health`
  - `/ready`
  - `/predict`
  - `/model`
- Duoc Argo Rollouts goi trong AnalysisTemplate de danh gia canary.
- Co safety guard va fallback khi thieu du lieu Prometheus.
## 4. Database
Database chinh la Azure PostgreSQL Flexible Server.
Repo co cac migration:
- `001_users.sql`
- `002_courses_classes.sql`
- `003_enrollments.sql`
Co `database/Dockerfile` va `run-migrations.sh` de tao image `db-migration`.
Trong Kubernetes, migration chay bang Argo CD Sync hook:
```text
k8s/jobs/db-migration-job.yaml
```
Job co:
- `activeDeadlineSeconds: 300`
- `backoffLimit: 3`
- `ttlSecondsAfterFinished: 300`
Muc tieu la tranh job bi treo vo han khi image hoac database loi.
`seed.sql` hien dung cho du lieu demo/test. Du lieu them truc tiep tren Azure chi nen xem la du lieu tam thoi, neu can on dinh thi nen dua vao seed hoac migration rieng.
## 5. Containerization
Repo co Dockerfile cho:
- API Gateway
- Auth Service
- Course Service
- Registration Service
- Notification Service
- AI Agent
- DB Migration
Co `docker-compose.yml` de chay local gom:
- PostgreSQL
- Redis
- RabbitMQ
- API Gateway
- cac backend services
Local compose co healthcheck cho PostgreSQL, Redis va RabbitMQ.
## 6. Kubernetes
Kubernetes manifests nam trong `k8s/`.
Hien co:
- `base/`: ConfigMap va Secret.
- `services/`: Deployment va Service cho cac microservices.
- `backing-services/`: Redis va RabbitMQ.
- `ingress/`: Ingress public vao API Gateway.
- `autoscaling/`: HPA cho API Gateway va cac services.
- `rollouts/`: Argo Rollouts cho API Gateway va AI AnalysisTemplate.
- `jobs/`: DB migration hook.
## 7. CI/CD
Pipeline chinh:
```text
.github/workflows/deploy.yml
```
Pipeline dang lam:
1. Validate Node applications.
2. Validate Python AI Agent.
3. Build Docker image cho tung service.
4. Push image len Azure Container Registry.
5. Update Kubernetes manifests bang immutable image tag theo commit SHA.
6. Validate Kubernetes YAML bang kubeconform.
7. Commit lai image tag vao Git.
8. Gui Teams notification khi pipeline fail.

## 8. GitOps voi Argo CD
Argo CD Application:

```text
argocd/app/uit-course.yaml
```
Argo CD dang theo doi:
```text
repo: DevOps_Project_Group8
branch: main
path: k8s
```
Sync policy:
- automated sync
- self-heal
- apply out-of-sync only
- prune dang tat
Vai tro:
- Git la source of truth cho Kubernetes manifests.
- GitHub Actions chi cap nhat image tag trong Git.
- Argo CD thuc hien sync tu Git vao AKS.

## 9. Argo Rollouts va AI Canary
API Gateway duoc deploy bang Argo Rollouts:
```text
k8s/rollouts/api-gateway-rollout.yaml
```
Canary steps:
```text
10% -> AI analysis -> 50% -> AI analysis -> 100%
```

AI analysis goi:

```text
http://canary-ai-agent-svc.default.svc.cluster.local/predict
```

## 10. Monitoring
Monitoring nam trong `monitoring/`.
Da co:

- kube-prometheus-stack.
- Prometheus.
- Grafana.
- Alertmanager.
- ServiceMonitor cho app services.
- PrometheusRule cho cluster/app alerts.
- Grafana dashboard.
- Teams alert webhook.
Terraform hien quan ly Helm release monitoring:
```text
terraform/modules/monitoring
```
Prometheus scrape cac service:
- auth-service
- course-service
- registration-service
- notification-service
App metrics:
- `uit_course_http_requests_total`
- `uit_course_http_request_duration_seconds`
- `uit_course_nodejs_memory_bytes`
Dashboard hien co 6 panel:
- Scrape health
- Request rate
- 5xx errors
- P95 latency
- Heap memory
- Status codes

## 11. Terraform
Terraform nam trong `terraform/`.
Dang quan ly:
- Resource Group.
- Virtual Network va subnets.
- AKS.
- ACR.
- PostgreSQL Flexible Server.
- Private DNS cho PostgreSQL.
- Role assignment `AcrPull`.
- AKS node autoscaling.
- kube-prometheus-stack Helm release.
- Remote state backend tren Azure Storage.

