# Monitoring
This folder installs Kubernetes monitoring for the AKS cluster using `kube-prometheus-stack`.
The stack includes:
- Prometheus for metrics collection
- Grafana for dashboards
- Alertmanager for alerts
- kube-state-metrics for Kubernetes object metrics
- node-exporter for node metrics
- Prometheus Operator for managing Prometheus resources
## Prerequisites
Make sure the AKS context is selected:
```bash
kubectl config current-context
kubectl get nodes
```
The expected context is:
```text
devops-aks
```
Helm is also required:
```bash
helm version
```
## Install Monitoring
From the project root, run:
```bash
bash monitoring/scripts/install-monitoring.sh
```
The script will:
1. Add and update the `prometheus-community` Helm repo.
2. Create the `monitoring` namespace.
3. Install `kube-prometheus-stack` with values from `monitoring/helm/kube-prometheus-stack-values.yaml`.
4. Apply project alert rules from `monitoring/rules/`.

## Alert Rules
The project includes basic Prometheus alerts in `monitoring/rules/basic-alerts.yaml`.
These alerts cover:
- Pods stuck in `CrashLoopBackOff`
- Pods stuck in `Pending`, `Unknown`, or `Failed`
- Deployments with unavailable replicas
- HPA staying at max replicas
- Prometheus scrape targets going down

If the monitoring stack is already installed, apply or update only the rules:
```powershell
.\monitoring\scripts\apply-monitoring-rules.ps1
```

Or with Bash:
```bash
bash monitoring/scripts/apply-monitoring-rules.sh
```

Check the rules:
```bash
kubectl get prometheusrule -n monitoring
```

## Teams Alerts
Alertmanager can send Prometheus alerts to Microsoft Teams without committing the webhook URL to Git.

Set the webhook URL in your local shell, then apply the Teams Alertmanager config:
```powershell
$env:TEAMS_WEBHOOK_URL="https://..."
.\monitoring\scripts\apply-alertmanager-teams.ps1
```

Or with Bash:
```bash
export TEAMS_WEBHOOK_URL="https://..."
bash monitoring/scripts/apply-alertmanager-teams.sh
```

The script will:
1. Create or update the `alertmanager-teams-webhook` Kubernetes Secret.
2. Upgrade `kube-prometheus-stack` with `monitoring/helm/alertmanager-teams-values.yaml`.
3. Apply the project alert rules.

Check the secret and Alertmanager:
```bash
kubectl get secret alertmanager-teams-webhook -n monitoring
kubectl get alertmanager -n monitoring
kubectl get pods -n monitoring | grep alertmanager
```

The webhook value is stored in the cluster Secret, not in this repository.

## Check Monitoring
Run:
```bash
bash monitoring/scripts/check-monitoring.sh
```
Expected monitoring pods should be `Running`, including:
- `prometheus-grafana`
- `prometheus-kube-prometheus-operator`
- `prometheus-kube-state-metrics`
- `prometheus-prometheus-kube-prometheus-prometheus-0`
- `alertmanager-prometheus-kube-prometheus-alertmanager-0`
- `prometheus-prometheus-node-exporter`
You can also check manually:
```bash
kubectl get pods -n monitoring
kubectl get svc -n monitoring
kubectl get hpa
```
## Open Grafana
Run:
```bash
bash monitoring/scripts/port-forward-grafana.sh
```
Then open:
```text
http://localhost:3000
```
Login:
```text
Username: admin
Password: admin123
```
Stop port-forwarding with `Ctrl + C`.
## Useful Grafana Dashboards
Open Grafana and go to `Dashboards`.
Useful dashboards:
- `Kubernetes / Networking / Cluster`
- `Kubernetes / Compute Resources / Cluster`
- `Kubernetes / Compute Resources / Namespace`
- `Kubernetes / Compute Resources / Pod`
- `Kubernetes / Compute Resources / Node`

For this project, select the `default` namespace to view app metrics for:

- `api-gateway`
- `auth-service`
- `course-service`
- `registration-service`
- `notification-service`
- `redis`
- `rabbitmq`
The `ingress-nginx` namespace shows public ingress traffic.
The `monitoring` namespace shows Prometheus, Grafana, and Alertmanager traffic.
## Prometheus
To open Prometheus directly:
```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```
Then open:
```text
http://localhost:9090
```

If HPA shows `cpu: <unknown>`, wait a short time and check again:
```bash
kubectl get hpa
```
