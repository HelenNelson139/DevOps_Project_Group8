
## Purpose
Argo CD adds a GitOps layer to the deployment flow:
```text
GitHub repository -> Argo CD -> AKS cluster
```
In this project:
- GitHub Actions builds and pushes Docker images to Azure Container Registry.
- Argo CD watches the Kubernetes manifests in Git.
- Argo CD keeps the AKS cluster synchronized with the desired state in the repository.
## Install Argo CD
From the project root, run:
```bash
bash argocd/scripts/install-argocd.sh
```
The install script:
1. Creates the `argocd` namespace if it does not exist.
2. Installs the official Argo CD manifests.
3. Uses server-side apply to avoid large CRD annotation errors.
4. Waits for the Argo CD server rollout.

## Create The Argo CD Application

Apply the Argo CD Application manifest:
```bash
bash argocd/scripts/apply-app.sh
```
Or manually:
```bash
kubectl apply -f argocd/app/uit-course.yaml
kubectl get applications -n argocd
```
The application is defined in:
```text
argocd/app/uit-course.yaml
```
It points to:
```text
Repository: https://github.com/HelenNelson139/DevOps_Project_Group8.git
Branch: main
Path: k8s
Destination: in-cluster
Namespace: default
```
## Check Argo CD
Run:
```bash
bash argocd/scripts/check-argocd.sh
```
Or manually:
```bash
kubectl get pods -n argocd
kubectl get svc -n argocd
```
## Argo CD Failure Notifications
Argo CD can send Teams notifications when the application sync fails or health becomes `Degraded`/`Suspended`.

Create a Teams webhook and set it only in your shell, not in Git:
```powershell
$env:TEAMS_WEBHOOK_URL="https://..."
.\argocd\scripts\apply-notifications.ps1
```

Or on bash:
```bash
export TEAMS_WEBHOOK_URL="https://..."
bash argocd/scripts/apply-notifications.sh
```

The script:
1. Creates/updates `argocd-notifications-secret` in the `argocd` namespace.
2. Applies `argocd/notifications/argocd-notifications-cm.yaml`.
3. Restarts `argocd-notifications-controller` if it exists.

Check:
```powershell
kubectl get cm argocd-notifications-cm -n argocd
kubectl get secret argocd-notifications-secret -n argocd
kubectl get deployment argocd-notifications-controller -n argocd
```
## Open Argo CD UI
Run:
```bash
bash argocd/scripts/port-forward-argocd.sh
```
Open:
```text
https://localhost:8082
```
Login:
```text
Username: admin
Password: 12345678 <đã đổi mật khẩu sau khi vào rồi, nếu thực hiện các bước trên thì phải tự lấy mk và đổi>
```

