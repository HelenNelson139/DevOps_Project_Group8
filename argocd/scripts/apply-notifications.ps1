$ErrorActionPreference = "Stop"

if (-not $env:TEAMS_WEBHOOK_URL) {
  throw "Set TEAMS_WEBHOOK_URL before running this script."
}

kubectl create secret generic argocd-notifications-secret `
  -n argocd `
  --from-literal=teams-webhook-url="$env:TEAMS_WEBHOOK_URL" `
  --dry-run=client `
  -o yaml | kubectl apply -f -

kubectl apply -f argocd/notifications/argocd-notifications-cm.yaml

kubectl get deployment argocd-notifications-controller -n argocd *> $null
if ($LASTEXITCODE -eq 0) {
  kubectl rollout restart deployment/argocd-notifications-controller -n argocd
}
else {
  Write-Warning "argocd-notifications-controller was not found. Check your Argo CD installation."
}
