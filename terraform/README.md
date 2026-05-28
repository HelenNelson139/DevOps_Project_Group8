# Terraform Azure Infrastructure
Terraform is used to provision the Azure infrastructure for the UIT Course Registration platform.
## Resources Created
- Resource Group
- Virtual Network and subnets
- Azure Container Registry
- Azure Kubernetes Service
- Azure Database for PostgreSQL Flexible Server
- Private DNS for PostgreSQL
- Role assignment for AKS to pull images from ACR
## Prerequisites
Login to Azure:
```powershell
az login
az account show
```
Install Terraform if needed:
```powershell
winget install Hashicorp.Terraform
terraform -version
```
## Run Terraform
```powershell
cd terraform
terraform init
terraform validate
terraform plan
terraform apply
```
When Terraform asks for confirmation, type:
```text
yes
```
Terraform will ask for:
```text
var.db_admin_password
```
This is the PostgreSQL admin password for user `pgadmin`.
Use a strong password and do not commit real passwords or `.tfvars` files.
## Outputs
```powershell
terraform output
```
## Connect To AKS
```powershell
az aks get-credentials --resource-group uit-dkhp-rg --name devops-aks --overwrite-existing
kubectl get nodes
```

## Cleanup
To delete Azure resources:
```powershell
cd terraform
terraform destroy
```
