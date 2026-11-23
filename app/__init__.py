import os
from flask import Flask
from .config import Config
from .models import db
from .routes import main_bp, seed_initial_tickets

def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(Config)

    if test_config:
        app.config.update(test_config)

    os.makedirs(app.instance_path, exist_ok=True)
    db.init_app(app)
    app.register_blueprint(main_bp)

    with app.app_context():
        db.create_all()
        seed_initial_tickets()

    return app
