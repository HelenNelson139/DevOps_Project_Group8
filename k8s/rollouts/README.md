# Argo Rollouts Canary Release
This folder contains the manifests for AI-assisted canary release on AKS.
## Files
- `canary-ai-agent.yaml`: deploys the AI decision service.
- `analysis-template.yaml`: lets Argo Rollouts call the AI agent.
- `api-gateway-rollout.yaml`: defines canary rollout for `api-gateway`.
## Install Argo Rollouts
```bash
kubectl create namespace argo-rollouts
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
```
Check:
```bash
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
## Check
```powershell
kubectl get pods -l app=canary-ai-agent
kubectl logs deploy/canary-ai-agent --tail=50
kubectl get rollout
kubectl describe rollout api-gateway-rollout
kubectl get analysisrun
```
## Notes
- `api-gateway-rollout.yaml` replaces the old `api-gateway` Deployment.
- Do not run the old `api-gateway` Deployment and the Rollout at the same time because both use label `app=api-gateway`.
- Ingress must route traffic to `api-gateway-stable`.
- HPA should target `Rollout/api-gateway-rollout`.
- The AI agent reads Prometheus metrics and returns rollout decisions through `analysis-template.yaml`.
