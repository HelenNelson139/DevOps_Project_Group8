$ErrorActionPreference = "Stop"

if (-not $env:TEAMS_WEBHOOK_URL) {
  throw "Set TEAMS_WEBHOOK_URL before running this script."
}

kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic alertmanager-teams-webhook `
  -n monitoring `
  --from-literal=teams-webhook-url="$env:TEAMS_WEBHOOK_URL" `
  --dry-run=client `
  -o yaml | kubectl apply -f -

helm upgrade --install prometheus prometheus-community/kube-prometheus-stack `
  --namespace monitoring `
  -f monitoring/helm/kube-prometheus-stack-values.yaml `
  -f monitoring/helm/alertmanager-teams-values.yaml `
  --wait

kubectl apply -f monitoring/rules/
kubectl get secret alertmanager-teams-webhook -n monitoring
