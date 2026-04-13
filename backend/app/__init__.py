import os
from flask import Flask, jsonify
from .config import get_config
from .extensions import db, migrate, jwt, mail, bcrypt, limiter, socketio, cors


def create_app(config_class=None) -> Flask:
    app = Flask(__name__)

    if config_class is None:
        config_class = get_config()
    app.config.from_object(config_class)

    _init_extensions(app)
    _register_blueprints(app)
    _register_error_handlers(app)
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


def _register_error_handlers(app: Flask) -> None:
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad request."}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"error": "Authentication required."}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Access denied."}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found."}), 404

    @app.errorhandler(429)
    def too_many_requests(e):
        return jsonify({"error": "Too many requests. Please slow down."}), 429

    @app.errorhandler(500)
    def internal_error(e):
        app.logger.error(f"Internal server error: {e}", exc_info=True)
        return jsonify({"error": "An internal server error occurred."}), 500

    @app.errorhandler(Exception)
    def unhandled_exception(e):
        app.logger.error(f"Unhandled exception: {e}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred."}), 500


def _ensure_dirs(app: Flask) -> None:
    reports_dir = app.config.get("REPORTS_DIR", "reports")
    os.makedirs(reports_dir, exist_ok=True)
