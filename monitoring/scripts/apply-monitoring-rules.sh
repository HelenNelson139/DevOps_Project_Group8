#!/bin/bash

set -e

kubectl apply -f monitoring/rules/
kubectl get prometheusrule -n monitoring
