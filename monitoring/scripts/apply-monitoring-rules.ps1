$ErrorActionPreference = "Stop"

kubectl apply -f monitoring/rules/
kubectl get prometheusrule -n monitoring
