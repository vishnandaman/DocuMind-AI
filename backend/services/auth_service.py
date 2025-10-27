import jwt
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Optional
import os
from .mongodb_service import MongoDBService

class AuthService:
    def __init__(self):
        self.secret_key = os.getenv("SECRET_KEY", "your-secret-key-here")
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30
        
        # Use MongoDB for user storage
        self.mongodb = MongoDBService()
    
    async def register_user(self, username: str, password: str) -> Dict[str, str]:
        """Register a new user"""
        # Check if user already exists
        existing_user = await self.mongodb.get_user_by_username(username)
        if existing_user:
            raise ValueError("Username already exists")
        
        # Hash password
        password_hash = self._hash_password(password)
        
        # Create user
        user_id = secrets.token_urlsafe(16)
        user_data = {
            "id": user_id,
            "username": username,
            "password_hash": password_hash,
            "created_at": datetime.utcnow(),
            "last_login": None,
            "is_active": True
        }
        
        # Save to MongoDB
        await self.mongodb.add_user(user_data)
        
        return {
            "id": user_id,
            "username": username,
            "created_at": user_data["created_at"].isoformat()
        }
    
    async def authenticate_user(self, username: str, password: str) -> str:
        """Authenticate user and return JWT token"""
        # Get user from MongoDB
        user = await self.mongodb.get_user_by_username(username)
        if not user:
            raise ValueError("Invalid username or password")
        
        # Verify password
        if not self._verify_password(password, user["password_hash"]):
            raise ValueError("Invalid username or password")
        
        # Update last login
        await self.mongodb.update_user(username, {
            "last_login": datetime.utcnow()
        })
        
        # Generate JWT token
        token = self._create_access_token(user["id"], username)
        return token
    
    async def verify_token(self, token: str) -> Dict[str, str]:
        """Verify JWT token and return user info"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            user_id = payload.get("sub")
            username = payload.get("username")
            
            if not user_id or not username:
                raise ValueError("Invalid token")
            
            # Verify user still exists in MongoDB
            user = await self.mongodb.get_user_by_username(username)
            if not user:
                raise ValueError("User not found")
            
            return {
                "id": user_id,
                "username": username
            }
            
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")
    
    def _hash_password(self, password: str) -> str:
        """Hash password using SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def _verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        return self._hash_password(password) == password_hash
    
    def _create_access_token(self, user_id: str, username: str) -> str:
        """Create JWT access token"""
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        payload = {
            "sub": user_id,
            "username": username,
            "exp": expire,
            "iat": datetime.utcnow()
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def check_permission(self, user_role: str, required_role: str) -> bool:
        """Check if user has required permission level"""
        role_hierarchy = {
            "viewer": 1,
            "user": 2,
            "admin": 3
        }
        
        user_level = role_hierarchy.get(user_role, 0)
        required_level = role_hierarchy.get(required_role, 0)
        
        return user_level >= required_level
    
    async def get_user_role(self, username: str) -> str:
        """Get user role from database"""
        try:
            user = await self.mongodb.get_user_by_username(username)
            return user.get("role", "user") if user else "user"
        except Exception:
            return "user"
