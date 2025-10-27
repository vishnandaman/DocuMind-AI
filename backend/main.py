from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
import shutil
from pathlib import Path
import asyncio
from datetime import datetime
import json
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")

from services.document_processor import DocumentProcessor
from services.vector_store import VectorStore
from services.ai_processor import AIProcessor
from services.summarization_service import SummarizationService
from services.analytics_service import AnalyticsService
from services.auth_service import AuthService
from services.mongodb_service import MongoDBService
from models.document import Document, DocumentMetadata
from models.query import QueryRequest, QueryResponse

app = FastAPI(title="DocuMind API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

document_processor = DocumentProcessor()
vector_store = VectorStore()
ai_processor = AIProcessor()

summarization_service = SummarizationService()
auth_service = AuthService()
mongodb_service = MongoDBService()
analytics_service = AnalyticsService()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

class UploadResponse(BaseModel):
    document_id: str
    filename: str
    status: str
    message: str

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        user = await auth_service.verify_token(credentials.credentials)
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

@app.on_event("startup")
async def startup_event():
    await mongodb_service.create_indexes()

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0"
    )

@app.post("/auth/register")
async def register(username: str = Form(...), password: str = Form(...)):
    try:
        user = await auth_service.register_user(username, password)
        return {"message": "User registered successfully", "user_id": user["id"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
async def login(username: str = Form(...), password: str = Form(...)):
    try:
        token = await auth_service.authenticate_user(username, password)
        return {"access_token": token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/documents/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        document_id = str(uuid.uuid4())
        
        file_path = UPLOAD_DIR / f"{document_id}_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        document_data = await document_processor.process_document(file_path, file.filename)
        
        await vector_store.add_document(document_id, document_data, current_user['username'])
        
        await mongodb_service.add_document(document_id, document_data, current_user['username'])
        
        os.remove(file_path)
        
        return UploadResponse(
            document_id=document_id,
            filename=file.filename,
            status="success",
            message="Document processed and indexed successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.get("/documents")
async def get_documents(current_user: dict = Depends(get_current_user)):
    """Get list of uploaded documents for current user only"""
    try:
        documents = await mongodb_service.get_user_documents(current_user['username'])
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving documents: {str(e)}")

@app.post("/query", response_model=QueryResponse)
async def query_documents(
    query_request: QueryRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        print(f"Query received: '{query_request.query}'")
        print(f"User: {current_user.get('username', 'Unknown')}")
        
        print("Searching for relevant documents...")
        if query_request.document_id:
            print(f"Searching in specific document: {query_request.document_id}")
        relevant_docs = await vector_store.search(
            query_request.query, 
            limit=query_request.max_results or 5,
            document_id=query_request.document_id,
            user_id=current_user['username']
        )
        print(f"Found {len(relevant_docs)} relevant documents")
        
        print("Generating AI response...")
        start_time = datetime.utcnow()
        response = await ai_processor.generate_response(
            query_request.query,
            relevant_docs,
            query_request.conversation_history
        )
        response_time = (datetime.utcnow() - start_time).total_seconds()
        print("AI response generated successfully")
        
        await analytics_service.track_query(
            current_user['username'],
            query_request.query,
            query_request.document_id,
            response_time
        )
        
        if query_request.document_id and relevant_docs:
            first_doc = relevant_docs[0]
            response['document_searched'] = first_doc.get('metadata', {}).get('filename', 'Unknown')
        elif relevant_docs:
            first_doc = relevant_docs[0]
            response['document_searched'] = first_doc.get('metadata', {}).get('filename', 'Unknown')
        
        return response
        
    except Exception as e:
        print(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

@app.get("/conversation/{session_id}")
async def get_conversation_history(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get conversation history for a session"""
    try:
        history = await mongodb_service.get_conversation_history(
            current_user['username'], 
            session_id, 
            limit=20
        )
        return {"conversation_history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving conversation history: {str(e)}")

@app.delete("/conversation/{session_id}")
async def clear_conversation_history(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Clear conversation history for a session"""
    try:
        success = await mongodb_service.clear_conversation_history(
            current_user['username'], 
            session_id
        )
        if success:
            return {"message": "Conversation history cleared successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to clear conversation history")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing conversation history: {str(e)}")

@app.get("/admin/users")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    """Get all users (admin only)"""
    try:
        # Check if user is admin
        user_role = await auth_service.get_user_role(current_user['username'])
        if user_role != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        users = await mongodb_service.get_all_users()
        return {"users": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving users: {str(e)}")

@app.get("/admin/documents")
async def get_all_documents(current_user: dict = Depends(get_current_user)):
    """Get all documents (admin only)"""
    try:
        # Check if user is admin
        user_role = await auth_service.get_user_role(current_user['username'])
        if user_role != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        documents = await mongodb_service.get_all_documents()
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving documents: {str(e)}")

@app.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a user (admin only)"""
    try:
        # Check if user is admin
        user_role = await auth_service.get_user_role(current_user['username'])
        if user_role != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Don't allow admin to delete themselves
        if user_id == current_user['username']:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
        success = await mongodb_service.delete_user(user_id)
        if success:
            return {"message": "User deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")

@app.get("/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    """Get user analytics and insights"""
    try:
        analytics = await analytics_service.get_user_analytics(current_user['username'])
        return {"analytics": analytics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving analytics: {str(e)}")

@app.get("/analytics/summary")
async def get_analytics_summary(current_user: dict = Depends(get_current_user)):
    """Get quick analytics summary"""
    try:
        analytics = await analytics_service.get_user_analytics(current_user['username'])
        
        # Create summary
        summary = {
            "total_queries": analytics.get('total_queries', 0),
            "total_documents": len(await mongodb_service.get_user_documents(current_user['username'])),
            "avg_response_time": f"{analytics.get('average_response_time', 0):.2f}s",
            "most_active_hour": max(analytics.get('activity_by_hour', []), key=lambda x: x['count'], default={'hour': 0})['hour'],
            "top_query_words": analytics.get('most_common_queries', [])[:3]
        }
        
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving analytics summary: {str(e)}")

@app.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a document (only if owned by current user)"""
    try:
        # Check if document belongs to current user
        user_docs = await mongodb_service.get_user_documents(current_user['username'])
        doc_exists = any(doc['document_id'] == document_id for doc in user_docs)
        
        if not doc_exists:
            raise HTTPException(status_code=403, detail="You can only delete your own documents")
        
        # Delete from vector store
        await vector_store.delete_document(document_id)
        
        # Delete from MongoDB
        await mongodb_service.delete_document(document_id)
        
        return {"message": "Document deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")

@app.get("/documents/{document_id}/content")
async def get_document_content(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get document content (only if owned by current user)"""
    try:
        # Check if document belongs to current user
        user_docs = await mongodb_service.get_user_documents(current_user['username'])
        doc_exists = any(doc['document_id'] == document_id for doc in user_docs)
        
        if not doc_exists:
            raise HTTPException(status_code=403, detail="You can only access your own documents")
        
        content = await mongodb_service.get_document_content(document_id)
        return {"content": content}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving document content: {str(e)}")

@app.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    """Get database statistics"""
    try:
        stats = await mongodb_service.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving stats: {str(e)}")

@app.get("/users")
async def get_users(current_user: dict = Depends(get_current_user)):
    """Get all users (admin only)"""
    try:
        # Get all users from MongoDB
        users = await mongodb_service.get_all_users()
        return {"users": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving users: {str(e)}")

@app.get("/users/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    """Get user statistics"""
    try:
        stats = await mongodb_service.get_user_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving user stats: {str(e)}")

@app.post("/documents/{document_id}/summarize")
async def summarize_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate AI-powered summary of a document"""
    try:
        # Check if document belongs to current user
        user_docs = await mongodb_service.get_user_documents(current_user['username'])
        doc_exists = any(doc['document_id'] == document_id for doc in user_docs)
        
        if not doc_exists:
            raise HTTPException(status_code=403, detail="You can only summarize your own documents")
        
        # Get document content and metadata
        document_data = await mongodb_service.get_document_content(document_id)
        if not document_data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Get document metadata
        doc_metadata = None
        for doc in user_docs:
            if doc['document_id'] == document_id:
                doc_metadata = doc
                break
        
        if not doc_metadata:
            raise HTTPException(status_code=404, detail="Document metadata not found")
        
        # Generate summary
        summary = await summarization_service.summarize_document(
            document_data, 
            doc_metadata
        )
        
        return {
            "document_id": document_id,
            "summary": summary,
            "generated_at": datetime.utcnow().isoformat(),
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

@app.get("/analytics/visualization")
async def get_analytics_visualization(
    current_user: dict = Depends(get_current_user)
):
    try:
        user_id = current_user.get('username')
        visualization_data = await analytics_service.get_visualization_data(user_id)
        return visualization_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting visualization data: {str(e)}")

@app.get("/analytics/admin")
async def get_admin_analytics(
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user.get('role') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        admin_data = await analytics_service.get_visualization_data()
        return admin_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting admin analytics: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
