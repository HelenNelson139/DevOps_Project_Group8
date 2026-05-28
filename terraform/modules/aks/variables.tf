variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "cluster_name" {
  type    = string
  default = "devops-aks"
}

variable "dns_prefix" {
  type    = string
  default = "devopsaks"
}

variable "node_count" {
  type    = number
  default = 2
}

variable "min_count" {
  type    = number
  default = 2
}

variable "max_count" {
  type    = number
  default = 4
}

variable "vm_size" {
  type    = string
  default = "Standard_B2s_v2"
}

variable "vnet_subnet_id" {
  type = string
}
