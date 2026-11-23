terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
}

resource "aws_security_group" "clouddesk_sg" {
  name        = "clouddesk-web-sg"
  description = "Allow SSH and HTTP traffic to CloudDesk"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "clouddesk_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.clouddesk_sg.id]

  user_data = <<-USERDATA
              #!/bin/bash
              set -e
              apt-get update -y
              apt-get install -y python3-pip python3-venv nginx git

              git clone ${var.repo_url} /opt/clouddesk
              cd /opt/clouddesk
              python3 -m venv venv
              ./venv/bin/pip install -r requirements.txt

              cat << 'SERVICE' > /etc/systemd/system/clouddesk.service
              [Unit]
              Description=CloudDesk Gunicorn Service
              After=network.target

              [Service]
              User=www-data
              Group=www-data
              WorkingDirectory=/opt/clouddesk
              Environment="PATH=/opt/clouddesk/venv/bin"
              ExecStart=/opt/clouddesk/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:5000 run:app
              Restart=always

              [Install]
              WantedBy=multi-user.target
              SERVICE

              chown -R www-data:www-data /opt/clouddesk
              systemctl daemon-reload
              systemctl enable --now clouddesk

              cat << 'NGINX' > /etc/nginx/sites-available/clouddesk
              server {
                  listen 80;
                  server_name _;

                  location / {
                      proxy_pass http://127.0.0.1:5000;
                      proxy_set_header Host $host;
                      proxy_set_header X-Real-IP $remote_addr;
                      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                  }
              }
              NGINX

              ln -sf /etc/nginx/sites-available/clouddesk /etc/nginx/sites-enabled/clouddesk
              rm -f /etc/nginx/sites-enabled/default
              systemctl restart nginx
              USERDATA

  tags = {
    Name = "CloudDesk-Helpdesk-Server"
  }
}
