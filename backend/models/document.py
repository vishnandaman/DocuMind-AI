from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class DocumentMetadata(BaseModel):
    filename: str
    file_type: str
    file_size: int
    upload_date: datetime
    author: Optional[str] = None
    title: Optional[str] = None
    summary: Optional[str] = None

class Document(BaseModel):
    id: str
    content: str
    metadata: DocumentMetadata
    chunks: List[str]
    embeddings: Optional[List[float]] = None

class DocumentChunk(BaseModel):
    chunk_id: str
    document_id: str
    content: str
    metadata: Dict[str, Any]
    embedding: List[float]
