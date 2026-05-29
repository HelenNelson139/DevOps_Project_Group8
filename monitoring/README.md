# Monitoring
Monitoring uses `kube-prometheus-stack` on AKS.
Main components:
- Prometheus: collects metrics.
- Grafana: displays dashboards.
- Alertmanager: sends alerts.
- kube-state-metrics and node-exporter: expose Kubernetes and node metrics.
- Prometheus Operator: manages `PrometheusRule` and `ServiceMonitor`.

## Prerequisites
Run from the project root and check the AKS context:
```bash
kubectl config current-context
kubectl get nodes
helm version
```
## Install
Install or upgrade the monitoring stack:
```bash
bash monitoring/scripts/install-monitoring.sh
```
If Terraform manages the Helm release, use `terraform apply` from the `terraform/` folder instead.
This script remains available as a manual fallback.

The script installs `kube-prometheus-stack`, then applies:
- alert rules from `monitoring/rules/`
- service monitors from `monitoring/service-monitors/`
- Grafana dashboards from `monitoring/dashboards/`

## Apply Project Monitoring Only
Use this when Prometheus/Grafana already exists and only rules, ServiceMonitors, or dashboards changed.

```powershell
.\monitoring\scripts\apply-monitoring-rules.ps1
```
Bash:
```bash
bash monitoring/scripts/apply-monitoring-rules.sh
```
Apply only the Grafana dashboard:
```bash
kubectl apply -f monitoring/dashboards/uit-course-services-dashboard.yaml
```
## Application Metrics
Node.js services expose metrics at:
```text
/metrics
```
Prometheus discovers them through:
```text
monitoring/service-monitors/uit-course-services.yaml
```
Current app metrics:
- `uit_course_http_requests_total`
- `uit_course_http_request_duration_seconds`
- `uit_course_nodejs_memory_bytes`
Collected services:
- `auth-service`
- `course-service`
- `registration-service`
- `notification-service`

API Gateway canary metrics come from NGINX Ingress Controller:
- `api_gateway_http_requests_total`
- `api_gateway_http_request_duration_seconds_bucket`

Prometheus discovers the stable and canary gateway services through:
```text
monitoring/service-monitors/api-gateway.yaml
```
The AI Agent uses these labels to compare:
- `service="api-gateway-stable"`
- `service="api-gateway-canary"`
## Alerts
Rule files:

- `monitoring/rules/basic-alerts.yaml`: Kubernetes health alerts.
- `monitoring/rules/app-alerts.yaml`: application alerts.
Covered cases:
- Pod stuck in `CrashLoopBackOff`, `Pending`, `Unknown`, or `Failed`.
- Deployment has unavailable replicas.
- HPA stays at max replicas.
- Prometheus scrape target is down.
- HTTP 5xx error ratio is high.
- HTTP p95 latency is high.
- UIT Course metrics target is missing.

## Teams Alerts
Set the Teams webhook locally. Do not commit the webhook URL to Git.
PowerShell:
```powershell
$env:TEAMS_WEBHOOK_URL="https://..."
.\monitoring\scripts\apply-alertmanager-teams.ps1
```
Bash:
```bash
export TEAMS_WEBHOOK_URL="https://..."
bash monitoring/scripts/apply-alertmanager-teams.sh
```
Check:
```bash
kubectl get secret alertmanager-teams-webhook -n monitoring
kubectl get alertmanager -n monitoring
kubectl get pods -n monitoring | grep alertmanager
```
## Grafana
Open Grafana:
```bash
bash monitoring/scripts/port-forward-grafana.sh
```
URL:
```text
http://localhost:3000
```
Login:
```text
Username: admin
Password: admin123
```
Stop port-forwarding with `Ctrl + C`.
Useful dashboards:

- `UIT Course Services`
- `API Gateway Canary`
- `Kubernetes / Compute Resources / Cluster`
- `Kubernetes / Compute Resources / Namespace`
- `Kubernetes / Compute Resources / Pod`
- `Kubernetes / Compute Resources / Node`
- `Kubernetes / Networking / Cluster`

## UIT Course Services Dashboard
Panels:
- `Scrape health`: Prometheus can scrape the service. `1` is healthy, `0` is down.
- `Request rate`: requests per second by service.
- `5xx errors`: server error ratio by service. No errors show as `0`.
- `P95 latency`: 95% of requests are faster than this value.
- `Heap memory`: Node.js heap memory usage in MB.
- `Status codes`: request rate grouped by HTTP status code.

## API Gateway Canary Dashboard
Panels:
- `Gateway scrape`: Prometheus can scrape API Gateway metrics.
- `Gateway RPS`: request rate for `api-gateway-stable` and `api-gateway-canary`.
- `Gateway 5xx`: server error ratio for stable and canary traffic.
- `Gateway P95`: p95 request latency for stable and canary traffic.

## Prometheus
Open Prometheus:
```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```
URL:
```text
http://localhost:9090
```
