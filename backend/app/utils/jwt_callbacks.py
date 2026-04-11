from flask import jsonify
from flask_jwt_extended import JWTManager


def register_jwt_callbacks(jwt: JWTManager) -> None:

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        return jsonify({"error": "Token has expired.", "code": "token_expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"error": "Invalid token.", "code": "invalid_token"}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"error": "Authentication required.", "code": "authorization_required"}), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_data):
        return jsonify({"error": "Token has been revoked.", "code": "token_revoked"}), 401
