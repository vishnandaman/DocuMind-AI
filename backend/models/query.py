from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class QueryRequest(BaseModel):
    query: str
    conversation_history: Optional[List[Dict[str, str]]] = None
    max_results: Optional[int] = 5
    document_id: Optional[str] = None  # New field for file-specific queries

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    confidence: float
    query_id: str
    timestamp: str
    document_searched: Optional[str] = None  # Which document was searched
    conversation_updated: bool = False

class ConversationMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: str
    query_id: Optional[str] = None
