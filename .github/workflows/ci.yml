# CloudDesk IT Helpdesk

Full-stack IT Helpdesk and Ticket Management System built with **Python Flask**, **SQLAlchemy**, **Gunicorn**, **Nginx**, **Terraform**, **AWS EC2**, and **GitHub Actions CI/CD**.

## Live Deployment
- **Application URL**: http://184.194.104.56
- **Health Check Endpoint**: http://184.194.104.56/health

## Architecture Overview
- **Frontend**: Responsive HTML5, CSS3, and Vanilla JavaScript dashboard with real-time KPI statistics, search, status/priority filtering, and modal ticket management.
- **Backend & Database**: Python Flask REST API (`/api/tickets`, `/api/stats`, `/health`) backed by SQLAlchemy + SQLite (`clouddesk.db`) and served via Gunicorn (`systemd` service).
- **Reverse Proxy & Cloud Infrastructure**: Nginx reverse proxy on Ubuntu 24.04 LTS (`t3.micro`) provisioned via Terraform (`terraform/`) with a static AWS Elastic IP (`184.194.104.56`) and security group rules for HTTP (80) and SSH (22).
- **CI/CD Pipeline**: GitHub Actions (`.github/workflows/ci.yml`) automatically executes `pytest` on every push/PR and deploys verified `main` commits to AWS EC2 over SSH.

## Local Setup

```bash
python -m venv venv
source venv/Scripts/activate  # Windows Git Bash (or source venv/bin/activate on Linux/macOS)
pip install -r requirements.txt
pytest -v
python run.py