import hashlib
import secrets
from flask import Flask, jsonify
from flask import current_app
from db import users_col
from bson.objectid import ObjectId

class User:
    @staticmethod
    def hash_password(password, salt=None):
        if salt is None:
            salt = secrets.token_hex(16)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        return password_hash, salt
    
    @staticmethod
    def verify_password(password, stored_hash, salt):
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        return password_hash == stored_hash

    @staticmethod
    def signup(username, email, password, possible_dates, profile, program, degree):
        allowed_domains = ["@torontomu.ca", "@mail.utoronto.ca", "@uwo.ca", "@my.yorku.ca"]

        #2. Convert to lowercase and check
        email_lower = email.lower()

        #make it so email is universty domain only liek torontomu.ca
        school = None
        if email_lower.endswith("@torontomu.ca"):
            school = "TMU"
        elif email_lower.endswith("@mail.utoronto.ca"):
            school = "UofT"
        elif email_lower.endswith("@uwo.ca"):
            school = "Western"
        elif email_lower.endswith("@my.yorku.ca"):
            school = "York"
        else:
            return {"error": "Invalid university email"}, 400


        if not school:
            return {"error": "Only TMU, UofT, York and Western emails are allowed"}, 400

        #Check if username already exists
        existing_user = users_col.find_one({"username": username})
        if existing_user:
            return {"error": "Username already exists"}, 400
        
        #Check if email already exists
        existing_email = users_col.find_one({"email": email})
        if existing_email:
            return {"error": "Email already exists"}, 400
        
        #Hashes password
        password_hash, salt = User.hash_password(password)

        #maybe add avatar/profile pic later


        user_school = profile.get("school", school)
        user = {
            "username": username,
            "email": email,
            "password_hash": password_hash,
            "salt": salt,
            "possible_dates": possible_dates,
            
            "profile": {
                "school": user_school,
                "degree": degree,
                "program": program,
                "rating": 0,
                "rating_sum": 0,
                "rating_count": 0,
                "profile_pic": "",
            }

            
        }
        result = users_col.insert_one(user)
        return {"message": "User created successfully"}, 200

    @staticmethod
    def login(data):
        email = data.get("email", "")  # normalize email
        password = data.get("password", "")

        if not email or not password:
            return {"error": "Email and password required"}, 400

        # find user by normalized email
        user = users_col.find_one({"email": email})
        if not user:
            return {"error": "Invalid credentials"}, 401

        # verify password
        input_hash, _ = User.hash_password(password, user["salt"])
        if input_hash == user["password_hash"]:
            # Remove sensitive data before returning
            user_data = {
                "user_id": str(user["_id"]),
                "username": user["username"],
                "email": user["email"],
                "profile": user.get("profile", {}),
                "possible_dates": user.get("possible_dates", [])
            }

            return user_data, 200
        else:
            return {"error": "Invalid credentials"}, 401

    @staticmethod
    def get_user_by_id(user_id):
        """Get user by user_id"""
        try:
            user = users_col.find_one({"_id": ObjectId(user_id)})
            if user:
                # Return user data without sensitive information
                user_data = {
                    "user_id": str(user["_id"]),
                    "username": user.get("username"),
                    "email": user.get("email"),
                    "profile": user.get("profile", {}),
                    "possible_dates": user.get("possible_dates", [])
                }
                return user_data
            return None
        except Exception as e:
            print(f"Error getting user by id: {str(e)}")
            return None

    @staticmethod
    def update_profile(user_id, username=None, degree=None, program=None, profile_pic=None):
        updates = {}
        if username is not None:
            username = username.strip()
            if not username:
                return {"error": "Username cannot be empty"}, 400
            # unique, but ignore the user's own record
            if users_col.find_one({"username": username, "_id": {"$ne": ObjectId(user_id)}}):
                return {"error": "Username already exists"}, 400
            updates["username"] = username
        if degree is not None:  updates["profile.degree"] = degree
        if program is not None: updates["profile.program"] = program
        if profile_pic:         updates["profile.profile_pic"] = profile_pic
        if not updates:
            return {"error": "Nothing to update"}, 400
        res = users_col.update_one({"_id": ObjectId(user_id)}, {"$set": updates})
        if res.matched_count == 0:
            return {"error": "User not found"}, 404
        return User.get_user_by_id(user_id), 200


    @staticmethod
    def change_password(user_id, current_password, new_password):
        if not current_password or not new_password:
            return {"error": "Current and new password required"}, 400
        if len(new_password) < 3:
            return {"error": "New password must be at least 8 characters"}, 400

        try:
            oid = ObjectId(user_id)
        except Exception:
            return {"error": "Invalid user id"}, 400

        user = users_col.find_one({"_id": oid})
        if not user:
            return {"error": "User not found"}, 404

        if not User.verify_password(current_password, user["password_hash"], user["salt"]):
            return {"error": "Current password is incorrect"}, 401

        new_hash, new_salt = User.hash_password(new_password)  # fresh salt
        users_col.update_one(
            {"_id": oid},
            {"$set": {"password_hash": new_hash, "salt": new_salt}},
        )
        return {"message": "Password updated successfully"}, 200

    @staticmethod
    def delete_user(user_id):
        try:
            user = users_col.find_one({"_id": ObjectId(user_id)})
            if not user:
                return {"error": "User not found"}, 404

            users_col.delete_one({"_id": ObjectId(user_id)})
            return {"message": "User deleted successfuly"}, 200

        except Exception as e:
            return {"error": str(e)}, 500