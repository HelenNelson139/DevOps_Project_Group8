variable "release_name" {
  type    = string
  default = "prometheus"
}

variable "namespace" {
  type    = string
  default = "monitoring"
}

variable "create_namespace" {
  type    = bool
  default = false
}

variable "repository" {
  type    = string
  default = "https://prometheus-community.github.io/helm-charts"
}

variable "chart" {
  type    = string
  default = "kube-prometheus-stack"
}

variable "chart_version" {
  type    = string
  default = "85.2.2"
}

variable "values_file" {
  type = string
}

variable "extra_values_files" {
  type    = list(string)
  default = []
}

variable "timeout" {
  type    = number
  default = 300
}
