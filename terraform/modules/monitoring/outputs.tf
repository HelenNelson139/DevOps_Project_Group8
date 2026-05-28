output "release_name" {
  value = helm_release.kube_prometheus_stack.name
}

output "namespace" {
  value = helm_release.kube_prometheus_stack.namespace
}
