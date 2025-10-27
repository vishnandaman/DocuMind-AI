import motor.motor_asyncio
from pymongo import MongoClient
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

class MongoDBService:
    def __init__(self):
        self.mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        self.database_name = os.getenv("MONGODB_DATABASE", "DocuMind")
        
        self.client = motor.motor_asyncio.AsyncIOMotorClient(self.mongo_url)
        self.db = self.client[self.database_name]
        
        self.documents = self.db.documents
        self.users = self.db.users
        self.chunks = self.db.chunks
        self.conversations = self.db.conversations
    
    async def create_indexes(self):
        try:
            await self.documents.create_index("document_id", unique=True)
            await self.documents.create_index("filename")
            await self.documents.create_index("upload_date")
            await self.users.create_index("username", unique=True)
            await self.chunks.create_index("document_id")
            await self.chunks.create_index("chunk_id", unique=True)
            await self.conversations.create_index("user_id")
            await self.conversations.create_index("session_id")
        except Exception as e:
            print(f"Error creating indexes: {e}")
    
    # Conversation management methods
    async def save_conversation_message(self, user_id: str, session_id: str, message: Dict[str, Any]) -> bool:
        """Save a conversation message"""
        try:
            conversation_data = {
                "user_id": user_id,
                "session_id": session_id,
                "role": message["role"],
                "content": message["content"],
                "timestamp": datetime.utcnow(),
                "query_id": message.get("query_id")
            }
            
            await self.conversations.insert_one(conversation_data)
            return True
        except Exception as e:
            print(f"Error saving conversation message: {e}")
            return False
    
    async def get_conversation_history(self, user_id: str, session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get conversation history for a user session"""
        try:
            cursor = self.conversations.find(
                {"user_id": user_id, "session_id": session_id}
            ).sort("timestamp", -1).limit(limit)
            
            messages = []
            async for message in cursor:
                message['_id'] = str(message['_id'])
                messages.append(message)
            
            # Return in chronological order
            return list(reversed(messages))
        except Exception as e:
            print(f"Error getting conversation history: {e}")
            return []
    
    async def clear_conversation_history(self, user_id: str, session_id: str) -> bool:
        """Clear conversation history for a session"""
        try:
            await self.conversations.delete_many({
                "user_id": user_id,
                "session_id": session_id
            })
            return True
        except Exception as e:
            print(f"Error clearing conversation history: {e}")
            return False
    
    async def add_document(self, document_id: str, document_data: Dict[str, Any], user_id: str) -> bool:
        """Add a document to MongoDB"""
        try:
            # Prepare document data
            doc_data = {
                "document_id": document_id,
                "filename": document_data['metadata']['filename'],
                "file_type": document_data['metadata']['file_type'],
                "file_size": document_data['metadata']['file_size'],
                "upload_date": datetime.utcnow(),
                "content": document_data['content'],
                "chunks": document_data['chunks'],
                "status": "processed",
                "chunk_count": len(document_data['chunks']),
                "user_id": user_id
            }
            
            # Insert document
            await self.documents.insert_one(doc_data)
            
            # Insert chunks separately for better querying
            chunk_docs = []
            for i, chunk in enumerate(document_data['chunks']):
                chunk_doc = {
                    "chunk_id": f"{document_id}_chunk_{i}",
                    "document_id": document_id,
                    "content": chunk,
                    "chunk_index": i,
                    "filename": document_data['metadata']['filename']
                }
                chunk_docs.append(chunk_doc)
            
            if chunk_docs:
                await self.chunks.insert_many(chunk_docs)
            
            return True
            
        except Exception as e:
            print(f"Error adding document to MongoDB: {e}")
            return False
    
    async def get_user_documents(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all documents for a specific user"""
        try:
            cursor = self.documents.find({"user_id": user_id})
            documents = []
            async for doc in cursor:
                doc['_id'] = str(doc['_id'])  # Convert ObjectId to string
                documents.append(doc)
            return documents
        except Exception as e:
            print(f"Error getting user documents: {e}")
            return []
    
    async def get_all_documents(self) -> List[Dict[str, Any]]:
        """Get all documents metadata"""
        try:
            cursor = self.documents.find({}, {"content": 0, "chunks": 0})
            documents = []
            async for doc in cursor:
                # Convert ObjectId to string for JSON serialization
                doc["_id"] = str(doc["_id"])
                documents.append(doc)
            return documents
        except Exception as e:
            print(f"Error getting documents: {e}")
            return []
    
    async def get_document_by_id(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific document by ID"""
        try:
            doc = await self.documents.find_one({"document_id": document_id})
            if doc:
                doc["_id"] = str(doc["_id"])
            return doc
        except Exception as e:
            print(f"Error getting document: {e}")
            return None
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document and its chunks"""
        try:
            # Delete document
            result = await self.documents.delete_one({"document_id": document_id})
            
            # Delete associated chunks
            await self.chunks.delete_many({"document_id": document_id})
            
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting document: {e}")
            return False
    
    async def search_documents(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search documents by filename or content"""
        try:
            # Create text search query
            search_query = {
                "$or": [
                    {"filename": {"$regex": query, "$options": "i"}},
                    {"content": {"$regex": query, "$options": "i"}}
                ]
            }
            
            cursor = self.documents.find(search_query).limit(limit)
            documents = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                documents.append(doc)
            
            return documents
        except Exception as e:
            print(f"Error searching documents: {e}")
            return []
    
    async def get_document_content(self, document_id: str) -> str:
        """Get full document content"""
        try:
            doc = await self.documents.find_one(
                {"document_id": document_id},
                {"content": 1}
            )
            return doc["content"] if doc else ""
        except Exception as e:
            print(f"Error getting document content: {e}")
            return ""
    
    async def add_user(self, user_data: Dict[str, Any]) -> bool:
        """Add a new user"""
        try:
            await self.users.insert_one(user_data)
            return True
        except Exception as e:
            print(f"Error adding user: {e}")
            return False
    
    async def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user by username"""
        try:
            user = await self.users.find_one({"username": username})
            if user:
                user["_id"] = str(user["_id"])
            return user
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
    
    async def update_user(self, username: str, update_data: Dict[str, Any]) -> bool:
        """Update user data"""
        try:
            result = await self.users.update_one(
                {"username": username},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating user: {e}")
            return False
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        try:
            total_docs = await self.documents.count_documents({})
            total_users = await self.users.count_documents({})
            total_chunks = await self.chunks.count_documents({})
            
            # Get recent uploads (last 7 days)
            week_ago = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            week_ago = week_ago.replace(day=week_ago.day - 7)
            
            recent_uploads = await self.documents.count_documents({
                "upload_date": {"$gte": week_ago}
            })
            
            return {
                "total_documents": total_docs,
                "total_users": total_users,
                "total_chunks": total_chunks,
                "recent_uploads": recent_uploads
            }
        except Exception as e:
            print(f"Error getting stats: {e}")
            return {}
    
    async def close(self):
        """Close MongoDB connection"""
        self.client.close()
    
    async def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users"""
        try:
            cursor = self.users.find({}, {"password_hash": 0})  # Exclude password hash
            users = []
            async for user in cursor:
                user["_id"] = str(user["_id"])
                users.append(user)
            return users
        except Exception as e:
            print(f"Error getting users: {e}")
            return []
    
    async def get_user_stats(self) -> Dict[str, Any]:
        """Get user statistics"""
        try:
            total_users = await self.users.count_documents({})
            active_users = await self.users.count_documents({"is_active": True})
            
            # Get recent registrations (last 7 days)
            week_ago = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            week_ago = week_ago.replace(day=week_ago.day - 7)
            
            recent_registrations = await self.users.count_documents({
                "created_at": {"$gte": week_ago}
            })
            
            # Get users with recent logins (last 24 hours)
            day_ago = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            day_ago = day_ago.replace(day=day_ago.day - 1)
            
            recent_logins = await self.users.count_documents({
                "last_login": {"$gte": day_ago}
            })
            
            return {
                "total_users": total_users,
                "active_users": active_users,
                "recent_registrations": recent_registrations,
                "recent_logins": recent_logins
            }
        except Exception as e:
            print(f"Error getting user stats: {e}")
            return {}
    
    # Admin methods
    async def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users (admin only)"""
        try:
            cursor = self.users.find({})
            users = []
            async for user in cursor:
                user['_id'] = str(user['_id'])
                users.append(user)
            return users
        except Exception as e:
            print(f"Error getting all users: {e}")
            return []
    
    async def get_all_documents(self) -> List[Dict[str, Any]]:
        """Get all documents (admin only)"""
        try:
            cursor = self.documents.find({})
            documents = []
            async for doc in cursor:
                doc['_id'] = str(doc['_id'])
                documents.append(doc)
            return documents
        except Exception as e:
            print(f"Error getting all documents: {e}")
            return []
    
    async def delete_user(self, username: str) -> bool:
        """Delete a user and all their data"""
        try:
            # Delete user
            user_result = await self.users.delete_one({"username": username})
            
            # Delete user's documents
            await self.documents.delete_many({"user_id": username})
            
            # Delete user's chunks
            await self.chunks.delete_many({"user_id": username})
            
            # Delete user's conversations
            await self.conversations.delete_many({"user_id": username})
            
            return user_result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting user: {e}")
            return False
