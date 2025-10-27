from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List
import asyncio

class EmbeddingService:
    def __init__(self):
        # Initialize the sentence transformer model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
    
    async def get_embedding(self, text: str) -> List[float]:
        """Generate embedding for a given text"""
        try:
            # Run the embedding generation in a thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            embedding = await loop.run_in_executor(
                None, 
                self.model.encode, 
                text
            )
            return embedding.tolist()
        except Exception as e:
            print(f"Error generating embedding: {str(e)}")
            # Return a zero vector as fallback
            return [0.0] * 384  # all-MiniLM-L6-v2 has 384 dimensions
    
    async def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        try:
            loop = asyncio.get_event_loop()
            embeddings = await loop.run_in_executor(
                None,
                self.model.encode,
                texts
            )
            return embeddings.tolist()
        except Exception as e:
            print(f"Error generating batch embeddings: {str(e)}")
            # Return zero vectors as fallback
            return [[0.0] * 384 for _ in texts]
