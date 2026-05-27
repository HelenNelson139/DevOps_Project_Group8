#!/bin/bash
set -e

if [ -z "$TEAMS_WEBHOOK_URL" ]; then
  echo "Set TEAMS_WEBHOOK_URL before running this script."
  exit 1
fi

kubectl create secret generic argocd-notifications-secret \
  -n argocd \
  --from-literal=teams-webhook-url="$TEAMS_WEBHOOK_URL" \
  --dry-run=client \
  -o yaml | kubectl apply -f -

kubectl apply -f argocd/notifications/argocd-notifications-cm.yaml

if kubectl get deployment argocd-notifications-controller -n argocd >/dev/null 2>&1; then
  kubectl rollout restart deployment/argocd-notifications-controller -n argocd
else
  echo "argocd-notifications-controller was not found. Check your Argo CD installation."
fi
