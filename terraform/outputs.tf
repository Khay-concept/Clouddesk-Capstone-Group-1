output "instance_public_ip" {
  description = "Permanent Elastic IP of the CloudDesk server"
  value       = aws_eip.clouddesk_eip.public_ip
}

output "application_url" {
  description = "Permanent URL to access the CloudDesk web application"
  value       = "http://${aws_eip.clouddesk_eip.public_ip}"
}
