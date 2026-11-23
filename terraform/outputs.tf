output "instance_public_ip" {
  description = "Public IP address of the CloudDesk EC2 server"
  value       = aws_instance.clouddesk_server.public_ip
}

output "application_url" {
  description = "URL to access the deployed CloudDesk dashboard"
  value       = "http://${aws_instance.clouddesk_server.public_ip}"
}
