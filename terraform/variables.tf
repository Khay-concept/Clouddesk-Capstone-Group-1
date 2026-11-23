variable "aws_region" {
  description = "AWS region to deploy CloudDesk"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "Name of an existing AWS EC2 Key Pair for SSH access"
  type        = string
}

variable "repo_url" {
  description = "HTTPS URL of your GitHub repository"
  type        = string
}
