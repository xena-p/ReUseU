from flask import Blueprint, request, jsonify
from db import users_col
from user.models import User
import os, uuid
from werkzeug.utils import secure_filename
from item.routes import UPLOAD_FOLDER, allowed_file

from . import user_bp

@user_bp.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json(silent=True) or {}
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")
        possible_dates = data.get("possible_dates", [])
        profile = data.get("profile", {})
        program = data.get("program", "")
        degree = data.get("degree", "")
        
        if not username or not email or not password:
            return jsonify({"error": "Missing username, email, or password"}), 400

        result, status_code = User.signup(username, email, password, possible_dates, profile, program, degree)
        return jsonify(result), status_code
    except Exception as e:
        print(f"Signup error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@user_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}  # safer than request.json
    result, status = User.login(data)  # use your User class login method
    return jsonify(result), status

@user_bp.route("/user/<user_id>", methods=["GET"])
def get_user(user_id):
    user = User.get_user_by_id(user_id)
    if user:
        return jsonify(user), 200
    else:
        return jsonify({"error": "User not found"}), 404

@user_bp.route("/user/<user_id>", methods=["PATCH"])
def update_user(user_id):
    pic_path = None
    file = request.files.get("profile_pic")

    if file and file.filename:
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid image type"}), 400
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        name = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
        file.save(os.path.join(UPLOAD_FOLDER, name))
        pic_path = f"/uploads/{name}"
    
    result, status = User.update_profile(
        user_id,
        username=request.form.get("username"),
        degree=request.form.get("degree"),
        program=request.form.get("program"),
        profile_pic=pic_path,
    )
    return jsonify(result), status


@user_bp.route("/user/<user_id>/password", methods=["PATCH"])
def change_password(user_id):
    data = request.get_json(silent=True) or {}
    result, status = User.change_password(
        user_id, data.get("current_password"), data.get("new_password")
    )
    return jsonify(result), status



@user_bp.route("/user/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    response, status_code = User.delete_user(user_id)
    return jsonify(response), status_code
