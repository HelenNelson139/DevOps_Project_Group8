# Terraform Azure Infrastructure
Terraform is used to provision the Azure infrastructure for the UIT Course Registration platform.
## Resources Created
- Resource Group
- Virtual Network and subnets
- Azure Container Registry
- Azure Kubernetes Service
- AKS node autoscaling
- Azure Database for PostgreSQL Flexible Server
- Private DNS for PostgreSQL
- Role assignment for AKS to pull images from ACR
- kube-prometheus-stack Helm release for monitoring
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
## Remote State Backend
Terraform state is stored in Azure Storage so it is not tied to one local machine.

Create the backend resources once:
```powershell
$TFSTATE_RG="uit-tfstate-rg"
$TFSTATE_LOCATION="southeastasia"
$TFSTATE_STORAGE="uitdkhptfstate0001"

az group create --name $TFSTATE_RG --location $TFSTATE_LOCATION
az storage account create --name $TFSTATE_STORAGE --resource-group $TFSTATE_RG --location $TFSTATE_LOCATION --sku Standard_LRS --kind StorageV2 --allow-blob-public-access false
az storage container create --name tfstate --account-name $TFSTATE_STORAGE --auth-mode login
```

`$TFSTATE_STORAGE` must be globally unique, lowercase, and contain only letters and numbers.

Create local backend config:
```powershell
Copy-Item backend.hcl.example backend.hcl
```

Edit `backend.hcl` and set the real storage account name:
```hcl
resource_group_name  = "uit-tfstate-rg"
storage_account_name = "uitdkhptfstate0001"
container_name       = "tfstate"
key                  = "uit-course.terraform.tfstate"
```

Migrate existing local state to Azure Storage:
```powershell
terraform init -backend-config=backend.hcl -migrate-state
```

`backend.hcl` is local-only and must not be committed.

## Run Terraform
```powershell
cd terraform
terraform init -backend-config=backend.hcl
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

## Monitoring Helm Release
Terraform manages the `kube-prometheus-stack` Helm release through `modules/monitoring`.

If monitoring was already installed manually by script, import the existing Helm release before running `terraform apply`:
```powershell
terraform import module.monitoring.helm_release.kube_prometheus_stack monitoring/prometheus
```

Project-specific rules, ServiceMonitors, dashboards, and Teams webhook setup are still applied from the `monitoring/` scripts:
```powershell
.\monitoring\scripts\apply-monitoring-rules.ps1
```
```bash
bash monitoring/scripts/apply-monitoring-rules.sh
```

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
