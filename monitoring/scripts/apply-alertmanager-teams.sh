#!/bin/bash

set -e

if [ -z "$TEAMS_WEBHOOK_URL" ]; then
  echo "Set TEAMS_WEBHOOK_URL before running this script."
  exit 1
fi

kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic alertmanager-teams-webhook \
  -n monitoring \
  --from-literal=teams-webhook-url="$TEAMS_WEBHOOK_URL" \
  --dry-run=client \
  -o yaml | kubectl apply -f -

helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  -f monitoring/helm/kube-prometheus-stack-values.yaml \
  -f monitoring/helm/alertmanager-teams-values.yaml \
  --wait

kubectl apply -f monitoring/rules/
kubectl apply -f monitoring/service-monitors/
kubectl apply -f monitoring/dashboards/
kubectl get secret alertmanager-teams-webhook -n monitoring
