import os
from flask import Flask
from .config import get_config
from .extensions import db, migrate, jwt, mail, bcrypt, limiter, socketio, cors


def create_app(config_class=None) -> Flask:
    app = Flask(__name__)

    if config_class is None:
        config_class = get_config()
    app.config.from_object(config_class)

    _init_extensions(app)
    _register_blueprints(app)
    _ensure_dirs(app)

    return app


def _init_extensions(app: Flask) -> None:
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)
    bcrypt.init_app(app)
    limiter.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )
    socketio.init_app(
        app,
        cors_allowed_origins=app.config["CORS_ORIGINS"],
        message_queue=app.config.get("SOCKETIO_MESSAGE_QUEUE"),
    )

    # Import models so Flask-Migrate can detect them
    from .models import user, otp, audit_log, registration_request, report  # noqa: F401

    # JWT callbacks
    from .utils.jwt_callbacks import register_jwt_callbacks
    register_jwt_callbacks(jwt)


def _register_blueprints(app: Flask) -> None:
    from .api import register_blueprints
    register_blueprints(app)


def _ensure_dirs(app: Flask) -> None:
    reports_dir = app.config.get("REPORTS_DIR", "reports")
    os.makedirs(reports_dir, exist_ok=True)
