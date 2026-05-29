$ErrorActionPreference = "Stop"
kubectl apply -f monitoring/rules/
kubectl apply -f monitoring/service-monitors/
kubectl apply -f monitoring/dashboards/
kubectl get prometheusrule -n monitoring
kubectl get servicemonitor -n monitoring
kubectl get configmap -n monitoring -l grafana_dashboard=1
