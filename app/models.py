from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Ticket(db.Model):
    __tablename__ = "tickets"

    id = db.Column(db.Integer, primary_key=True)
    ticket_code = db.Column(db.String(20), unique=True, nullable=False)
    title = db.Column(db.String(160), nullable=False)
    requester_name = db.Column(db.String(120), nullable=False)
    requester_email = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(60), nullable=False, default="General")
    priority = db.Column(db.String(20), nullable=False, default="Medium")
    status = db.Column(db.String(30), nullable=False, default="Open")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "ticket_code": self.ticket_code,
            "title": self.title,
            "requester_name": self.requester_name,
            "requester_email": self.requester_email,
            "category": self.category,
            "priority": self.priority,
            "status": self.status,
            "created_at": self.created_at.strftime("%b %d, %Y"),
        }
