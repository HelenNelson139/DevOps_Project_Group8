# Argo Rollouts Canary Release
This folder contains the manifests for AI-assisted canary release on AKS.
## Files
- `canary-ai-agent.yaml`: deploys the AI decision service.
- `analysis-template.yaml`: lets Argo Rollouts call the AI agent.
- `api-gateway-rollout.yaml`: defines canary rollout for `api-gateway`.
## Prerequisites
Argo Rollouts must be installed:
```powershell
kubectl get pods -n argo-rollouts
```

## Build AI Agent Image
```powershell
az acr login --name uitdkhpacr2026
docker build -t uitdkhpacr2026.azurecr.io/canary-ai-agent:latest .\ai-agent
docker push uitdkhpacr2026.azurecr.io/canary-ai-agent:latest
```
## Apply
```powershell
kubectl apply -f k8s/rollouts/canary-ai-agent.yaml
kubectl apply -f k8s/rollouts/analysis-template.yaml
kubectl apply -f k8s/rollouts/api-gateway-rollout.yaml
```
## Important Note
The project already has a normal `api-gateway` Deployment in:
```text
k8s/services/api-gateway.yaml
```
Before testing Rollout, scale the old Deployment to zero to avoid selector conflicts:
```powershell
kubectl scale deployment api-gateway --replicas=0
```
Check rollout:
```powershell
kubectl get rollout
kubectl get pods -l app=api-gateway
```
Return to normal deployment:
```powershell
kubectl scale rollout api-gateway-rollout --replicas=0
kubectl scale deployment api-gateway --replicas=2
```
