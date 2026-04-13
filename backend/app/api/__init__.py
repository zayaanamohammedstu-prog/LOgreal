from flask import Flask


def register_blueprints(app: Flask) -> None:
    from .auth import auth_bp
    from .admin import admin_bp
    from .dashboard import dashboard_bp
    from .reports import reports_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")

    # Health check
    @app.get("/api/health")
    def health():
        return {"status": "ok", "service": "LogGuard API"}, 200
