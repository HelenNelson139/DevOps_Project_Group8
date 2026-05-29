# Ingress
The application is exposed through NGINX Ingress Controller on AKS.
## Install NGINX Ingress Controller
```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace
```
API Gateway stable/canary metrics are exported by the API Gateway pods themselves at `/metrics`.

## Apply Ingress
```bash
kubectl apply -f k8s/ingress/ingress.yaml
```
## Check
```bash
kubectl get svc -n ingress-nginx
kubectl get service --namespace ingress-nginx ingress-nginx-controller --output wide
kubectl get ingress
kubectl describe ingress uit-dkhp-ingress
```
Public URL:
```text
http://20.44.237.162
```
## Notes
- The Ingress routes external traffic to `api-gateway-stable`.
- `api-gateway-stable` is managed by Argo Rollouts.
- If the public IP changes, update this README.
