# Terraform Azure Infrastructure

Terraform creates the Azure infrastructure for Kubernetes deployment:
- Resource Group
- Azure Container Registry
- Azure Kubernetes Service
- Azure Database for PostgreSQL Flexible Server
- Virtual Network and subnets
- Private DNS for PostgreSQL
- AKS permission to pull images from ACR

1. Log in to Azure and confirm the active subscription:
   ```powershell
   az login
   az account show
   ```
nếu chưa có terraform
- Cài bằng winget
   ```powershell
   winget install Hashicorp.Terraform
   terraform -version
   ```
2. Initialize and validate Terraform:
   ```powershell
   cd terraform
   terraform init
   terraform validate
   ```
3. Preview the infrastructure changes:
   ```powershell
   terraform plan
   ```
   Terraform will ask for `var.db_admin_password`. Enter a strong PostgreSQL admin password. This is the database password for the `pgadmin` user, <password:12345678>

4. Create the Azure resources:
   ```powershell
   terraform apply
   ```
   When Terraform asks for confirmation, type:
   ```text
   yes
   ```
5. After apply completes, note the outputs:
   ```powershell
   terraform output
   ```
   Current expected values:
   ```text
   acr_login_server = "uitdkhpacr2026.azurecr.io"
   aks_cluster_name = "devops-aks"
   db_server_fqdn = "uit-dkhp-pg-server.postgres.database.azure.com"
   resource_group_name = "uit-dkhp-rg"
   ```
6. Connect `kubectl` to AKS:
   ```powershell
   az aks get-credentials --resource-group uit-dkhp-rg --name devops-aks
   kubectl get nodes
   ```
   The nodes should show `Ready`.

## Build And Push Images To ACR
Run these commands from the project root:
```powershell
az acr login --name uitdkhpacr2026

docker build -t uitdkhpacr2026.azurecr.io/auth-service:latest .\services\auth
docker build -t uitdkhpacr2026.azurecr.io/course-service:latest .\services\course
docker build -t uitdkhpacr2026.azurecr.io/registration-service:latest .\services\registration
docker build -t uitdkhpacr2026.azurecr.io/notification-service:latest .\services\notification
docker build -t uitdkhpacr2026.azurecr.io/api-gateway:latest -f .\Dockerfile.gateway .

docker push uitdkhpacr2026.azurecr.io/auth-service:latest
docker push uitdkhpacr2026.azurecr.io/course-service:latest
docker push uitdkhpacr2026.azurecr.io/registration-service:latest
docker push uitdkhpacr2026.azurecr.io/notification-service:latest
docker push uitdkhpacr2026.azurecr.io/api-gateway:latest
```
## Deploy To AKS
Before deploying, make sure `k8s/base/secret.yaml` contains the correct `DATABASE_URL` for the Azure PostgreSQL server.
Apply Kubernetes manifests:
```powershell
kubectl apply -f k8s/base
kubectl apply -f k8s/backing-services
kubectl apply -f k8s/services
```
Check deployment status:
```powershell
kubectl get pods -w
kubectl get svc
```
For local testing through the Kubernetes service, run:
```powershell
kubectl port-forward svc/api-gateway 8081:80
```
Then open:
```text
http://localhost:8081
```