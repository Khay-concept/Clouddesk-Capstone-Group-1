from flask import Blueprint, jsonify, render_template, request
from .models import Ticket, db

main_bp = Blueprint("main", __name__)

VALID_STATUSES = {"Open", "In progress", "Resolved"}
VALID_PRIORITIES = {"Low", "Medium", "High", "Critical"}

def seed_initial_tickets():
    if Ticket.query.count() > 0:
        return

    samples = [
        Ticket(
            ticket_code="HD-1048",
            title="Laptop not connecting to office Wi-Fi",
            requester_name="Chika Eze",
            requester_email="chika.eze@company.com",
            category="Network",
            priority="High",
            status="Open",
        ),
        Ticket(
            ticket_code="HD-1047",
            title="VPN access request for remote work",
            requester_name="Daniel Okafor",
            requester_email="daniel.okafor@company.com",
            category="Access",
            priority="Medium",
            status="In progress",
        ),
        Ticket(
            ticket_code="HD-1046",
            title="Email client crashing on attachment preview",
            requester_name="Amina Bello",
            requester_email="amina.bello@company.com",
            category="Software",
            priority="Low",
            status="Resolved",
        ),
        Ticket(
            ticket_code="HD-1045",
            title="New monitor setup for finance desk",
            requester_name="Tunde Adeyemi",
            requester_email="tunde.adeyemi@company.com",
            category="Hardware",
            priority="Low",
            status="Open",
        ),
        Ticket(
            ticket_code="HD-1044",
            title="SSO login timeout on internal portal",
            requester_name="Ngozi Nwosu",
            requester_email="ngozi.nwosu@company.com",
            category="Security",
            priority="High",
            status="In progress",
        ),
    ]
    db.session.add_all(samples)
    db.session.commit()

@main_bp.route("/")
def index():
    return render_template("index.html")

@main_bp.route("/health")
def health():
    return jsonify({"status": "ok"}), 200

@main_bp.route("/api/tickets", methods=["GET"])
def get_tickets():
    status = request.args.get("status")
    priority = request.args.get("priority")
    search = (request.args.get("q") or "").strip().lower()

    query = Ticket.query
    if status and status != "All":
        query = query.filter_by(status=status)
    if priority and priority != "All":
        query = query.filter_by(priority=priority)

    tickets = query.order_by(Ticket.id.desc()).all()
    items = [t.to_dict() for t in tickets]

    if search:
        items = [
            t for t in items
            if search in t["title"].lower()
            or search in t["ticket_code"].lower()
            or search in t["requester_name"].lower()
            or search in t["category"].lower()
        ]

    all_tickets = Ticket.query.all()
    stats = {
        "total": len(all_tickets),
        "open": sum(1 for t in all_tickets if t.status == "Open"),
        "in_progress": sum(1 for t in all_tickets if t.status == "In progress"),
        "resolved": sum(1 for t in all_tickets if t.status == "Resolved"),
    }

    return jsonify({"tickets": items, "stats": stats}), 200

@main_bp.route("/api/tickets", methods=["POST"])
def create_ticket():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    requester_name = (data.get("requester_name") or "").strip()
    requester_email = (data.get("requester_email") or "").strip()
    category = (data.get("category") or "General").strip()
    priority = data.get("priority", "Medium")
    status = data.get("status", "Open")

    if not title or not requester_name or not requester_email:
        return jsonify({"error": "title, requester_name, and requester_email are required"}), 400
    if status not in VALID_STATUSES:
        return jsonify({"error": f"Invalid status. Expected one of {sorted(VALID_STATUSES)}"}), 400
    if priority not in VALID_PRIORITIES:
        return jsonify({"error": f"Invalid priority. Expected one of {sorted(VALID_PRIORITIES)}"}), 400

    next_num = 1049 + Ticket.query.count()
    ticket = Ticket(
        ticket_code=f"HD-{next_num}",
        title=title,
        requester_name=requester_name,
        requester_email=requester_email,
        category=category,
        priority=priority,
        status=status,
    )
    db.session.add(ticket)
    db.session.commit()
    return jsonify({"ticket": ticket.to_dict()}), 201

@main_bp.route("/api/tickets/<int:ticket_id>/status", methods=["PATCH"])
def update_ticket_status(ticket_id):
    ticket = db.session.get(Ticket, ticket_id)
    if ticket is None:
        return jsonify({"error": "Ticket not found"}), 404
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")

    if new_status not in VALID_STATUSES:
        return jsonify({"error": f"Invalid status. Expected one of {sorted(VALID_STATUSES)}"}), 400

    ticket.status = new_status
    db.session.commit()
    return jsonify({"ticket": ticket.to_dict()}), 200
