#!/bin/bash

set -e

kubectl apply -f monitoring/rules/
kubectl apply -f monitoring/service-monitors/
kubectl apply -f monitoring/dashboards/
kubectl get prometheusrule -n monitoring
