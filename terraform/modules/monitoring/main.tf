resource "helm_release" "kube_prometheus_stack" {
  name             = var.release_name
  namespace        = var.namespace
  create_namespace = var.create_namespace

  repository = var.repository
  chart      = var.chart
  version    = var.chart_version

  values = concat(
    [file(var.values_file)],
    [for values_file in var.extra_values_files : file(values_file)]
  )

  wait    = true
  timeout = var.timeout
}
