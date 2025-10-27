import chromadb
from chromadb.config import Settings
import uuid
from typing import List, Dict, Any, Optional
import json
from datetime import datetime
import os

class VectorStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path="./chroma_db",
            settings=Settings(anonymized_telemetry=False)
        )
        
        try:
            self.collection = self.client.get_collection("documents")
        except:
            self.collection = self.client.create_collection(
                name="documents",
                metadata={"description": "Document embeddings for DocuMind"}
            )
    
    async def add_document(self, document_id: str, document_data: Dict[str, Any], user_id: str) -> bool:
        try:
            from services.embedding_service import EmbeddingService
            embedding_service = EmbeddingService()
            
            chunk_ids = []
            embeddings = []
            metadatas = []
            documents = []
            
            for i, chunk in enumerate(document_data['chunks']):
                chunk_id = f"{document_id}_chunk_{i}"
                embedding = await embedding_service.get_embedding(chunk)
                
                chunk_ids.append(chunk_id)
                embeddings.append(embedding)
                metadatas.append({
                    "document_id": document_id,
                    "chunk_index": i,
                    "filename": document_data['metadata']['filename'],
                    "file_type": document_data['metadata']['file_type'],
                    "upload_date": document_data['metadata']['upload_date'],
                    "user_id": user_id
                })
                documents.append(chunk)
            
            self.collection.add(
                ids=chunk_ids,
                embeddings=embeddings,
                metadatas=metadatas,
                documents=documents
            )
            
            count = self.collection.count()
            return True
            
        except Exception as e:
            print(f"Error adding document to vector store: {str(e)}")
            return False
    
    async def search(self, query: str, limit: int = 5, document_id: str = None, user_id: str = None) -> List[Dict[str, Any]]:
        try:
            from services.embedding_service import EmbeddingService
            embedding_service = EmbeddingService()
            
            query_embedding = await embedding_service.get_embedding(query)
            
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=min(limit * 4, 50),
                include=["documents", "metadatas", "distances"]
            )
            
            if document_id or user_id:
                filtered_results = {
                    'ids': [[]],
                    'documents': [[]],
                    'metadatas': [[]],
                    'distances': [[]]
                }
                
                if results['metadatas'] and results['metadatas'][0]:
                    for i, metadata in enumerate(results['metadatas'][0]):
                        doc_match = not document_id or metadata.get('document_id') == document_id
                        user_match = not user_id or metadata.get('user_id') == user_id
                        
                        if doc_match and user_match:
                            filtered_results['ids'][0].append(results['ids'][0][i])
                            filtered_results['documents'][0].append(results['documents'][0][i])
                            filtered_results['metadatas'][0].append(results['metadatas'][0][i])
                            filtered_results['distances'][0].append(results['distances'][0][i])
                
                results = filtered_results
            
            search_results = []
            if results['documents'] and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    similarity = 1 - results['distances'][0][i]
                    
                    if similarity > -1.0:
                        search_results.append({
                            "content": doc,
                            "metadata": results['metadatas'][0][i],
                            "similarity": similarity,
                            "document_id": results['metadatas'][0][i].get('document_id'),
                            "filename": results['metadatas'][0][i].get('filename')
                        })
            
            return search_results[:limit]
            
        except Exception as e:
            print(f"Error searching vector store: {str(e)}")
            return []
    
    async def get_all_documents(self) -> List[Dict[str, Any]]:
        """Get all documents metadata"""
        try:
            # Get all documents from collection
            results = self.collection.get(include=["metadatas"])
            
            # Group by document_id
            documents = {}
            if results['metadatas']:
                for metadata in results['metadatas']:
                    doc_id = metadata['document_id']
                    if doc_id not in documents:
                        documents[doc_id] = {
                            'document_id': doc_id,
                            'filename': metadata['filename'],
                            'file_type': metadata['file_type'],
                            'upload_date': metadata['upload_date'],
                            'chunk_count': 0
                        }
                    documents[doc_id]['chunk_count'] += 1
            
            return list(documents.values())
            
        except Exception as e:
            print(f"Error getting documents: {str(e)}")
            return []
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document from the vector store"""
        try:
            # Get all chunk IDs for this document
            results = self.collection.get(
                where={"document_id": document_id},
                include=["ids"]
            )
            
            if results['ids']:
                # Delete all chunks
                self.collection.delete(ids=results['ids'])
            
            return True
            
        except Exception as e:
            print(f"Error deleting document: {str(e)}")
            return False
    
    async def get_document_content(self, document_id: str) -> str:
        """Get full document content"""
        try:
            # Get all chunks for this document
            results = self.collection.get(
                where={"document_id": document_id},
                include=["documents", "metadatas"]
            )
            
            if results['documents']:
                # Sort by chunk index
                chunks_with_index = []
                for i, doc in enumerate(results['documents']):
                    chunk_index = results['metadatas'][i]['chunk_index']
                    chunks_with_index.append((chunk_index, doc))
                
                chunks_with_index.sort(key=lambda x: x[0])
                content = "\n\n".join([chunk[1] for chunk in chunks_with_index])
                return content
            
            return ""
            
        except Exception as e:
            print(f"Error getting document content: {str(e)}")
            return ""
