# Canary AI Agent

The AI agent is used as an advisor for Argo Rollouts canary analysis.
## Purpose
The agent reads Prometheus metrics for the stable and canary services, builds a time-series state vector, runs the DRQN model, and returns a rollout decision.
```text
Prometheus metrics -> AI agent -> AnalysisTemplate -> Argo Rollouts
```
## Endpoints
```text
GET  /health  basic liveness check
GET  /ready   model and Prometheus readiness check
GET  /model   model metadata, features, and action mapping
POST /predict canary decision endpoint
```
## Predict Request
```json
{
  "app_info": {
    "name": "api-gateway-rollout",
    "weight": 10,
    "namespace": "default",
    "canary_service": "api-gateway-canary",
    "stable_service": "api-gateway-stable"
  }
}
```
Optional field:
```json
{
  "pod_selector": "api-gateway-rollout-.*"
}
```
If `pod_selector` is not provided, the agent derives it from `name`.
## Predict Response
The response includes both the Argo-compatible decision and debugging information:

```text
decision            Successful, Running, or Rollback
traffic_signal      increase-fast, increase-slow, hold, or rollback
suggested_weight    suggested next traffic weight
reason              why the final decision was selected
data_complete       whether Prometheus returned enough metrics
metrics_raw         latest raw metrics
metrics_normalized  normalized state used by the model
q_values            model Q-values for each action
model_decision      decision before safety guard override
guard_triggered     whether safety guard changed the model decision
```