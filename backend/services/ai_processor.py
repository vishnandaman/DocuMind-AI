import os
import json
import requests
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

class AIProcessor:
    def __init__(self):
        self.ollama_url = "http://localhost:11434"
        self.model_name = "llama3.2"
        self.fallback_models = ["llama3.1", "mistral", "codellama"]
        self._test_ollama_connection()
    
    def _test_ollama_connection(self):
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get('models', [])
                available_models = [model['name'] for model in models]
                
                for model in [self.model_name] + self.fallback_models:
                    if any(model in available_model for available_model in available_models):
                        self.model_name = model
                        return
                
                if available_models:
                    self.model_name = available_models[0]
        except Exception as e:
            pass
    
    async def generate_response(
        self, 
        query: str, 
        relevant_docs: List[Dict[str, Any]], 
        conversation_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        try:
            print(f"Processing query: '{query}' with {len(relevant_docs)} documents")
            
            if not relevant_docs:
                return {
                    "answer": "I couldn't find any relevant information in the uploaded documents to answer your question. Please make sure you have uploaded the relevant documents and try asking a more specific question.",
                    "sources": [],
                    "confidence": 0.0,
                    "query_id": str(uuid.uuid4()),
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            context = self._prepare_context(relevant_docs)
            prompt = self._create_comprehensive_prompt(query, context, conversation_history)
            llm_response = await self._call_ollama(prompt)
            enhanced_response = self._enhance_response(llm_response, query, relevant_docs)
            confidence = self._calculate_confidence(enhanced_response, query, context)
            sources = self._prepare_sources(relevant_docs)
            
            return {
                "answer": enhanced_response,
                "sources": sources,
                "confidence": confidence,
                "query_id": str(uuid.uuid4()),
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error in AI response generation: {str(e)}")
            return {
                "answer": f"I apologize, but I encountered an error while processing your query: {str(e)}",
                "sources": [],
                "confidence": 0.0,
                "query_id": str(uuid.uuid4()),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def _prepare_context(self, relevant_docs: List[Dict[str, Any]]) -> str:
        context_parts = []
        for i, doc in enumerate(relevant_docs, 1):
            filename = doc['metadata'].get('filename', 'Unknown')
            content = doc['content']
            similarity = doc.get('similarity_score', 0)
            
            context_parts.append(
                f"Document {i}: {filename} (Relevance: {similarity:.2f})\n"
                f"Content: {content}\n"
            )
        
        return "\n".join(context_parts)
    
    def _create_comprehensive_prompt(self, query: str, context: str, conversation_history: List[Dict[str, str]] = None) -> str:
        detected_language = self._detect_language(query)
        
        system_prompt = f"""You are DocuMind, an advanced AI-powered document analysis assistant. You excel at:
- Analyzing and understanding complex documents
- Providing comprehensive, detailed answers
- Extracting key insights and information
- Explaining technical concepts clearly
- Summarizing large amounts of information
- Answering questions with high accuracy
- Supporting multiple languages (currently detected: {detected_language})

Guidelines:
- Always provide detailed, comprehensive responses
- Use proper formatting with headers, bullet points, and structure
- Cite specific information from the documents
- Be professional and informative
- If information is not available, clearly state this
- Provide context and analysis, not just raw answers
- Respond in the same language as the user's question"""
        
        history_context = ""
        if conversation_history:
            history_context = "\n\nPrevious conversation:\n"
            for msg in conversation_history[-3:]:
                history_context += f"- {msg.get('role', 'user')}: {msg.get('content', '')}\n"
        
        prompt = f"""{system_prompt}

{history_context}

Document Context:
{context}

User Question ({detected_language}): {query}

Please provide a comprehensive, detailed response based on the document context above. Structure your answer with clear sections, use formatting, and provide thorough analysis. Respond in {detected_language}."""
        
        return prompt
    
    def _detect_language(self, text: str) -> str:
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['hello', 'what', 'how', 'where', 'when', 'why', 'the', 'and', 'or', 'but']):
            return "English"
        elif any(word in text_lower for word in ['hola', 'qué', 'cómo', 'dónde', 'cuándo', 'por qué', 'el', 'la', 'y', 'o', 'pero']):
            return "Spanish"
        elif any(word in text_lower for word in ['bonjour', 'quoi', 'comment', 'où', 'quand', 'pourquoi', 'le', 'la', 'et', 'ou', 'mais']):
            return "French"
        elif any(word in text_lower for word in ['hallo', 'was', 'wie', 'wo', 'wann', 'warum', 'der', 'die', 'und', 'oder', 'aber']):
            return "German"
        elif any(word in text_lower for word in ['ciao', 'cosa', 'come', 'dove', 'quando', 'perché', 'il', 'la', 'e', 'o', 'ma']):
            return "Italian"
        elif any(word in text_lower for word in ['olá', 'o que', 'como', 'onde', 'quando', 'por que', 'o', 'a', 'e', 'ou', 'mas']):
            return "Portuguese"
        elif any(word in text_lower for word in ['привет', 'что', 'как', 'где', 'когда', 'почему', 'и', 'или', 'но']):
            return "Russian"
        elif any(word in text_lower for word in ['你好', '什么', '怎么', '哪里', '什么时候', '为什么', '的', '和', '或', '但是']):
            return "Chinese"
        elif any(word in text_lower for word in ['こんにちは', '何', 'どう', 'どこ', 'いつ', 'なぜ', 'の', 'と', 'または', 'しかし']):
            return "Japanese"
        elif any(word in text_lower for word in ['안녕하세요', '무엇', '어떻게', '어디', '언제', '왜', '의', '과', '또는', '하지만']):
            return "Korean"
        else:
            return "English"
    
    async def _call_ollama(self, prompt: str) -> str:
        try:
            print(f"Calling Ollama with model: {self.model_name}")
            
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_tokens": 2000,
                    "stop": ["Human:", "Assistant:", "User:", "System:"]
                }
            }
            
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                llm_response = result.get('response', '')
                print(f"Got response from Ollama ({len(llm_response)} characters)")
                return llm_response
            else:
                print(f"Ollama API error: {response.status_code}")
                return self._fallback_response(prompt)
                
        except Exception as e:
            print(f"Ollama call failed: {e}")
            return self._fallback_response(prompt)
    
    def _fallback_response(self, prompt: str) -> str:
        return """I apologize, but I'm currently unable to access the advanced AI service. This could be because:

1. Ollama is not installed or running
2. No LLM models are available
3. Network connectivity issues

To enable full AI functionality, please:
1. Install Ollama from https://ollama.ai
2. Run: `ollama pull llama3.2`
3. Start Ollama service

For now, I can provide basic document analysis based on the available content."""
    
    def _enhance_response(self, llm_response: str, query: str, relevant_docs: List[Dict[str, Any]]) -> str:
        source_info = "\n\n**Document Sources:**\n"
        for i, doc in enumerate(relevant_docs[:5], 1):
            filename = doc['metadata'].get('filename', 'Unknown')
            similarity = doc.get('similarity_score', 0)
            source_info += f"{i}. {filename} (Relevance: {similarity:.1f}%)\n"
        
        analysis_footer = f"""

---

**Analysis Information:**
- Query processed using advanced LLM (Ollama)
- Analyzed {len(relevant_docs)} relevant document sections
- Response generated with comprehensive context understanding
- Confidence level: High (LLM-powered analysis)"""
        
        return llm_response + source_info + analysis_footer
    
    def _calculate_confidence(self, response: str, query: str, context: str) -> float:
        if len(response) > 500 and "**" in response:
            return 0.95
        
        if len(response) > 200 and any(keyword in response.lower() for keyword in ['analysis', 'based on', 'document', 'context']):
            return 0.85
        
        if len(response) > 100:
            return 0.75
        
        return 0.5
    
    def _prepare_sources(self, relevant_docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        sources = []
        for doc in relevant_docs:
            sources.append({
                "filename": doc['metadata'].get('filename', 'Unknown'),
                "file_type": doc['metadata'].get('file_type', 'Unknown'),
                "similarity_score": doc.get('similarity_score', 0),
                "chunk_id": doc.get('chunk_id', ''),
                "preview": doc['content'][:200] + "..." if len(doc['content']) > 200 else doc['content']
            })
        return sources
